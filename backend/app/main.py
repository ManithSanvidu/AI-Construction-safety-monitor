import os
import sys

# Ensure backend root is in sys.path when running main.py directly
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import httpx
from app.config import API_TITLE, API_VERSION
from app.routers import auth, video, reports, stocks, chat, incidents, compliance, organizations, payment, contact

app = FastAPI(title=API_TITLE, version=API_VERSION)

# Configure CORS
# Allow configuring allowed origins via FRONTEND_ORIGINS env var (comma-separated). If not set,
# default to the deployed frontend (Vercel) + localhost development URLs.
frontend_origins_env = os.getenv("FRONTEND_ORIGINS")
if frontend_origins_env:
    try:
        ALLOWED_ORIGINS = [o.strip() for o in frontend_origins_env.split(",") if o.strip()]
    except Exception:
        ALLOWED_ORIGINS = []
else:
    ALLOWED_ORIGINS = [
        "https://sitewatchaiglobal.vercel.app",
        "https://www.sitewatchaiglobal.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

print(f"Configured CORS allowed origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
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
    """Performs a lightweight health check of AI microservice connectivity, ffmpeg, and MongoDB connectivity.
    """
    status = {"status": "healthy", "checks": {}}

    # AI Microservice readiness
    ai_service_url = os.environ.get("AI_SERVICE_URL", "http://localhost:8001")
    try:
        res = httpx.get(f"{ai_service_url}/", timeout=2.0)
        res.raise_for_status()
        status["checks"]["ai_microservice"] = {"ok": True}
    except Exception as e:
        status["checks"]["ai_microservice"] = {"ok": False, "error": str(e)}
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
