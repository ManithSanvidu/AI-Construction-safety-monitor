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
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
