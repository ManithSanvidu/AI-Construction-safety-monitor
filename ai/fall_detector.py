"""
Fall Detection Module
Detects if a worker has fallen using bounding box aspect ratio heuristics.
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

def detect_falls(video_path):
    """
    Process video to detect if any workers have fallen.
    
    Args:
        video_path (str): Path to the video file
        
    Returns:
        dict: Detection statistics and fall incidents
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
    incidents = []
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            frame = cv2.resize(frame, (960, 540))
            
            results = _model(frame, verbose=False)
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    label = _class_mapping.get(cls_id)
                    
                    if label == "Person":
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        w = x2 - x1
                        h = y2 - y1
                        
                        # Heuristic: If width is significantly greater than height, it's likely a fall
                        if w > h * 1.5:
                            incidents.append({
                                "frame": frame_number,
                                "bbox": [x1, y1, x2, y2]
                            })
                            
    except Exception as e:
        cap.release()
        return {"status": "error", "message": str(e)}
        
    cap.release()
    
    return {
        "status": "success",
        "total_frames": frame_number,
        "total_falls_detected": len(incidents),
        "incidents": incidents
    }
