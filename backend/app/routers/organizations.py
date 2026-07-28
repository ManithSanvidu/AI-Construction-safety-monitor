from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pymongo.database import Database
from app.database import get_db

router = APIRouter(prefix="/api/organizations", tags=["organizations"])

class OrganizationCreate(BaseModel):
    name: str
    owner_name: str
    owner_email: str
    payment_status: str = "paid"

class OrganizationResponse(BaseModel):
    id: str
    name: str
    owner_name: str
    owner_email: str
    payment_status: str

@router.post("/", response_model=OrganizationResponse)
def create_organization(org: OrganizationCreate, db: Database = Depends(get_db)):
    # Basic logic to insert an org
    new_org_dict = org.model_dump()
    result = db.organizations.insert_one(new_org_dict)
    
    return OrganizationResponse(
        id=str(result.inserted_id),
        name=org.name,
        owner_name=org.owner_name,
        owner_email=org.owner_email,
        payment_status=org.payment_status
    )
