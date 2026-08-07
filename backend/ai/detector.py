"""
Main Safety Detection Module
Integrates person tracking and detection into a reusable function.
"""
from ultralytics import YOLO
import cv2
import os

_model = None
_class_mapping = None

def _init_model():
    global _model, _class_mapping
    if _model is not None:
        return

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.normpath(os.path.join(BASE_DIR, "..", "Dataset", "train", "weights", "best.pt"))
    if not os.path.exists(model_path):
        model_path = os.path.normpath(os.path.join(BASE_DIR, "..", "models", "yolo11n.pt"))
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    _model = YOLO(model_path)
    
    _class_mapping = {}
    CLASS_NAME_PATTERNS = {
        "Person": ["person", "worker"],
    }
    for cls_id, name in _model.names.items():
        name_lower = name.lower()
        if any(pat in name_lower for pat in CLASS_NAME_PATTERNS["Person"]):
            _class_mapping[cls_id] = "Person"

def detect_people(video_path):
    """
    Process video to detect and track people/workers.
    
    Args:
        video_path (str): Path to the video file
        
    Returns:
        dict: Detection statistics and person locations
    """
    _init_model()
    
    if not os.path.exists(video_path):
        return {"status": "error", "message": f"Video not found: {video_path}"}
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"status": "error", "message": "Cannot open video"}
    
    frame_number = 0
    total_workers_sum = 0
    max_workers = 0
    
    # We can store sample frames or detailed frame-by-frame data
    # For performance and memory, we'll return summary stats and per-frame counts.
    frame_data = []
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            frame = cv2.resize(frame, (960, 540))
            
            results = _model(frame, verbose=False)
            
            worker_count = 0
            confidences = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    label = _class_mapping.get(cls_id)
                    if label == "Person":
                        worker_count += 1
                        confidences.append(conf)
            
            max_workers = max(max_workers, worker_count)
            total_workers_sum += worker_count
            
            frame_data.append({
                "frame": frame_number,
                "worker_count": worker_count,
                "average_confidence": sum(confidences) / len(confidences) if confidences else 0
            })
            
    except Exception as e:
        cap.release()
        return {"status": "error", "message": str(e)}
        
    cap.release()
    
    avg_workers = total_workers_sum / frame_number if frame_number > 0 else 0
    
    return {
        "status": "success",
        "total_frames": frame_number,
        "max_workers": max_workers,
        "average_workers": round(avg_workers, 2),
        "frame_details": frame_data
    }