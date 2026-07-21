import os
import shutil
import cv2
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import torch
import threading

router = APIRouter(prefix="/api/video", tags=["video"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Limit OpenCV threads to prevent memory explosion during concurrent FFmpeg decoding
cv2.setNumThreads(1) 

# Global thread lock for YOLO ML inference
model_lock = threading.Lock()

# Global state to prevent multiple OpenCV instances from opening the same file concurrently
active_streams = set()

# Global state to hold real-time incidents
current_video_stats = {
    "workers": 0,
    "helmets": 0,
    "vests": 0,
    "incidents": [],
    "total_incidents": 0,
    "compliance_score": 100
}

# We will lazy-load the model to avoid blocking startup
_model = None

def get_model():
    global _model
    if _model is None:
        ROUTER_DIR = os.path.dirname(os.path.abspath(__file__))
        PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(ROUTER_DIR)))
        model_path = os.path.normpath(os.path.join(PROJECT_ROOT, "models", "ppe_model.pt"))
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        torch.set_num_threads(1)
        _model = YOLO(model_path)
    return _model

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    file_path = os.path.abspath(os.path.join(UPLOAD_DIR, file.filename))
    
    # Read the file data asynchronously
    contents = await file.read()
    
    # Write file synchronously in a background thread to prevent corruption race conditions
    def write_file():
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
            buffer.flush()
            os.fsync(buffer.fileno())
            
    import asyncio
    await asyncio.to_thread(write_file)
        
    return {"status": "success", "filename": file.filename, "message": "Video uploaded successfully"}

def process_frame_sync(model, frame):
    """Synchronous CPU-bound wrapper to be run in a threadpool."""
    frame = cv2.resize(frame, (960, 540))
    
    # Run the custom PPE model! Filter out class 4 (NO VEST) to prevent false positives
    allowed_classes = [k for k in model.names.keys() if k != 4]
    with model_lock:
        results = model(frame, conf=0.35, verbose=False, classes=allowed_classes)
    
    # Extract real-time stats
    worker_count = 0
    helmet_count = 0
    vest_count = 0
    
    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        if cls_id == 5:
            worker_count += 1
        elif cls_id == 0:
            helmet_count += 1
        elif cls_id == 7:
            vest_count += 1

    # Infer missing PPE based on counts
    no_helmet = max(0, worker_count - helmet_count)
    no_vest = max(0, worker_count - vest_count)
    
    frame_incidents = []
    if no_helmet > 0:
        frame_incidents.append({"type": "No Helmet", "count": no_helmet, "status": "Pending"})
    if no_vest > 0:
        frame_incidents.append({"type": "No Safety Vest", "count": no_vest, "status": "Pending"})

    stats = {
        "workers": worker_count,
        "helmets": helmet_count,
        "vests": vest_count,
        "frame_incidents": frame_incidents
    }
    
    # The plot() method draws all the bounding boxes and labels for the custom classes automatically
    annotated_frame = results[0].plot()
            
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
    ret, buffer = cv2.imencode('.jpg', annotated_frame, encode_param)
    return ret, buffer, stats

async def generate_frames(video_path: str):
    # Concurrency lock
    if video_path in active_streams:
        # If the file is already being processed, wait up to 10 seconds to see if it frees up 
        # (happens during React strict mode double mounting where the first request is cancelled
        # but the thread takes a few seconds to release the lock)
        for _ in range(100):
            await asyncio.sleep(0.1)
            if video_path not in active_streams:
                break
        else:
            raise RuntimeError("Stream already active for this video")
            
    active_streams.add(video_path)

    model = get_model()
    
    # Run VideoCapture in a thread to prevent blocking
    cap = await asyncio.to_thread(cv2.VideoCapture, video_path)
    
    if not cap.isOpened():
        active_streams.discard(video_path)
        raise RuntimeError("Error opening video file")

    try:
        def read_and_process_sync():
            ret, frame = cap.read()
            if not ret:
                return False, None, None
            result = process_frame_sync(model, frame)
            del frame
            return result
            
        while True:
            # Offload heavy I/O and ML processing to background threadpool
            # This is CRITICAL to keep FastAPI event loop free for disconnect detection
            ret, buffer, stats = await asyncio.to_thread(read_and_process_sync)
            if not ret:
                break
            
            if buffer is None:
                continue
                
            # Update global state
            global current_video_stats
            
            # Create unique incidents for the table, capped at some max so it doesn't grow infinitely
            new_incidents = []
            for inc in stats["frame_incidents"]:
                new_incidents.append({
                    "id": current_video_stats["total_incidents"] + len(new_incidents) + 1,
                    "type": inc["type"],
                    "location": "Live Video",
                    "status": inc["status"]
                })
            
            # Simple compliance score calculation
            total_ppe_expected = stats["workers"] * 2
            total_ppe_found = stats["helmets"] + stats["vests"]
            compliance = 100
            if total_ppe_expected > 0:
                compliance = round((total_ppe_found / total_ppe_expected) * 100, 1)

            current_video_stats = {
                "workers": stats["workers"],
                "helmets": stats["helmets"],
                "vests": stats["vests"],
                "incidents": (new_incidents + current_video_stats["incidents"])[:20], # Keep last 20
                "total_incidents": current_video_stats["total_incidents"] + len(new_incidents),
                "compliance_score": compliance
            }
                
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Yield control back to event loop to allow cancellation detection and throttle the frame rate
            # Sleep for 0.06s to cap at ~15 FPS. This prevents the browser from being overwhelmed 
            # and throwing ERR_INSUFFICIENT_RESOURCES on low-memory machines.
            await asyncio.sleep(0.06)
            
    except asyncio.CancelledError:
        # Client gracefully disconnected
        pass
    except Exception as e:
        print(f"Error during video stream: {e}")
    finally:
        cap.release()
        active_streams.discard(video_path)

@router.get("/incidents")
async def get_video_incidents():
    return current_video_stats

@router.get("/stream")
async def stream_video_url(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
        
    try:
        return StreamingResponse(generate_frames(url), media_type="multipart/x-mixed-replace; boundary=frame")
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))

@router.get("/stream/{filename}")
async def stream_video(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video not found")
        
    try:
        # Note: In FastAPI, StreamingResponse consumes the generator directly.
        # If a RuntimeError is raised inside generate_frames *before* yielding, 
        # it might bubble up, but usually it happens when consumed.
        return StreamingResponse(generate_frames(file_path), media_type="multipart/x-mixed-replace; boundary=frame")
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))
