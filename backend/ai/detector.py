"""
Main Safety Detection Module
Integrates person tracking and detection into a reusable function.
"""
from ultralytics import YOLO
import cv2
import os
import logging

logger = logging.getLogger(__name__)

_model = None
_class_mapping = None


def _find_model_path(candidates):
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def _init_model():
    global _model, _class_mapping
    if _model is not None:
        return

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(BASE_DIR, "..", "Dataset", "train", "weights", "best.pt")),
        os.path.normpath(os.path.join(BASE_DIR, "..", "models", "yolo11n.pt")),
        os.path.normpath(os.path.join(BASE_DIR, "..", "yolo11n.pt")),
        os.path.normpath(os.path.join(BASE_DIR, "..", "..", "yolo11n.pt")),
    ]

    model_path = _find_model_path(candidates)
    if model_path is None:
        raise FileNotFoundError(f"Model not found. Checked: {candidates}")

    logger.info(f"Loading YOLO model from: {model_path}")
    _model = YOLO(model_path)

    # Build a mapping for person-like classes
    _class_mapping = {}
    CLASS_NAME_PATTERNS = {
        "Person": ["person", "worker"],
    }
    try:
        for cls_id, name in _model.names.items():
            name_lower = name.lower()
            if any(pat in name_lower for pat in CLASS_NAME_PATTERNS["Person"]):
                _class_mapping[cls_id] = "Person"
    except Exception:
        logger.exception("Failed to build class mapping from model.names")


def detect_people(video_path):
    """
    Process video to detect and track people/workers.

    Args:
        video_path (str): Path to the video file

    Returns:
        dict: Detection statistics and person locations
    """
    # Initialize model and handle missing model gracefully
    try:
        _init_model()
    except Exception as e:
        logger.error(f"Model initialization failed in detect_people: {e}")
        return {"status": "error", "message": str(e)}

    if _model is None:
        return {"status": "error", "message": "YOLO model not initialized"}

    if _class_mapping is None:
        return {"status": "error", "message": "Model class mapping unavailable"}

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
            try:
                frame = cv2.resize(frame, (960, 540))
            except Exception:
                # If resizing fails, use the original frame
                pass

            results = _model(frame, verbose=False)

            worker_count = 0
            confidences = []

            for result in results:
                boxes = getattr(result, "boxes", [])
                for box in boxes:
                    try:
                        # Normalize class id (handles tensors, numpy arrays, lists, etc.)
                        raw_cls = box.cls[0]
                        if hasattr(raw_cls, "item"):
                            cls_id = int(raw_cls.item())
                        elif isinstance(raw_cls, (list, tuple)):
                            cls_id = int(raw_cls[0])
                        else:
                            cls_id = int(raw_cls)

                        # Normalize confidence
                        raw_conf = box.conf[0]
                        if hasattr(raw_conf, "item"):
                            conf = float(raw_conf.item())
                        else:
                            conf = float(raw_conf)
                    except Exception as e:
                        # Skip malformed boxes instead of raising; keeps processing robust
                        logger.debug(f"Skipping malformed detection box: {e}")
                        continue

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
        logger.exception("Error during person detection")
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
