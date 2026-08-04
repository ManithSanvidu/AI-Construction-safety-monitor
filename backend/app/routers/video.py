import os
import shutil
import cv2
import asyncio
import time
import uuid
import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from ultralytics import YOLO
import torch
import threading
from app.database import db

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

router = APIRouter(prefix="/api/video", tags=["video"])

# Use a temporary directory for processing
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global thread lock for YOLO ML inference
model_lock = threading.Lock()

# We will lazy-load the model to avoid blocking startup
_model = None

def get_model():
    global _model
    if _model is None:
        import os
        ROUTER_DIR = os.path.dirname(os.path.abspath(__file__))
        
        possible_paths = [
            # 1. Local execution from project root (Construction-safety-monitor/models)
            os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROUTER_DIR))), "models", "ppe_model.pt")),
            
            # 2. Local execution or Docker where backend is the root (backend/models)
            os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(ROUTER_DIR)), "models", "ppe_model.pt")),
            
            # 3. Docker container specific paths
            "/app/models/ppe_model.pt",
            
            # 4. Same directory as the backend run.py
            os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(ROUTER_DIR))), "backend", "models", "ppe_model.pt"))
        ]
        
        model_path = None
        for p in possible_paths:
            if os.path.exists(p):
                model_path = p
                break
                
        if not model_path:
            raise FileNotFoundError(f"Model not found. Looked in: {possible_paths}")
            
        torch.set_num_threads(1)
        _model = YOLO(model_path)
    return _model

def process_video_locally(input_path: str, output_path: str, model):
    """Processes the video entirely locally and returns the detection summary."""
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError("Error opening video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps != fps:
        fps = 30.0
        
    width = 960
    height = 540
    
    # Use mp4v codec for output. Cloudinary will transcode it for web compatibility.
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    summary = {
        "max_workers": 0,
        "max_helmets": 0,
        "max_vests": 0,
        "total_incidents": 0,
        "compliance_score": 100,
        "incidents_list": []
    }
    
    frame_count = 0
    total_expected = 0
    total_found = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        frame = cv2.resize(frame, (width, height))
        
        # Run the custom PPE model! Filter out class 4 (NO VEST) to prevent false positives
        allowed_classes = [k for k in model.names.keys() if k != 4]
        with model_lock:
            results = model(frame, conf=0.35, verbose=False, classes=allowed_classes)
        
        worker_count = 0
        helmet_count = 0
        vest_count = 0
        
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            if cls_id == 5:
                worker_count += 1
            elif cls_id == 0:
                helmet_count += 1
            elif cls_id == 7:
                vest_count += 1
                
        # Update maximums seen in the video
        summary["max_workers"] = max(summary["max_workers"], worker_count)
        summary["max_helmets"] = max(summary["max_helmets"], helmet_count)
        summary["max_vests"] = max(summary["max_vests"], vest_count)
        
        total_expected += worker_count * 2
        total_found += helmet_count + vest_count

        no_helmet = max(0, worker_count - helmet_count)
        no_vest = max(0, worker_count - vest_count)
        
        if no_helmet > 0 or no_vest > 0:
            if no_helmet > 0:
                summary["incidents_list"].append({"type": "No Helmet", "frame": frame_count, "count": no_helmet})
                summary["total_incidents"] += no_helmet
            if no_vest > 0:
                summary["incidents_list"].append({"type": "No Safety Vest", "frame": frame_count, "count": no_vest})
                summary["total_incidents"] += no_vest

        # Draw annotations and write to output
        annotated_frame = results[0].plot()
        out.write(annotated_frame)
        
    cap.release()
    out.release()
    
    # Calculate overall compliance
    if total_expected > 0:
        summary["compliance_score"] = round((total_found / total_expected) * 100, 1)
        
    return summary

@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    start_time = time.time()
    file_id = str(uuid.uuid4())
    
    temp_original = os.path.join(UPLOAD_DIR, f"{file_id}_original.mp4")
    temp_processed = os.path.join(UPLOAD_DIR, f"{file_id}_processed.mp4")
    
    try:
        # 1. Save locally for processing
        contents = await file.read()
        with open(temp_original, "wb") as buffer:
            buffer.write(contents)
            
        # 2. Upload original to Cloudinary
        def upload_original():
            return cloudinary.uploader.upload(temp_original, resource_type="video")
        
        original_upload = await asyncio.to_thread(upload_original)
        original_url = original_upload.get("secure_url")
        
        # 3. Process video locally
        model = get_model()
        summary = await asyncio.to_thread(process_video_locally, temp_original, temp_processed, model)
        
        # 4. Upload processed video to Cloudinary
        def upload_processed():
            return cloudinary.uploader.upload(temp_processed, resource_type="video")
            
        processed_upload = await asyncio.to_thread(upload_processed)
        processed_url = processed_upload.get("secure_url")
        
        processing_time = round(time.time() - start_time, 2)
        
        # 5. Save to MongoDB
        doc = {
            "filename": file.filename,
            "original_video_url": original_url,
            "processed_video_url": processed_url,
            "upload_date": datetime.datetime.utcnow(),
            "detection_summary": summary,
            "processing_time": processing_time
        }
        
        # Insert asynchronously
        await asyncio.to_thread(db.video_analysis.insert_one, doc)
        
        # Convert ObjectId to string for JSON serialization
        doc["_id"] = str(doc["_id"])
        
        return {
            "status": "success",
            "message": "Video processed and uploaded successfully",
            "data": doc
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        if "api_key" in str(e).lower() or "must supply api_key" in str(e).lower():
            raise HTTPException(status_code=500, detail="Cloudinary API key is missing. Please set CLOUDINARY_URL in Render environment variables.")
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
        
    finally:
        # 6. Delete temporary local files
        if os.path.exists(temp_original):
            os.remove(temp_original)
        if os.path.exists(temp_processed):
            os.remove(temp_processed)

@router.get("/history")
async def get_video_history():
    """Returns past processed videos from MongoDB."""
    def fetch_history():
        videos = list(db.video_analysis.find().sort("upload_date", -1).limit(10))
        for v in videos:
            v["_id"] = str(v["_id"])
        return videos
        
    history = await asyncio.to_thread(fetch_history)
    return {"status": "success", "data": history}
