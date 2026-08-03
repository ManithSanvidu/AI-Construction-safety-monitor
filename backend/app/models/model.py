from ultralytics import YOLO
import os

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.normpath(os.path.join(BASE_DIR, "yolo11n.pt"))

model = YOLO(model_path)
