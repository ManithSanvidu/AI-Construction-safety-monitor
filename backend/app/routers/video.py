from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional, Dict
import uuid
import os

router = APIRouter(prefix="/api/video", tags=["video"])

# Simple in-memory task store for upload/status polling.
# For production use a persistent DB or task queue.
TASKS: Dict[str, dict] = {}

# SIMPLE LAZY MODEL LOADER. Keeps state in module-level variable so
# the rest of the app can call get_model() without failing import.
MODEL = None

def get_model():
    """Return a YOLO model object if available. This function tries to
    import and load a model only once. If the environment doesn't have
    the actual weights or the ultralytics package, it will raise an
    ImportError when called (main.py attempts to call this at startup).
    """
    global MODEL
    if MODEL is not None:
        return MODEL

    # Try to import a real model if present. If not available, leave MODEL as None.
    try:
        # Example: load ultralytics YOLO if installed and weights available
        from ultralytics import YOLO
        weights = os.environ.get("YOLO_WEIGHTS_PATH", "yolo11n.pt")
        MODEL = YOLO(weights)
        return MODEL
    except Exception:
        # If loading a real model fails, keep MODEL as None. The rest of the app
        # can still operate (uploads and static serving) and health endpoints
        # will report model errors.
        raise


@router.get("/")
async def root():
    return {"message": "video router OK"}


@router.post("/upload")
async def upload_video(file: UploadFile = File(...), description: Optional[str] = None):
    """
    Accept an uploaded video file and save it to the backend/uploads directory.
    Returns the fields the frontend expects so it can display the uploaded file
    immediately and poll status.
    """
    # Determine uploads directory relative to backend/app/routers
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uploads_dir = os.path.join(base_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    dest_path = os.path.join(uploads_dir, file.filename)
    try:
        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    task_id = str(uuid.uuid4())
    original_url = f"/uploads/{file.filename}"

    # For now, mark processing as immediately done. If you have/implement
    # background processing, update TASKS[task_id] from that worker.
    TASKS[task_id] = {
        "status": "done",
        "progress": 100,
        "original_video_url": original_url,
        "processed_video_url": original_url,
        "filename": file.filename,
        "description": description or "",
    }

    return {
        "status": "success",
        "task_id": task_id,
        "original_video_url": original_url,
        "message": "file uploaded"
    }


@router.get("/status/{task_id}")
async def video_status(task_id: str):
    """
    Return progress and (original/processed) video URLs for a given task_id.
    Frontend polls this endpoint at /api/video/status/{task_id}.
    """
    task = TASKS.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return {
        "status": task.get("status", "processing"),
        "progress": task.get("progress", 0),
        "original_video_url": task.get("original_video_url"),
        "processed_video_url": task.get("processed_video_url"),
        "message": ""
    }
