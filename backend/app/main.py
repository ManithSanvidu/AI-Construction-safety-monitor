import os
import sys

# Ensure backend root is in sys.path when running main.py directly
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.config import API_TITLE, API_VERSION
from app.routers import auth, video, reports, stocks, chat, incidents, compliance, organizations, payment, contact

# Define lifespan event to load model on startup
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly load the YOLO model so it's ready when a video is uploaded
    from app.routers.video import get_model
    try:
        print("Loading YOLO model on startup...")
        get_model()
        print("YOLO model loaded successfully.")
    except Exception as e:
        print(f"Failed to load YOLO model on startup: {e}")
    yield
    # Cleanup code here if needed

app = FastAPI(title=API_TITLE, version=API_VERSION, lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(video.router)
app.include_router(reports.router)
app.include_router(stocks.router)
app.include_router(chat.router)
app.include_router(incidents.router)
app.include_router(compliance.router)
app.include_router(organizations.router)
app.include_router(payment.router)
app.include_router(contact.router)

@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to Construction Safety Monitor API"}


@app.get("/health")
def health_check():
    """Performs a lightweight health check of model availability, ffmpeg, and MongoDB connectivity.
    This avoids raising an exception on import and returns structured status for monitoring.
    """
    status = {"status": "healthy", "checks": {}}

    # Model readiness
    try:
        from app.routers.video import get_model
        # get_model may be expensive; it's safe because lifespan already attempted to load it.
        get_model()
        status["checks"]["model"] = {"ok": True}
    except Exception as e:
        status["checks"]["model"] = {"ok": False, "error": str(e)}
        status["status"] = "degraded"

    # ffmpeg availability
    try:
        import shutil
        import subprocess
        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path:
            try:
                res = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
                ver = res.stdout.splitlines()[0] if res.stdout else "unknown"
                status["checks"]["ffmpeg"] = {"ok": True, "version": ver}
            except Exception as e:
                status["checks"]["ffmpeg"] = {"ok": False, "error": str(e)}
                status["status"] = "degraded"
        else:
            status["checks"]["ffmpeg"] = {"ok": False, "error": "ffmpeg not found in PATH"}
            status["status"] = "degraded"
    except Exception as e:
        status["checks"]["ffmpeg"] = {"ok": False, "error": str(e)}
        status["status"] = "degraded"

    # MongoDB connectivity
    try:
        from app.database import client as mongo_client
        # Ping the server to ensure connectivity
        mongo_client.admin.command('ping')
        status["checks"]["mongo"] = {"ok": True}
    except Exception as e:
        status["checks"]["mongo"] = {"ok": False, "error": str(e)}
        status["status"] = "degraded"

    return status


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
