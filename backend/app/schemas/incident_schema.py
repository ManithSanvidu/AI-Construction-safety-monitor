from datetime import datetime 
from typing import Optional

from pydantic import BaseModel, ConfigDict

class IncidentBase(BaseModel):
    incident_type:str
    worker_id:Optional[str]=None
    confidence:float
    image_path:Optional[str]=None
    video_path:Optional[str]=None
    status:Optional[str]="Pending"

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    incident_type: Optional[str] = None
    worker_id: Optional[str] = None
    confidence: Optional[float] = None
    image_path: Optional[str] = None
    video_path: Optional[str] = None
    status: Optional[str] = None

class IncidentResponse(IncidentBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)