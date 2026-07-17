import time

class SafetyRuleEngine:
    def __init__(self):
        self.severity_map={
            "FALL_DETECTED":"CRITICAL",
            "UNSAFE_ZONE_BREACH": "HIGH",
            "MISSING_PPE":"MEDIUM",
            "SAFE":"LOW"
        }

    def evaluate_worker_state(self,worker_id,telemetry):
        """
        telemetry parameter format expected:
        {
            "has_helmet":True/False,
            "has_vest":True/False,
            "in_unsafe_zone":True/False,
            "is_falling":True/False
        }
        Returns: A structured dictionary containing compliance status and generated alerts.
        """
        alerts=[]

        if telemetry.get("is_falling"):
            alerts.append(self._create_alert_payload(worker_id,"FALL_DETECTED","Worker fall incident detected! Urgent assistance needed."))

        if telemetry.get("in_unsafe_zone"):
            alerts.append(self._create_alert_payload(worker_id,"UNSAFE_ZONE_BREACH", "Worker detected inside a restricted or hazardous zone."))

        missing_ppe = []
        if not telemetry.get("has_helmet"):
            missing_ppe.append("Helmet")
        if not telemetry.get("has_vest"):
            missing_ppe.append("Safety Vest")
            
        if missing_ppe:
            msg=f"Worker missing mandatory PPE equipment: {', '.join(missing_ppe)}."
            alerts.append(self._create_alert_payload)

        if alerts:
            highest_severity="MEDIUM"
            if any(a["severity"]=="CRITICAL" for a in alerts):
                highest_severity="CRITICAL"
            elif any(a["severity"]=="HIGH" for a in alerts):
                highest_severity="HIGH"

            return{
                "worker_id": worker_id,
                "is_compliant": False,
                "highest_severity": highest_severity,
                "active_alerts": alerts
            }

        return {
            "worker_id": worker_id,
            "is_compliant": True,
            "highest_severity": self.severity_map["SAFE"],
            "active_alerts": []
        }

    def _create_alert_payload(self,worker_id,event_type,details):
        """ Helper to structure uniform alert payloads for backend intergation. """
        return{
            "worker_id":worker_id,
            "event_type":event_type,
            "severity":self.severity_map.get(event_type,"LOW"),
            "details":details,
            "timestamp":time.time()

        }


    
        