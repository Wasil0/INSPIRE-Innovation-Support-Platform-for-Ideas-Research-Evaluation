from fastapi import APIRouter, Depends, HTTPException
from db.db import db, users_col
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

# -------------------
# GET: Get Current User's Advisor Info
# -------------------

@router.get("/me")
def get_current_user_advisor_info(
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current logged-in user's advisor information (name and committee member status).
    """
    advisor_id = current_user["_id"]
    
    advisor_doc = advisors_col.find_one({"advisor_id": advisor_id})
    
    if not advisor_doc:
        raise HTTPException(status_code=404, detail="Advisor profile not found")
    
    # Fetch gsuite_id from users collection (advisor_id is the same as user _id)
    user_doc = users_col.find_one({"_id": advisor_id})
    gsuite_id = user_doc.get("gsuite_id") if user_doc else None
    
    return {
        "advisor_id": str(advisor_doc["advisor_id"]),
        "name": advisor_doc.get("name"),
        "gsuite_id": gsuite_id,
        "department": advisor_doc.get("department"),
        "committee_member": advisor_doc.get("committee_member", False)
    }

# -------------------
# GET: All Advisors (with slots and team pitch status)
# -------------------

@router.get("/all")
def get_all_advisors(current_user: dict = Depends(get_current_user)):
    user_id_str = str(current_user["_id"])
    
    from db.db import db
    teams_col = db["teams"]
    student_pitches_col = db["student_pitches"]
    
    # 1. Get user's team id
    team = teams_col.find_one({"members": user_id_str})
    team_id_str = str(team["_id"]) if team else None

    advisors_list = []
    cursor = advisors_col.find()
    
    for adv in cursor:
        adv_id_str = str(adv["advisor_id"])
        
        # Calculate available slots
        industry_accepted = student_pitches_col.count_documents({
            "advisor_id": adv_id_str,
            "is_industry": True,
            "status": "accepted"
        })
        normal_accepted = student_pitches_col.count_documents({
            "advisor_id": adv_id_str,
            "is_industry": False,
            "status": "accepted"
        })
        
        available_industry_slots = max(0, 1 - industry_accepted)
        available_normal_slots = max(0, 4 - normal_accepted)
        
        # Check team pitch status for this advisor
        team_pitch_status = "none"
        if team_id_str:
            # Find any active pitch (pending or accepted) to this advisor from this team
            existing_pitch = student_pitches_col.find_one({
                "team_id": team_id_str,
                "advisor_id": adv_id_str,
                "status": {"$in": ["pending", "accepted"]}
            })
            
            if existing_pitch:
                team_pitch_status = existing_pitch.get("status", "none")
                
        advisors_list.append({
            "advisor_id": adv_id_str,
            "name": adv.get("name"),
            "department": adv.get("department"),
            "available_normal_slots": available_normal_slots,
            "available_industry_slots": available_industry_slots,
            "team_pitch_status": team_pitch_status,
            "committee_member": adv.get("committee_member", False)
        })
        
    return advisors_list