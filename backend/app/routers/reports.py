from fastapi import APIRouter
from app.database import db
import datetime

router = APIRouter(prefix="/api/reports", tags=["reports"])

def serialize_doc(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/daily")
async def get_daily_summary():
    # Fetch metrics for the last 24 hours
    now = datetime.datetime.utcnow()
    last_24h = now - datetime.timedelta(days=1)
    
    # Get all metrics in the last 24h
    metrics = list(db.metrics.find({"timestamp": {"$gte": last_24h}}))
    incidents = list(db.incidents.find({"timestamp": {"$gte": last_24h}}))
    
    avg_workers = sum(m.get("workers", 0) for m in metrics) / len(metrics) if metrics else 0
    avg_compliance = sum(m.get("compliance_score", 0) for m in metrics) / len(metrics) if metrics else 100
    total_incidents = len(incidents)
    
    return {
        "workers": round(avg_workers),
        "compliance_score": round(avg_compliance, 1),
        "total_incidents": total_incidents,
        "date": now.strftime("%Y-%m-%d")
    }

@router.get("/weekly")
async def get_weekly_summary():
    # Fetch metrics for the last 7 days
    now = datetime.datetime.utcnow()
    last_7d = now - datetime.timedelta(days=7)
    
    metrics = list(db.metrics.find({"timestamp": {"$gte": last_7d}}))
    incidents = list(db.incidents.find({"timestamp": {"$gte": last_7d}}))
    
    avg_workers = sum(m.get("workers", 0) for m in metrics) / len(metrics) if metrics else 0
    avg_compliance = sum(m.get("compliance_score", 0) for m in metrics) / len(metrics) if metrics else 100
    total_incidents = len(incidents)
    
    return {
        "workers": round(avg_workers),
        "compliance_score": round(avg_compliance, 1),
        "total_incidents": total_incidents,
        "date_range": f"{last_7d.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}"
    }

@router.get("/incidents")
async def get_incidents_report():
    # Get all incidents, sorted by newest first
    incidents = list(db.incidents.find().sort("timestamp", -1))
    return [serialize_doc(i) for i in incidents]

@router.get("/compliance")
async def get_compliance_audit():
    # Aggregate incidents to see what's failing most
    incidents = list(db.incidents.find())
    
    helmet_count = sum(1 for i in incidents if "helmet" in i.get("type", "").lower())
    vest_count = sum(1 for i in incidents if "vest" in i.get("type", "").lower())
    
    return {
        "helmet_violations": helmet_count,
        "vest_violations": vest_count,
        "total_inspections": len(incidents) # simplified
    }
