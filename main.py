"""
Main entry point for the Construction Safety Monitor.
Run this file to start the AI detection system.
"""
import argparse
import json
import os
from ai.detector import detect_people
from ai.helmet_detector import detect_helmets
from ai.vest_detector import detect_vests
from ai.fall_detector import detect_falls
from ai.unsafe_zone import detect_unsafe_zone
from ai.ruleengine import SafetyRuleEngine

class SafetyDetector:
    def __init__(self):
        self.rule_engine = SafetyRuleEngine()

    def run(self, video_path):
        if not os.path.exists(video_path):
            print(f"Error: Video file not found at {video_path}")
            return
            
        print(f"Processing video: {video_path}")
        
        print("1/5 Detecting people...")
        people_stats = detect_people(video_path)
        
        print("2/5 Detecting helmets...")
        helmet_stats = detect_helmets(video_path)
        
        print("3/5 Detecting safety vests...")
        vest_stats = detect_vests(video_path)
        
        print("4/5 Detecting falls...")
        fall_stats = detect_falls(video_path)
        
        print("5/5 Detecting unsafe zone breaches...")
        unsafe_zone_stats = detect_unsafe_zone(video_path)
        
        results = {
            "people_detection": people_stats,
            "helmet_compliance": helmet_stats,
            "vest_compliance": vest_stats,
            "falls": fall_stats,
            "unsafe_zones": unsafe_zone_stats
        }
        
        output_file = "detection_results.json"
        with open(output_file, "w") as f:
            json.dump(results, f, indent=4)
            
        print(f"Analysis complete. Results saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Construction Safety Monitor")
    parser.add_argument("--video", type=str, default="videos/sample.mp4", help="Path to video file")
    args = parser.parse_args()
    
    detector = SafetyDetector()
    detector.run(args.video)