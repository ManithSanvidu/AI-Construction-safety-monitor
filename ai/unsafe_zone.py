"""
Unsafe Zone Detection Module
Detects if workers enter restricted or unsafe zones.
"""
from ultralytics import YOLO
import cv2
import os
import numpy as np
from shapely.geometry import Point, Polygon

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

def detect_unsafe_zone(video_path, zone_vertices=None):
    """
    Process video to detect breaches into an unsafe zone.
    
    Args:
        video_path (str): Path to the video file
        zone_vertices (list): List of (x,y) tuples defining the polygon.
                              Defaults to [(400,400),(800,400),(900,650),(300,650)] if not provided.
                              
    Returns:
        dict: Detection statistics and breach incidents
    """
    if zone_vertices is None:
        zone_vertices = [(400, 400), (800, 400), (900, 650), (300, 650)]
        
    try:
        _init_model()
    except Exception as e:
        return {"status": "error", "message": str(e)}
        
    if not os.path.exists(video_path):
        return {"status": "error", "message": f"Video not found: {video_path}"}
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"status": "error", "message": "Cannot open video"}
    
    polygon = Polygon(zone_vertices)
    frame_number = 0
    breaches = []
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_number += 1
            frame = cv2.resize(frame, (960, 540))
            
            results = _model(frame, verbose=False)
            
            frame_breach = False
            breach_points = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    label = _class_mapping.get(cls_id)
                    
                    if label == "Person":
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        
                        feet_x = int((x1 + x2) / 2)
                        feet_y = int(y2)
                        feet_point = Point(feet_x, feet_y)
                        
                        if polygon.contains(feet_point):
                            frame_breach = True
                            breach_points.append((feet_x, feet_y))
                            
            if frame_breach:
                breaches.append({
                    "frame": frame_number,
                    "breach_points": breach_points
                })
                            
    except Exception as e:
        cap.release()
        return {"status": "error", "message": str(e)}
        
    cap.release()
    
    return {
        "status": "success",
        "total_frames": frame_number,
        "total_breaches": len(breaches),
        "breaches": breaches
    }