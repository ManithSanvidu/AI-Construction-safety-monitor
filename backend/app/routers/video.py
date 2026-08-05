import os
import cv2
import asyncio
import time
import uuid
import datetime
import subprocess
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from ultralytics import YOLO
import torch
import threading
from shapely.geometry import Point, Polygon
from app.database import db

# Optional helper to download model from a URL if not present locally
import requests

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["video"])

# Use a temporary directory for processing
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global thread lock for YOLO ML inference
model_lock = threading.Lock()

# We will lazy-load the model to avoid blocking startup
_model = None

# In-memory task tracker for background processing
_tasks = {}  # task_id -> { status: "processing"|"done"|"error", data: {...} }


def _download_model(url: str, dest_path: str, chunk_size: int = 1 << 20):
    """Download a file from `url` to `dest_path` streaming to disk.
    Overwrites existing file on success.
    Raises exception on failure.
    """
    tmp_path = dest_path + ".downloading"
    logger.info(f"Downloading model from {url} to {dest_path} ...")
    with requests.get(url, stream=True, timeout=300) as r:
        r.raise_for_status()
        with open(tmp_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
    os.replace(tmp_path, dest_path)
    logger.info("Model download complete")


def get_model():
    global _model
    if _model is None:
        ROUTER_DIR = os.path.dirname(os.path.abspath(__file__))

        # Allow explicit override via env var
        env_path = os.environ.get("YOLO_MODEL_PATH")
        possible_paths = []
        if env_path:
            possible_paths.append(os.path.normpath(env_path))

        # Common locations (including actual file in this repo)
        repo_root = os.path.normpath(os.path.join(ROUTER_DIR, "..", "..", ".."))
        possible_paths += [
            os.path.join(repo_root, "yolo11n.pt"),
            os.path.join(repo_root, "yolo.pt"),
            os.path.join(repo_root, "models", "ppe_model.pt"),
            os.path.join(repo_root, "backend", "models", "ppe_model.pt"),
            "/app/models/ppe_model.pt",
        ]

        model_path = None
        for p in possible_paths:
            if p and os.path.exists(p):
                model_path = p
                logger.info(f"Found YOLO model at: {model_path}")
                break

        # If model not found locally, try to download using MODEL_URL env var
        if not model_path:
            model_url = os.environ.get("MODEL_URL")
            if model_url:
                target_dir = os.path.join(repo_root, "backend", "models")
                os.makedirs(target_dir, exist_ok=True)
                dest = os.path.join(target_dir, "ppe_model.pt")
                try:
                    _download_model(model_url, dest)
                    model_path = dest
                except Exception as ex:
                    logger.error(f"Failed to download model from MODEL_URL: {ex}")
                    raise FileNotFoundError(f"Failed to download model from MODEL_URL: {ex}")

        if not model_path:
            raise FileNotFoundError(f"Model not found. Looked in: {possible_paths} and no MODEL_URL provided")

        # Limit threads to avoid CPU contention in containers
        try:
            torch.set_num_threads(1)
        except Exception:
            pass

        logger.info(f"Loading YOLO model from {model_path} ...")
        _model = YOLO(model_path)
        logger.info("YOLO model loaded.")
    return _model


def _convert_to_h264(input_path: str, output_path: str) -> bool:
    """Convert mp4v video to browser-playable H.264 using FFmpeg."""
    try:
        subprocess.run(
            ['ffmpeg', '-y', '-i', input_path,
             '-vcodec', 'libx264', '-preset', 'ultrafast', '-crf', '23',
             '-pix_fmt', 'yuv420p',
             '-movflags', '+faststart',
             output_path],
            check=True, capture_output=True, timeout=300
        )
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"FFmpeg H.264 conversion successful: {output_path}")
            return True
        return False
    except FileNotFoundError:
        logger.warning("FFmpeg not installed — processed video will be in mp4v format")
        return False
    except Exception as e:
        logger.warning(f"FFmpeg conversion failed: {e}")
        return False


