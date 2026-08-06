"""
Helmet Detection Module
Detects whether every worker is wearing a safety helmet and identifies violations.
"""
from ultralytics import YOLO
import cv2
import os
import logging

logger = logging.getLogger(__name__)

_model = None
_class_map = None


def _find_model_path(candidates):
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def _init_model():
    global _model, _class_map
    if _model is not None:
        return

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(BASE_DIR, "..", "models", "helmet_model.pt")),
        os.path.normpath(os.path.join(BASE_DIR, "..", "yolo11n.pt")),
        os.path.normpath(os.path.join(BASE_DIR, "..", "models", "yolo11n.pt")),
    ]

    model_path = _find_model_path(candidates)
    if model_path is None:
        raise FileNotFoundError(f"Helmet model not found. Checked: {candidates}")

    logger.info(f"Loading helmet model from: {model_path}")
    _model = YOLO(model_path)

    # Build class map for helmet/person/no_helmet
    _class_map = {}
    try:
        for cid, name in _model.names.items():
            nl = name.lower()
            if "helmet" in nl and "no" not in nl:
                _class_map['helmet'] = int(cid)
            elif ("no_helmet" in nl) or ("no helmet" in nl) or ("no-helmet" in nl) or ("nohelmet" in nl):
                _class_map['no_helmet'] = int(cid)
            elif "vest" in nl:
                # ignore vest here
                pass
            elif "person" in nl or "worker" in nl:
                _class_map['person'] = int(cid)
    except Exception:
        logger.exception("Failed to build helmet class map from model.names")


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

    # Ensure model contains required classes
    if _class_map is None or 'person' not in _class_map:
        return {"status": "error", "message": "Loaded model does not contain 'person' class required for helmet detection."}

    # Helmet/no_helmet may be optional (specialized model). If missing, return an informative error.
    helmet_present = 'helmet' in _class_map
    no_helmet_present = 'no_helmet' in _class_map
    if not (helmet_present or no_helmet_present):
        return {"status": "error", "message": "Loaded model does not contain helmet/no_helmet classes. Please provide a helmet_model.pt or a model trained with helmet labels."}

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

    person_id = _class_map.get('person')
    helmet_id = _class_map.get('helmet')
    no_helmet_id = _class_map.get('no_helmet')

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
                    try:
                        cls_id = int(box.cls[0])
                    except Exception:
                        continue

                    if person_id is not None and cls_id == person_id:
                        worker_count += 1
                    elif helmet_id is not None and cls_id == helmet_id:
                        helmet_count += 1
                    elif no_helmet_id is not None and cls_id == no_helmet_id:
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
        logger.exception("Error during helmet detection")
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
