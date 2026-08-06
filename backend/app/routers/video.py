from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import Optional, Dict
import uuid
import os
import json
import logging

from app.services import detector_service
from app.utils.helpers import save_upload_file, allowed_file
from app.config import REPORT_FOLDER

router = APIRouter(prefix="/api/video", tags=["video"])

# Simple in-memory task store for upload/status polling.
# For production use a persistent DB or task queue.
TASKS: Dict[str, dict] = {}

logger = logging.getLogger(__name__)

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


def _process_video_task(task_id: str, video_path: str, description: Optional[str] = None):
    """Background task to run the full detector pipeline and update TASKS.
    This keeps the upload endpoint fast while processing happens asynchronously.
    """
    try:
        logger.info(f"[video] starting background processing for task {task_id}")
        TASKS[task_id]["status"] = "processing"
        TASKS[task_id]["progress"] = 5

        # Upload to Cloudinary for persistence if CLOUDINARY_URL is set
        final_video_url = f"/uploads/{os.path.basename(video_path)}"
        if os.environ.get("CLOUDINARY_URL"):
            try:
                import cloudinary.uploader
                logger.info(f"[video] Uploading to Cloudinary...")
                upload_result = cloudinary.uploader.upload(
                    video_path,
                    resource_type="video",
                    folder="construction_safety"
                )
                final_video_url = upload_result.get("secure_url")
                logger.info(f"[video] Cloudinary upload successful: {final_video_url}")
            except Exception as ce:
                logger.error(f"[video] Cloudinary upload failed: {ce}")

        # Run the heavy detectors (people, helmets, vests, falls, unsafe zones)
        report = detector_service.run_full_analysis(video_path)

        TASKS[task_id]["progress"] = 90

        # Save report to reports folder for later retrieval
        try:
            REPORT_FOLDER.mkdir(parents=True, exist_ok=True)
        except Exception:
            # REPORT_FOLDER may be a string in some environments
            os.makedirs(str(REPORT_FOLDER), exist_ok=True)

        report_path = os.path.join(str(REPORT_FOLDER), f"detection_{task_id}.json")
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        TASKS[task_id]["processed_video_url"] = final_video_url
        TASKS[task_id]["original_video_url"] = final_video_url
        TASKS[task_id]["report_path"] = str(report_path)
        TASKS[task_id]["status"] = "done"
        TASKS[task_id]["progress"] = 100

        logger.info(f"[video] finished processing task {task_id}")
    except Exception as e:
        logger.exception("Background processing failed")
        TASKS[task_id]["status"] = "error"
        TASKS[task_id]["message"] = str(e)
        TASKS[task_id]["progress"] = 0


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    description: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
):
    """
    Accept an uploaded video file and save it to the backend/uploads directory.
    Returns the fields the frontend expects so it can display the uploaded file
    immediately and poll status. Processing is scheduled in a background task.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file extension")

    try:
        # Save with a unique generated filename to avoid collisions
        dest_path = save_upload_file(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    task_id = str(uuid.uuid4())
    original_url = f"/uploads/{dest_path.name}"

    # Initialize task as queued and schedule background analysis
    TASKS[task_id] = {
        "status": "queued",
        "progress": 0,
        "original_video_url": original_url,
        "processed_video_url": None,
        "filename": dest_path.name,
        "description": description or "",
        "message": "",
    }

    # Schedule the heavy work after returning the response
    if background_tasks is not None:
        background_tasks.add_task(_process_video_task, task_id, str(dest_path), description)
    else:
        # Fallback: start in a separate thread if BackgroundTasks wasn't provided
        import threading
        threading.Thread(target=_process_video_task, args=(task_id, str(dest_path), description), daemon=True).start()

    return {
        "status": "success",
        "task_id": task_id,
        "original_video_url": original_url,
        "message": "file uploaded and analysis scheduled"
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
        "message": task.get("message", "")
    }
