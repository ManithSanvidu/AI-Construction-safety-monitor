"""
Incident logging module for safety violations.
"""
import json
import os
from datetime import datetime

# Handle both direct execution and package import
try:
    from .utils import get_timestamp, save_screenshot, ensure_directory
except ImportError:
    from utils import get_timestamp, save_screenshot, ensure_directory


class IncidentLogger:
    def __init__(self, log_file="incidents/incidents.json"):
        self.log_file = log_file
        self.incidents = []
        ensure_directory("incidents")
        
    def log_incident(self, frame, violation_type, confidence, frame_number, worker_id=None):
        """
        Log a safety violation incident.
        
        Args:
            frame: The video frame
            violation_type: Type of violation (e.g., "No Helmet", "No Safety Vest")
            confidence: Detection confidence score
            frame_number: Current frame number
            worker_id: Optional worker ID
        """
        # Save screenshot
        image_path = save_screenshot(frame)
        
        # Create incident record
        incident = {
            "time": get_timestamp(),
            "frame_number": frame_number,
            "violation": violation_type,
            "confidence": f"{confidence:.2f}",
            "image": image_path,
            "worker_id": worker_id
        }
        
        self.incidents.append(incident)
        self._save_to_file(incident)
        
        return incident
    
    def _save_to_file(self, incident):
        """Save incident to JSON file."""
        # Load existing incidents
        if os.path.exists(self.log_file):
            with open(self.log_file, "r") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
        else:
            data = []
        
        # Append new incident
        data.append(incident)
        
        # Save back to file
        with open(self.log_file, "w") as f:
            json.dump(data, f, indent=2)
    
    def get_today_violations(self):
        """Get count of violations from today."""
        today = datetime.now().strftime("%Y-%m-%d")
        count = 0
        if os.path.exists(self.log_file):
            with open(self.log_file, "r") as f:
                try:
                    data = json.load(f)
                    for incident in data:
                        if incident["time"].startswith(today):
                            count += 1
                except json.JSONDecodeError:
                    pass
        return count
    
    def get_all_incidents(self):
        """Get all logged incidents."""
        if os.path.exists(self.log_file):
            with open(self.log_file, "r") as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return []
        return []