"""
Detector Service - Orchestrates all AI detection modules for a given video
by communicating with the standalone AI microservice.
"""

import logging
import os
import sys
import time
import json
import httpx

logger = logging.getLogger(__name__)

# URL for the AI microservice (can be configured via environment variable)
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001")


def _build_alerts(report):
    alerts = []
    # Basic alert generation logic could be implemented here
    # For now we return an empty list to prevent NameError
    return alerts


def run_full_analysis(video_path: str, zone_vertices: list = None) -> dict:
    """
    Send the video to the AI microservice and return the combined report.

    Args:
        video_path (str): Absolute path to the uploaded video file.
        zone_vertices (list): Optional list of (x, y) tuples for the unsafe zone polygon.

    Returns:
        dict: Combined report
    """
    if not os.path.exists(video_path):
        return {
            "status": "error",
            "message": f"Video file not found: {video_path}",
        }

    start_time = time.time()
    logger.info(f"[DetectorService] Starting full analysis via AI Microservice: {video_path}")

    # Prepare data for HTTP request
    data = {}
    if zone_vertices:
        data["zone_vertices"] = json.dumps(zone_vertices)

    try:
        with open(video_path, "rb") as f:
            files = {"file": (os.path.basename(video_path), f, "video/mp4")}
            # The AI microservice analysis can be slow, increase timeout
            timeout = httpx.Timeout(600.0)
            
            with httpx.Client(timeout=timeout) as client:
                response = client.post(f"{AI_SERVICE_URL}/api/analyze", data=data, files=files)
                response.raise_for_status()
                
                report = response.json()
                
    except Exception as e:
        logger.error(f"[DetectorService] AI microservice request failed: {e}")
        return {
            "status": "error",
            "message": f"AI Microservice request failed: {str(e)}",
            "video_path": video_path,
        }

    # 6. Rule Engine — derive alerts from detection results
    try:
        report["alerts"] = _build_alerts(report)
    except Exception as e:
        logger.error(f"[DetectorService] rule engine evaluation failed: {e}")
        report["alerts"] = []

    # 7. Metadata
    elapsed = round(time.time() - start_time, 2)
    if "meta" not in report:
        report["meta"] = {}
    report["meta"]["analysis_duration_seconds"] = elapsed
    report["meta"]["timestamp"] = time.time()
    report["video_path"] = video_path

    logger.info(f"[DetectorService] Analysis complete in {elapsed}s")
    return report
