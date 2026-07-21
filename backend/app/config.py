from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR=Path(__file__).resolve().parent.parent

UPLOAD_FOLDER=BASE_DIR/"uploads"
REPORT_FOLDER=BASE_DIR/"reports"

UPLOAD_FOLDER.mkdir(exist_ok=True)
REPORT_FOLDER.mkdir(exist_ok=True)

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017"
)

ALLOWED_VIDEO_EXTENSIONS = {
    ".mp4",
    ".avi",
    ".mov",
    ".mkv"
}

MODEL_DIR=BASE_DIR.parent/"models"

PERSON_MODEL = MODEL_DIR / "yolo11n.pt"
PPE_MODEL = MODEL_DIR / "helmet_model.pt"

API_TITLE="Construction Site Safety Monitor API"
API_VERSION="1.0.0"

CONFIDENCE_THRESHOLD = 0.40

COMPANY_NAME = "Construction Safety Monitor"

TIMEZONE = "Asia/Colombo"