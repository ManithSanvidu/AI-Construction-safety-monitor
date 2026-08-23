from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse

import os
import shutil
import tempfile

from ai.detector import detect_people

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


@app.post("/api/analyze")
async def analyze(
    file: UploadFile = File(...),
    zone_vertices: str | None = Form(None)
):

    temp_path = None

    try:
        # Create temporary video file
        suffix = os.path.splitext(file.filename or ".mp4")[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_path = temp_file.name

            shutil.copyfileobj(
                file.file,
                temp_file
            )

        # Run AI
        people_result = detect_people(temp_path)

        report = {
            "filename": file.filename,
            "people": people_result
        }

        return JSONResponse(content=report)

    except Exception as e:

        return JSONResponse(
            status_code=500,
            content={
                "error": str(e)
            }
        )

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
