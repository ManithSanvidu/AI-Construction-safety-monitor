"""
Safety Vest Detection Module
Ensures every worker is wearing a reflective safety vest.
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
    model_path = os.path.normpath(os.path.join(BASE_DIR, "..", "models", "vest_model.pt"))
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Vest model not found at {model_path}")
    
    _model = YOLO(model_path)

def detect_vests(video_path):
    """
    Process video to detect safety vest compliance and violations.
    
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
    total_vests = 0
    total_no_vests = 0
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
            
            vest_count = 0
            no_vest_count = 0
            worker_count = 0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # PERSON (class 2), SAFETY VEST (class 0), NO VEST (class 1)
                    if cls_id == 2:
                        worker_count += 1
                    elif cls_id == 0:
                        vest_count += 1
                    elif cls_id == 1:
                        no_vest_count += 1
            
            total_vests += vest_count
            total_no_vests += no_vest_count
            total_workers += worker_count
            
            if no_vest_count > 0:
                violations.append({
                    "frame": frame_number,
                    "no_vest_count": no_vest_count,
                    "worker_count": worker_count
                })
            
            frame_data.append({
                "frame": frame_number,
                "vest_count": vest_count,
                "no_vest_count": no_vest_count,
                "worker_count": worker_count
            })
            
    except Exception as e:
        cap.release()
        return {"status": "error", "message": str(e)}
        
    cap.release()
    
    overall_compliance = 0
    if total_workers > 0:
        overall_compliance = round((total_vests / total_workers) * 100, 1)
    
    return {
        "status": "success",
        "total_frames": frame_number,
        "overall_compliance": overall_compliance,
        "total_violations": len(violations),
        "violations": violations,
        "frame_details": frame_data
    }