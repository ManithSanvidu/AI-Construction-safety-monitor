"""
Safety Vest Detection Module
Ensures every worker is wearing a reflective safety vest.
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
    BACKEND_DIR = os.path.dirname(BASE_DIR)
    PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
    
    candidates = [
        os.path.normpath(os.path.join(BACKEND_DIR, "models", "vest_model.pt")),
        os.path.normpath(os.path.join(PROJECT_ROOT, "models", "vest_model.pt")),
        os.path.normpath(os.path.join(BACKEND_DIR, "yolo11n.pt")),
        os.path.normpath(os.path.join(PROJECT_ROOT, "yolo11n.pt")),
        os.path.normpath(os.path.join(BACKEND_DIR, "models", "yolo11n.pt")),
    ]

    model_path = _find_model_path(candidates)
    if model_path is None:
        raise FileNotFoundError(f"Vest model not found. Checked: {candidates}")

    logger.info(f"Loading vest model from: {model_path}")
    _model = YOLO(model_path)

    # Build class map for vest/person/no_vest
    _class_map = {}
    try:
        for cid, name in _model.names.items():
            nl = name.lower()
            if "vest" in nl and "no" not in nl:
                _class_map['vest'] = int(cid)
            elif ("no_vest" in nl) or ("no vest" in nl) or ("no-vest" in nl) or ("novest" in nl):
                _class_map['no_vest'] = int(cid)
            elif "helmet" in nl:
                # ignore helmet here
                pass
            elif "person" in nl or "worker" in nl:
                _class_map['person'] = int(cid)
    except Exception:
        logger.exception("Failed to build vest class map from model.names")


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

    # Ensure model contains required classes
    if _class_map is None or 'person' not in _class_map:
        return {"status": "error", "message": "Loaded model does not contain 'person' class required for vest detection."}

    vest_present = 'vest' in _class_map
    no_vest_present = 'no_vest' in _class_map
    if not (vest_present or no_vest_present):
        return {"status": "error", "message": "Loaded model does not contain vest/no_vest classes. Please provide a vest_model.pt or a model trained with vest labels."}

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

    person_id = _class_map.get('person')
    vest_id = _class_map.get('vest')
    no_vest_id = _class_map.get('no_vest')

    fps = cap.get(cv2.CAP_PROP_FPS)
    skip_frames = max(1, int(fps)) if fps > 0 else 30

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_number += 1
            if frame_number % skip_frames != 0:
                continue
            frame = cv2.resize(frame, (960, 540))

            results = _model(frame, verbose=False)

            vest_count = 0
            no_vest_count = 0
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
                    elif vest_id is not None and cls_id == vest_id:
                        vest_count += 1
                    elif no_vest_id is not None and cls_id == no_vest_id:
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
        logger.exception("Error during vest detection")
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
