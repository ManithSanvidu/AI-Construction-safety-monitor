"""
AI Safety Detection Package
"""
# Handle both direct execution and package import
try:
    from .detector import detect_people
    from .helmet_detector import detect_helmets
    from .vest_detector import detect_vests
    from .fall_detector import detect_falls
    from .unsafe_zone import detect_unsafe_zone
    from .incident_logger import IncidentLogger
    from .tracker import WorkerTracker
    from .utils import draw_bounding_box, get_timestamp, calculate_compliance, COLORS
except ImportError:
    from detector import detect_people
    from helmet_detector import detect_helmets
    from vest_detector import detect_vests
    from fall_detector import detect_falls
    from unsafe_zone import detect_unsafe_zone
    from incident_logger import IncidentLogger
    from tracker import WorkerTracker
    from utils import draw_bounding_box, get_timestamp, calculate_compliance, COLORS

__all__ = [
    "detect_people",
    "detect_helmets",
    "detect_vests",
    "detect_falls",
    "detect_unsafe_zone",
    "IncidentLogger",
    "WorkerTracker",
    "draw_bounding_box",
    "get_timestamp",
    "calculate_compliance",
    "COLORS"
]