def _background_process(task_id: str, input_path: str, raw_output_path: str, final_output_path: str):
    logger.info(f"[Task {task_id}] Background processing started for {input_path}")
    try:
        # Extract the very first frame immediately so the live MJPEG stream doesn't time out or show a black screen while the model loads.
        cap_temp = cv2.VideoCapture(input_path)
        if cap_temp.isOpened():
            ret, frame = cap_temp.read()
            if ret:
                ret_jpg, buffer = cv2.imencode('.jpg', frame)
                if ret_jpg:
                    _tasks[task_id]["latest_frame"] = buffer.tobytes()
        cap_temp.release()

        model = get_model()
        
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            _tasks[task_id] = {"status": "error", "message": "Cannot open video file"}
            return

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0 or fps != fps:
            fps = 30.0
        
        total_frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = 960
        height = 540
        
        # Write with mp4v (works on all platforms), convert to H.264 afterward
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(raw_output_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            cap.release()
            _tasks[task_id] = {"status": "error", "message": "Failed to create video writer"}
            return
        
        summary = {
            "max_workers": 0,
            "max_helmets": 0,
            "max_vests": 0,
            "total_incidents": 0,
            "compliance_score": 100,
            "incidents_list": []
        }
        
        frame_count = 0
        total_expected = 0
        total_found = 0
        last_annotated = None
        
        # Dynamic skip rate based on video length
        if total_frame_count > 900:
            skip_rate = 8
        elif total_frame_count > 300:
            skip_rate = 5
        else:
            skip_rate = 3

        allowed_classes = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            if frame_count % skip_rate != 1:
                if last_annotated is not None:
                    out.write(last_annotated)
                continue
                
            frame = cv2.resize(frame, (width, height))
            
            if allowed_classes is None:
                allowed_classes = [k for k in model.names.keys() if k != 4]
                
            zone_vertices = [(300, 300), (600, 300), (800, 500), (200, 500)]
            polygon = Polygon(zone_vertices)
            
            # Draw the unsafe zone polygon on the frame before passing to YOLO, so it shows up in output
            cv2.polylines(frame, [__import__('numpy').array(zone_vertices, __import__('numpy').int32)], True, (0, 0, 255), 2)
            
            with model_lock:
                results = model(frame, conf=0.35, verbose=False, classes=allowed_classes)
            
            worker_count = 0
            helmet_count = 0
            vest_count = 0
            
            fall_count = 0
            breach_count = 0
            
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                if cls_id == 5:
                    worker_count += 1
                    
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    w = x2 - x1
                    h = y2 - y1
                    
                    # Fall detection heuristic
                    if w > h * 1.5:
                        fall_count += 1
                        
                    # Unsafe zone heuristic
                    feet_x = int((x1 + x2) / 2)
                    feet_y = int(y2)
                    if polygon.contains(Point(feet_x, feet_y)):
                        breach_count += 1
                        
                elif cls_id == 0:
                    helmet_count += 1
                elif cls_id == 7:
                    vest_count += 1
                    
            summary["max_workers"] = max(summary["max_workers"], worker_count)
            summary["max_helmets"] = max(summary["max_helmets"], helmet_count)
            summary["max_vests"] = max(summary["max_vests"], vest_count)
            
            total_expected += worker_count * 2
            total_found += helmet_count + vest_count

            no_helmet = max(0, worker_count - helmet_count)
            no_vest = max(0, worker_count - vest_count)
            
            if no_helmet > 0 or no_vest > 0 or fall_count > 0 or breach_count > 0:
                if no_helmet > 0:
                    summary["incidents_list"].append({"type": "No Helmet", "frame": frame_count, "count": no_helmet})
                    summary["total_incidents"] += no_helmet
                if no_vest > 0:
                    summary["incidents_list"].append({"type": "No Safety Vest", "frame": frame_count, "count": no_vest})
                    summary["total_incidents"] += no_vest
                if fall_count > 0:
                    summary["incidents_list"].append({"type": "Fall Detected", "frame": frame_count, "count": fall_count})
                    summary["total_incidents"] += fall_count
                if breach_count > 0:
                    summary["incidents_list"].append({"type": "Unsafe Zone Breach", "frame": frame_count, "count": breach_count})
                    summary["total_incidents"] += breach_count

            annotated_frame = results[0].plot()
            last_annotated = annotated_frame
            out.write(annotated_frame)
            
            # Save latest frame for live MJPEG streaming
            ret_jpg, buffer = cv2.imencode('.jpg', annotated_frame)
            if ret_jpg:
                _tasks[task_id]["latest_frame"] = buffer.tobytes()
            
            # Update progress (YOLO = 0-90%, FFmpeg = 90-100%)
            if total_frame_count > 0:
                _tasks[task_id]["progress"] = min(90, int((frame_count / total_frame_count) * 90))
            
            # Live compliance score and summary for real-time frontend updates
            if total_expected > 0:
                summary["compliance_score"] = round((total_found / total_expected) * 100, 1)
            
            _tasks[task_id]["detection_summary"] = dict(summary)
            
        cap.release()
        out.release()
        
        if len(summary["incidents_list"]) > 50:
            summary["incidents_list"] = summary["incidents_list"][:50]
        
        # Final update
        _tasks[task_id]["detection_summary"] = summary
        
        # Convert mp4v to browser-playable H.264
        _tasks[task_id]["progress"] = 92
        serve_filename = os.path.basename(final_output_path)
        
        if _convert_to_h264(raw_output_path, final_output_path):
            # H.264 conversion succeeded — serve the H.264 file, delete raw mp4v
            try:
                os.remove(raw_output_path)
            except OSError:
                pass
        else:
            # FFmpeg not available — rename mp4v file to the final name as fallback
            try:
                os.rename(raw_output_path, final_output_path)
            except OSError:
                serve_filename = os.path.basename(raw_output_path)
        
        _tasks[task_id]["progress"] = 98
        
        # Save to MongoDB
        try:
            doc = {
                "filename": _tasks[task_id].get("original_filename", "unknown"),
                "original_video_url": f"/uploads/videos/{_tasks[task_id].get('original_video_filename', '')}",
                "processed_video_url": f"/uploads/videos/{serve_filename}",
                "upload_date": datetime.datetime.utcnow(),
                "detection_summary": summary,
                "processing_time": round(time.time() - _tasks[task_id].get("start_time", time.time()), 2)
            }
            db.video_analysis.insert_one(doc)
            doc["_id"] = str(doc["_id"])
        except Exception as e:
            logger.error(f"Failed to save to MongoDB: {e}")
            doc = {}
        
        _tasks[task_id].update({
{