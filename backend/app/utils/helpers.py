import shutil
from pathlib import Path
from uuid import uuid4
from datetime import datetime

from fastapi import UploadFile

from app.config import(
    UPLOAD_FOLDER,
    ALLOWED_VIDEO_EXTENSIONS,
)

def allowed_file(filename:str)->bool:
    """
    Check whether the uploaded file has a valid extension.
    """
    extension = Path(filename).suffix.lower()

    return extension in ALLOWED_VIDEO_EXTENSIONS

def generate_filename(filename:str)->str:
    """
    Generate a unique filename while preserving the original file extension.
    """

    extension = Path(filename).suffix.lower()

    unique_name=f"{uuid4().hex}{extension}"

    return unique_name

def save_upload_file(upload_file:UploadFile)->Path:
    """ Save an uploaded video to the uploads folder. """

    filename = generate_filename(upload_file.filename)

    destination = UPLOAD_FOLDER / filename

    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return destination

def format_datetime(dt: datetime) -> str:
    """ Convert datetime into a readable format. """

    return dt.strftime("%Y-%m-%d %H:%M:%S")

def confidence_percentage(confidence: float) -> str:
    """ Convert confidence score to percentage. """
    return f"{confidence * 100:.2f}%"

def create_directory(directory: Path):
    """Create directory if it does not exist."""
    directory.mkdir(
        parents=True,
        exist_ok=True
    )


def delete_file(file_path: Path):
    """Delete a file safely."""
    if file_path.exists():
        file_path.unlink()