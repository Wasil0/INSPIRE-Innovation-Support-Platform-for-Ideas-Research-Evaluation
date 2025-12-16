from fastapi import APIRouter, Depends, HTTPException
from db.db import db
from schemas.advisors import AdvisorCreate
from dependencies.auth import get_current_user

router = APIRouter(prefix="/advisors", tags=["Advisors"])

advisors_col = db["advisors"]

@router.post("/")
def create_advisor(
    advisor: AdvisorCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Only logged-in users can become advisors.
    advisor_id is derived from JWT (user _id)
    """

    advisor_id = current_user["_id"]

    existing = advisors_col.find_one({"advisor_id": advisor_id})
    if existing:
        raise HTTPException(status_code=400, detail="Advisor already exists")

    advisor_doc = {
        "advisor_id": advisor_id,
        "name": advisor.name,
        "department": advisor.department,
        "committee_member": advisor.committee_member
    }

    advisors_col.insert_one(advisor_doc)

    return {
        "message": "Advisor profile created successfully",
        "advisor_id": str(advisor_id)
    }
