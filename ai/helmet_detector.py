"""
Helmet Detection Module
Detects whether every worker is wearing a safety helmet and identifies violations.
"""
from ultralytics import YOLO
import cv2
import os

_model = None

def _init_model():
    global _model
    if _model is not None:
        return

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.normpath(os.path.join(BASE_DIR, "..", "models", "helmet_model.pt"))
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Helmet model not found at {model_path}")
    
    _model = YOLO(model_path)

def detect_helmets(video_path):
    """
    Process video to detect helmet compliance and violations.
    
    Args:
        video_path (str): Path to the video file
        
    Returns:
        dict: Detection statistics and violations
    """
    try:
        _init_model()
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
    if not os.path.exists(video_path):
        return {"status": "error", "message": f"Video not found: {video_path}"}
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"status": "error", "message": "Cannot open video"}
    
    frame_number = 0
    total_helmets = 0
    total_no_helmets = 0
    total_workers = 0
    
    frame_data = []
    violations = []
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            frame = cv2.resize(frame, (960, 540))
            
            results = _model(frame, verbose=False)
            
            helmet_count = 0
            no_helmet_count = 0
            worker_count = 0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # PERSON (class 2), HELMET (class 0), NO HELMET (class 1)
                    if cls_id == 2:
                        worker_count += 1
                    elif cls_id == 0:
                        helmet_count += 1
                    elif cls_id == 1:
                        no_helmet_count += 1
            
            total_helmets += helmet_count
            total_no_helmets += no_helmet_count
            total_workers += worker_count
            
            if no_helmet_count > 0:
                violations.append({
                    "frame": frame_number,
                    "no_helmet_count": no_helmet_count,
                    "worker_count": worker_count
                })
            
            frame_data.append({
                "frame": frame_number,
                "helmet_count": helmet_count,
                "no_helmet_count": no_helmet_count,
                "worker_count": worker_count
            })
            
    except Exception as e:
        cap.release()
        return {"status": "error", "message": str(e)}
        
    cap.release()
    
    overall_compliance = 0
    if total_workers > 0:
        overall_compliance = round((total_helmets / total_workers) * 100, 1)
    
    return {
        "status": "success",
        "total_frames": frame_number,
        "overall_compliance": overall_compliance,
        "total_violations": len(violations),
        "violations": violations,
        "frame_details": frame_data
    }