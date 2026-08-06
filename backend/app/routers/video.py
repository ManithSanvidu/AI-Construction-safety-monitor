from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/video", tags=["video"])

# Simple lazy model loader. Keeps state in module-level variable so
# the rest of the app can call get_model() without failing import.
_MODEL = None


def get_model():
    """Return a YOLO model object if available. This function will try to
    import and load a model only once. If the ultralytics package (or other
    model dependency) isn't installed, this will raise ImportError when used.

    The function intentionally avoids heavy work during import so the app can
    still start; callers (like the lifespan handler) can catch errors and
    report degraded status.
    """
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    # Try to import a real model if available. This is best-effort; if the
    # environment doesn't have the dependency or the weights, we fall back to
    # a lightweight stub that raises on actual inference attempts.
    try:
        # Attempt to import ultralytics.YOLO (common for YOLOv8 setups)
        from ultralytics import YOLO  # type: ignore

        # Example: try to load a local weights file path from env var, else
        # return a model object that may try to download weights when used.
        import os

        weights = os.environ.get("YOLO_WEIGHTS_PATH", "yolov8n.pt")
        try:
            _MODEL = YOLO(weights)
        except Exception:
            # If loading weights fails, still keep the YOLO class so callers
            # can decide what to do. Store a lambda that will raise a clear
            # error when inference is attempted.
            def _raise_on_infer(*args, **kwargs):
                raise RuntimeError("YOLO model class is available but weights failed to load")

            _MODEL = _raise_on_infer

        return _MODEL
    except Exception:
        # If ultralytics (or other expected deps) isn't present, provide a
        # stub object that raises a clear error when used. This prevents
        # import-time crashes while allowing health checks to detect degraded
        # status.
        class ModelStub:
            def __call__(self, *args, **kwargs):
                raise RuntimeError("YOLO model is not available in this environment")

        _MODEL = ModelStub()
        return _MODEL


@router.get("/")
async def ping():
    return {"message": "video router OK"}


@router.post("/upload")
async def upload_video(file: UploadFile = File(...), description: Optional[str] = None):
    """Accept an uploaded video file and save it to the uploads directory.

    This endpoint is minimal: it saves the uploaded file and returns the path.
    The real project likely performs processing/inference after saving the file.
    """
    import os

    # Resolve uploads dir relative to package root
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uploads_dir = os.path.join(base_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    dest_path = os.path.join(uploads_dir, file.filename)
    try:
        with open(dest_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    return {"filename": file.filename, "path": f"/uploads/{file.filename}", "description": description}
