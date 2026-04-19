from fastapi import APIRouter, Depends, HTTPException
from db.db import db
from dependencies.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/committee", tags=["Committee"])

@router.get("/dashboard-stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Verify the user is an advisor and a committee member
    advisor = db["advisors"].find_one({"advisor_id": current_user["_id"]})
    if not advisor or not advisor.get("committee_member"):
        # We don't fail hard because this endpoint might be hit by UI proactively
        # but returning empty structure if unauthorized
        raise HTTPException(status_code=403, detail="Access denied. User is not a committee member.")

    # 1. Total Enrolled Students (Count from profiles instead of users)
    total_students = db["profiles"].count_documents({})
    
    # 2. Total FYDP Groups (Locked Teams)
    total_groups = db["teams"].count_documents({"is_locked": True})
    
    # 3. Industry Stats
    pending_industry_ideas = db["Industry_Ideas"].count_documents({"status": "pending"})
    pending_industry_jobs = db["Industry_Jobs"].count_documents({"status": "pending"})
    
    pending_proposals_cursor = db["project_proposals"].find({"status": "advisor_accepted"}).sort("_id", -1).limit(3)
    pending_proposals = []
    for p in pending_proposals_cursor:
        pitch = db["student_pitches"].find_one({"team_id": str(p.get("team_id", "")), "status": "accepted"})
        project_title = pitch.get("title") if pitch else "Untitled Proposal"
        
        pending_proposals.append({
            "id": str(p["_id"]),
            "groupName": project_title,
            "submittedDate": p["_id"].generation_time.strftime("%Y-%m-%d")
        })
        
    approved_proposals_cursor = db["project_proposals"].find({"status": "committee_accepted"}).sort("_id", -1).limit(3)
    approved_proposals = []
    for p in approved_proposals_cursor:
        pitch = db["student_pitches"].find_one({"team_id": str(p.get("team_id", "")), "status": "accepted"})
        project_title = pitch.get("title") if pitch else "Untitled Proposal"
        
        approved_proposals.append({
            "id": str(p["_id"]),
            "groupName": project_title,
            "approvedDate": p["_id"].generation_time.strftime("%Y-%m-%d")
        })
        
    pending_count = db["project_proposals"].count_documents({"status": "advisor_accepted"})
    approved_count = db["project_proposals"].count_documents({"status": "committee_accepted"})

    return {
        "students": { "total_enrolled": total_students },
        "groups": { "total_registered": total_groups },
        "industry": { 
            "pending_ideas": pending_industry_ideas, 
            "pending_jobs": pending_industry_jobs 
        },
        "proposals": {
            "pending_count": pending_count,
            "approved_count": approved_count,
            "pending_list": pending_proposals,
            "approved_list": approved_proposals
        }
    }

from datetime import datetime
from pydantic import BaseModel
from typing import Optional

@router.get("/all-proposals")
def get_all_proposals(current_user: dict = Depends(get_current_user)):
    advisor = db["advisors"].find_one({"advisor_id": current_user["_id"]})
    if not advisor or not advisor.get("committee_member"):
        raise HTTPException(status_code=403, detail="Access denied.")
        
    proposals_col = db["project_proposals"]
    teams_col = db["teams"]
    profiles_col = db["profiles"]
    pitches_col = db["student_pitches"]
    
    valid_statuses = ["advisor_accepted", "committee_accepted", "committee_rejected"]
    proposals_cursor = proposals_col.find({"status": {"$in": valid_statuses}}).sort("created_at", -1)
    
    results = []
    for p in proposals_cursor:
        team_id = p.get("team_id")
        if not team_id: continue
        
        team = teams_col.find_one({"_id": ObjectId(team_id)})
        if not team: continue
        
        pitch = pitches_col.find_one({"team_id": str(team_id), "status": "accepted"})
        project_title = pitch.get("title", "Untitled Proposal") if pitch else "Untitled Proposal"
        project_summary = pitch.get("summary", "") if pitch else ""
        advisor_id_str = pitch.get("advisor_id") if pitch else None
        
        advisor_name = "Unknown Advisor"
        if advisor_id_str:
            adv_profile = db["advisors"].find_one({"advisor_id": ObjectId(advisor_id_str)})
            if adv_profile:
                advisor_name = adv_profile.get("name", "Unknown Advisor")
        
        members_data = []
        for member_id in team.get("members", []):
            try:
                prof = profiles_col.find_one({"user_id": ObjectId(member_id)})
                if prof:
                    members_data.append({
                        "name": prof.get("name", "Unknown"),
                        "roll_number": prof.get("roll_number", "N/A")
                    })
            except:
                pass
                
        results.append({
            "proposal_id": str(p["_id"]),
            "team_id": str(team_id),
            "project_title": project_title,
            "project_summary": project_summary,
            "advisor_name": advisor_name,
            "status": p.get("status"),
            "file_id": p.get("file_id"),
            "submitted_date": p["_id"].generation_time.strftime("%Y-%m-%d"),
            "members": members_data,
            "events": p.get("events", [])
        })
        
    return results

class CommitteeReviewPayload(BaseModel):
    action: str
    comment: Optional[str] = None

@router.post("/review-proposal/{proposal_id}")
def review_proposal(proposal_id: str, payload: CommitteeReviewPayload, current_user: dict = Depends(get_current_user)):
    advisor = db["advisors"].find_one({"advisor_id": current_user["_id"]})
    if not advisor or not advisor.get("committee_member"):
        raise HTTPException(status_code=403, detail="Access denied.")
        
    if payload.action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action.")
        
    proposals_col = db["project_proposals"]
    try:
        proposal = proposals_col.find_one({"_id": ObjectId(proposal_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid Proposal ID")
        
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    new_event = {
        "action": f"committee_{payload.action}",
        "actor_id": str(current_user["_id"]),
        "role": "committee",
        "timestamp": datetime.utcnow(),
        "comment": payload.comment or "No feedback provided."
    }
    
    new_status = f"committee_{payload.action}"
    
    proposals_col.update_one(
        {"_id": ObjectId(proposal_id)},
        {
            "$set": {"status": new_status},
            "$push": {"events": new_event}
        }
    )
    
    # If accepted, complete stage 4 for all students in group
    if payload.action == "accepted":
        team_id = proposal.get("team_id")
        if team_id:
            team = db["teams"].find_one({"_id": ObjectId(team_id)})
            if team:
                member_ids = [ObjectId(m) for m in team.get("members", [])]
                db["profiles"].update_many(
                    {"user_id": {"$in": member_ids}},
                    {"$set": {
                        "stages.stage3_completed": True,
                        "stages.stage4_completed": True
                    }}
                )
                
    return {"message": f"Proposal committee {payload.action} successfully."}
