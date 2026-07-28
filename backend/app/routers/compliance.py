from fastapi import APIRouter
from app.database import db

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

def serialize_doc(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
async def get_latest_compliance():
    # Fetch the most recent metric
    metric = db.metrics.find_one({}, sort=[("timestamp", -1)])
    if metric:
        ser = serialize_doc(metric)
        if "timestamp" in ser:
            ser["timestamp"] = ser["timestamp"].isoformat()
        return ser
    
    # Default if no video has ever been processed
    return {
        "workers": 0,
        "helmets": 0,
        "vests": 0,
        "compliance_score": 100
    }
