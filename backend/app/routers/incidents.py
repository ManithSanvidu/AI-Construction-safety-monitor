from fastapi import APIRouter
from app.database import db

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

def serialize_doc(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
async def get_all_incidents():
    # Fetch last 100 incidents to prevent massive payloads
    incidents = list(db.incidents.find().sort("timestamp", -1).limit(100))
    result = []
    for i, inc in enumerate(incidents):
        ser = serialize_doc(inc)
        ser["id"] = i + 1  # For the frontend table
        if "timestamp" in ser:
            ser["timestamp"] = ser["timestamp"].isoformat()
        result.append(ser)
    return result
