"""
Detector Service - Orchestrates all AI detection modules for a given video
and returns a unified structured analysis report.
"""

import logging
import os
import sys
import time

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(BACKEND_DIR)
BACKEND_ROOT = os.path.dirname(APP_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_ROOT)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ai.detector import detect_people
from ai.helmet_detector import detect_helmets
from ai.vest_detector import detect_vests
from ai.fall_detector import detect_falls
from ai.unsafe_zone import detect_unsafe_zone
from ai.ruleengine import SafetyRuleEngine

logger = logging.getLogger(__name__)
_rule_engine = SafetyRuleEngine()

def _build_alerts(report):
    alerts = []
    # Basic alert generation logic could be implemented here using _rule_engine
    # For now we return an empty list to prevent NameError
    return alerts


def run_full_analysis(video_path: str, zone_vertices: list = None) -> dict:
    """
    Run all AI detectors on the given video and return a combined report.

    Args:
        video_path (str): Absolute path to the uploaded video file.
        zone_vertices (list): Optional list of (x, y) tuples for the unsafe zone polygon.

    Returns:
        dict: Combined report with keys:
            - people
            - helmets
            - vests
            - falls
            - unsafe_zone
            - alerts
            - meta
            - status
    """

    if not os.path.exists(video_path):
        return {
            "status": "error",
            "message": f"Video file not found: {video_path}",
        }

    start_time = time.time()
    logger.info(f"[DetectorService] Starting full analysis: {video_path}")

    
    report = {
        "status"     : "success",
        "video_path" : video_path,
        "people"     : {},
        "helmets"    : {},
        "vests"      : {},
        "falls"      : {},
        "unsafe_zone": {},
        "alerts"     : [],
        "meta"       : {}
    }

    #Person detection
    try:
        logger.info("[DetectorService] Running people Detection...")
        report["people"] = detect_people(video_path)
    except Exception as e:
        logger.error(f"[DetectorService] people detection failed: {e}")
        report["people"] = {"status": "error", "message": str(e)}

     # 2. Helmet Detection
    try:
        logger.info("[DetectorService] Running helmet detection...")
        report["helmets"] = detect_helmets(video_path)
    except Exception as e:
        logger.error(f"[DetectorService] helmet detection failed: {e}")
        report["helmets"] = {"status": "error", "message": str(e)}

     # 3. Safety Vest Detection
    try:
        logger.info("[DetectorService] Running vest detection...")
        report["vests"] = detect_vests(video_path)
    except Exception as e:
        logger.error(f"[DetectorService] vest detection failed: {e}")
        report["vests"] = {"status": "error", "message": str(e)}

    # 4. Fall Detection
    try:
        logger.info("[DetectorService] Running fall detection...")
        report["falls"] = detect_falls(video_path)
    except Exception as e:
        logger.error(f"[DetectorService] fall detection failed: {e}")
        report["falls"] = {"status": "error", "message": str(e)}

    # 5. Unsafe Zone Detection
    try:
        logger.info("[DetectorService] Running unsafe zone detection...")
        if zone_vertices:
            report["unsafe_zone"] = detect_unsafe_zone(video_path, zone_vertices)
        else:
            report["unsafe_zone"] = detect_unsafe_zone(video_path)
    except Exception as e:
        logger.error(f"[DetectorService] unsafe zone detection failed: {e}")
        report["unsafe_zone"] = {"status": "error", "message": str(e)}

    # 6. Rule Engine — derive alerts from detection results
    try:
        report["alerts"] = _build_alerts(report)
    except Exception as e:
        logger.error(f"[DetectorService] rule engine evaluation failed: {e}")
        report["alerts"] = []

    # 7. Metadata
    elapsed = round(time.time() - start_time, 2)
    report["meta"] = {
        "analysis_duration_seconds": elapsed,
        "timestamp": time.time()
    }

    logger.info(f"[DetectorService] Analysis complete in {elapsed}s")
    return report

