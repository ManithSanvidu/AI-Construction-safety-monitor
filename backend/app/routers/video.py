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

def get_model():
    global _model
    if _model is None:
        ROUTER_DIR = os.path.dirname(os.path.abspath(__file__))
        
        possible_paths = [
            os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROUTER_DIR))), "models", "ppe_model.pt")),
            os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(ROUTER_DIR)), "models", "ppe_model.pt")),
            "/app/models/ppe_model.pt",
            os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROUTER_DIR))), "backend", "models", "ppe_model.pt"))
        ]
        
        model_path = None
        for p in possible_paths:
            if os.path.exists(p):
                model_path = p
                break
                
        if not model_path:
            raise FileNotFoundError(f"Model not found. Looked in: {possible_paths}")
            
        torch.set_num_threads(1)
        _model = YOLO(model_path)
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
            
        cap.release()
        out.release()
        
        if total_expected > 0:
            summary["compliance_score"] = round((total_found / total_expected) * 100, 1)
        
        if len(summary["incidents_list"]) > 50:
            summary["incidents_list"] = summary["incidents_list"][:50]
        
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
            "status": "done",
            "progress": 100,
            "detection_summary": summary,
            "processed_video_url": f"/uploads/videos/{serve_filename}",
            "db_doc": doc
        })
        
        logger.info(f"[Task {task_id}] Processing complete.")
        
    except Exception as e:
        logger.error(f"[Task {task_id}] Background processing failed: {e}")
        import traceback
        traceback.print_exc()
        _tasks[task_id] = {"status": "error", "message": str(e)}


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Save uploaded video and return immediately. Processing happens in background."""
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    file_id = str(uuid.uuid4())
    original_filename = f"{file_id}_original.mp4"
    raw_processed_filename = f"{file_id}_raw.mp4"
    final_processed_filename = f"{file_id}_processed.mp4"
    
    original_path = os.path.join(UPLOAD_DIR, original_filename)
    raw_processed_path = os.path.join(UPLOAD_DIR, raw_processed_filename)
    final_processed_path = os.path.join(UPLOAD_DIR, final_processed_filename)
    
    try:
        # Save file to disk
        contents = await file.read()
        with open(original_path, "wb") as buffer:
            buffer.write(contents)
        
        logger.info(f"Saved upload ({len(contents)} bytes) as {original_filename}")
        
        # Initialize task tracker
        _tasks[file_id] = {
            "status": "processing",
            "progress": 0,
            "original_filename": file.filename,
            "original_video_filename": original_filename,
            "start_time": time.time()
        }
        
        # Start background processing thread
        thread = threading.Thread(
            target=_background_process,
            args=(file_id, original_path, raw_processed_path, final_processed_path),
            daemon=True
        )
        thread.start()
        
        # Return IMMEDIATELY with the original video URL
        return {
            "status": "success",
            "message": "Video uploaded. Processing started in background.",
            "task_id": file_id,
            "original_video_url": f"/uploads/videos/{original_filename}"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload Error: {str(e)}")


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """Poll this endpoint to check if background processing is done."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "status": task.get("status", "unknown"),
        "progress": task.get("progress", 0),
        "detection_summary": task.get("detection_summary"),
        "processed_video_url": task.get("processed_video_url"),
    }


@router.get("/stream_live/{task_id}")
async def stream_live_video(task_id: str):
    """Streams MJPEG frames from the background YOLO processing live."""
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    async def event_generator():
        # Yield initial boundary so the browser immediately recognizes the multipart stream
        yield b'--frame\r\n'
        
        last_yielded = None
        while True:
            current_task = _tasks.get(task_id)
            if not current_task:
                break
                
            frame = current_task.get("latest_frame")
            if frame and frame != last_yielded:
                last_yielded = frame
                yield (b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n--frame\r\n')
            
            if current_task.get("status") in ["done", "error"]:
                break
                
            await asyncio.sleep(0.03)  # Approx 30 FPS polling
            
    return StreamingResponse(event_generator(), media_type="multipart/x-mixed-replace; boundary=frame")


@router.get("/history")
async def get_video_history():
    """Returns past processed videos from MongoDB."""
    def fetch_history():
        videos = list(db.video_analysis.find().sort("upload_date", -1).limit(10))
        for v in videos:
            v["_id"] = str(v["_id"])
        return videos
        
    history = await asyncio.to_thread(fetch_history)
    return {"status": "success", "data": history}
