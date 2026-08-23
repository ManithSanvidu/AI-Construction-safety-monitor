import os
import shutil
import tempfile
import logging
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse

from ai.detector import detect_people, _init_model, _model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Analysis Service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "service": "AI Analysis Service",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

@app.get("/model-status")
def model_status():
    from ai.detector import _find_model_path, get_candidates
    model_path = _find_model_path(get_candidates())
    exists = model_path is not None
    return {
        "model_path": str(model_path) if model_path else None,
        "exists": exists
    }

@app.get("/test-model")
def test_model():
    try:
        _init_model()
        return {"status": "success", "message": "Model loaded successfully"}
    except Exception as e:
        logger.exception("Error loading model in /test-model")
        return {"status": "error", "message": str(e)}

@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    zone_vertices: str | None = Form(None)
):
    temp_path = None

    try:
        # Create temporary video file
        suffix = os.path.splitext(file.filename or ".mp4")[1]
        
        logger.info(f"Received file: {file.filename}")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)
            
        file_size = os.path.getsize(temp_path)
        logger.info(f"Saved temporary video to {temp_path} (size: {file_size} bytes)")

        # Run AI
        logger.info("Running AI detection...")
        people_result = detect_people(temp_path)
        
        logger.info(f"AI detection result: {people_result.get('status')} - frames processed: {people_result.get('total_frames')} - detections max: {people_result.get('max_workers')}")

        report = {
            "filename": file.filename,
            "people": people_result
        }

        return JSONResponse(content=report)

    except Exception as e:
        logger.exception(f"Exception during /api/analyze: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info(f"Cleaned up temporary file: {temp_path}")
