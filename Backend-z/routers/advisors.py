from fastapi import APIRouter, HTTPException
from bson import ObjectId
from bson.errors import InvalidId
from database import db  # Import your MongoDB db object
from schemas.advisors import AdvisorCreate


router = APIRouter()

# Advisors collection
advisors_col = db["advisors"]

# -------------------
# POST: Add Advisor
# -------------------

@router.post("/advisors")
def create_advisor(advisor: AdvisorCreate):
    # Validate advisor_id: str

    try:
        advisor_obj_id = ObjectId(advisor.advisor_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid advisor_id format")
    
    # Check if advisor already exists for this advisor_id
    existing_advisor = advisors_col.find_one({"advisor_id": advisor_obj_id})
    if existing_advisor:
        raise HTTPException(status_code=400, detail="Advisor already exists for this advisor_id")
    
    # Create advisor document
    advisor_doc = {
        "advisor_id": advisor_obj_id,
        "name": advisor.name,
        "department": advisor.department,
        "committee_member": advisor.committee_member
    }
    
    advisors_col.insert_one(advisor_doc)
    return {"advisor_id": advisor.advisor_id}
