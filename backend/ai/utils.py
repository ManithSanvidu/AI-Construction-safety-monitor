"""
Utility functions for the safety detection system.
"""
import cv2
import os
from datetime import datetime


def draw_bounding_box(frame, x1, y1, x2, y2, color, label):
    """Draw a bounding box with label on the frame."""
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
    cv2.putText(
        frame,
        label,
        (x1, y1 - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        color,
        2
    )


def get_timestamp():
    """Get current timestamp in YYYY-MM-DD HH:MM:SS format."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def ensure_directory(path):
    """Create directory if it doesn't exist."""
    if not os.path.exists(path):
        os.makedirs(path)


def save_screenshot(frame, folder="incidents"):
    """Save a screenshot of the frame."""
    ensure_directory(folder)
    timestamp = get_timestamp().replace(":", "-").replace(" ", "_")
    filename = f"{folder}/incident_{timestamp}.jpg"
    cv2.imwrite(filename, frame)
    return filename


def calculate_compliance(compliant_count, total_count):
    """Calculate compliance percentage."""
    if total_count == 0:
        return 0
    return round((compliant_count / total_count) * 100, 1)


# Color definitions (BGR format)
COLORS = {
    "helmet": (0, 255, 0),        # Green
    "no_helmet": (0, 0, 255),     # Red
    "vest": (0, 255, 0),          # Green
    "no_vest": (0, 0, 255),       # Red
    "person": (255, 255, 0),      # Cyan
    "alert": (0, 0, 255),         # Red
}