"""
Worker tracking module for assigning and maintaining worker IDs.
"""
import cv2
import numpy as np
from collections import OrderedDict


class WorkerTracker:
    def __init__(self, max_lost_frames=30):
        """
        Initialize worker tracker.
        
        Args:
            max_lost_frames: Maximum frames a worker can be lost before being removed
        """
        self.next_id = 1
        self.tracks = OrderedDict()  # id -> (bbox, lost_frames)
        self.max_lost_frames = max_lost_frames
    
    def update(self, detections):
        """
        Update tracker with new detections.
        
        Args:
            detections: List of bounding boxes [(x1, y1, x2, y2), ...]
            
        Returns:
            dict: Mapping of track_id to bounding box
        """
        if not detections:
            # No detections, increment lost frames for all tracks
            for track_id in list(self.tracks.keys()):
                bbox, lost = self.tracks[track_id]
                self.tracks[track_id] = (bbox, lost + 1)
                if lost + 1 > self.max_lost_frames:
                    del self.tracks[track_id]
            return {tid: bbox for tid, (bbox, _) in self.tracks.items()}
        
        # Simple tracking: match detections to existing tracks
        matched_tracks = {}
        
        for det in detections:
            x1, y1, x2, y2 = det
            center = ((x1 + x2) // 2, (y1 + y2) // 2)
            
            # Find closest track
            best_id = None
            best_dist = float('inf')
            
            for track_id, (bbox, lost) in self.tracks.items():
                if lost > 0:
                    continue
                tx1, ty1, tx2, ty2 = bbox
                tcenter = ((tx1 + tx2) // 2, (ty1 + ty2) // 2)
                dist = np.sqrt((center[0] - tcenter[0])**2 + (center[1] - tcenter[1])**2)
                if dist < best_dist:
                    best_dist = dist
                    best_id = track_id
            
            # If close match found, update track
            if best_id is not None and best_dist < 100:
                self.tracks[best_id] = (det, 0)
                matched_tracks[best_id] = det
            else:
                # New track
                self.tracks[self.next_id] = (det, 0)
                matched_tracks[self.next_id] = det
                self.next_id += 1
        
        # Increment lost frames for unmatched tracks
        for track_id in list(self.tracks.keys()):
            if track_id not in matched_tracks:
                bbox, lost = self.tracks[track_id]
                self.tracks[track_id] = (bbox, lost + 1)
                if lost + 1 > self.max_lost_frames:
                    del self.tracks[track_id]
        
        return matched_tracks
    
    def get_worker_ids(self):
        """Get all active worker IDs."""
        return list(self.tracks.keys())
    
    def reset(self):
        """Reset the tracker."""
        self.next_id = 1
        self.tracks = OrderedDict()