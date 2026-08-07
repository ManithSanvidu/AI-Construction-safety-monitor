"""
Incident logging module for safety violations.
Uses JSONL (JSON Lines) format for efficient O(1) append operations.
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
    def __init__(self, log_file="incidents/incidents.jsonl"):
        # Use .jsonl extension for JSON Lines format
        if log_file.endswith('.json'):
            log_file = log_file[:-5] + '.jsonl'
        self.log_file = log_file
        self.incidents = []
        self._last_logged = {}  # Track last logged incident to prevent duplicates
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
        # Create a key to prevent duplicate incidents within the same frame
        dedupe_key = (frame_number, violation_type, worker_id)
        if dedupe_key in self._last_logged:
            return self._last_logged[dedupe_key]
        
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
        self._last_logged[dedupe_key] = incident
        self._save_to_file(incident)
        
        return incident
    
    def _save_to_file(self, incident):
        """Save incident to JSONL file using efficient append mode (O(1) operation)."""
        # JSONL format: one JSON object per line - allows O(1) append
        with open(self.log_file, "a") as f:
            f.write(json.dumps(incident) + "\n")
    
    def get_today_violations(self):
        """Get count of violations from today."""
        today = datetime.now().strftime("%Y-%m-%d")
        count = 0
        if os.path.exists(self.log_file):
            with open(self.log_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        incident = json.loads(line)
                        if incident.get("time", "").startswith(today):
                            count += 1
                    except json.JSONDecodeError:
                        continue
        return count
    
    def get_all_incidents(self):
        """Get all logged incidents."""
        incidents = []
        if os.path.exists(self.log_file):
            with open(self.log_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        incidents.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        return incidents
    
    def migrate_from_json(self):
        """Migrate existing incidents.json to the new JSONL format."""
        old_file = self.log_file[:-6] + ".json"  # Convert .jsonl back to .json
        if not os.path.exists(old_file):
            return
        
        try:
            with open(old_file, "r") as f:
                data = json.load(f)
            
            if isinstance(data, list):
                # Write all incidents to the new JSONL file
                with open(self.log_file, "w") as f:
                    for incident in data:
                        f.write(json.dumps(incident) + "\n")
                
                # Optionally backup and remove old file
                os.rename(old_file, old_file + ".backup")
        except (json.JSONDecodeError, IOError):
            pass