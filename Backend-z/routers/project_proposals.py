from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from db.db import db, fs
from dependencies.auth import get_current_user
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter(prefix="/project_proposals", tags=["Project Proposals"])
proposals_col = db["project_proposals"]
teams_col = db["teams"]

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB limit for 10-20 page PDFs with graphs

@router.post("/submit")
async def submit_proposal(
    proposal_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id_str = str(current_user["_id"])
    
    # 1. Find user's team
    team = teams_col.find_one({"members": user_id_str})
    if not team:
        raise HTTPException(status_code=400, detail="You must be in a group to submit a proposal.")
    team_id_str = str(team["_id"])
    
    # 2. Check if there is already an active (non-rejected) proposal
    active_proposal = proposals_col.find_one({
        "team_id": team_id_str,
        "status": {"$in": ["pending", "advisor_accepted", "committee_accepted"]}
    })
    if active_proposal:
        raise HTTPException(status_code=400, detail="An active proposal already exists for your group.")
        
    # 3. Process File Upload
    if proposal_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
    file_bytes = await proposal_file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 15MB.")
        
    file_id = fs.put(
        file_bytes,
        filename=proposal_file.filename,
        contentType=proposal_file.content_type
    )
    
    # 4. Create proposal record
    event_log = [{
        "action": "submitted",
        "actor_id": user_id_str,
        "role": "student",
        "timestamp": datetime.utcnow(),
        "comment": "Initial proposal submission."
    }]
    
    proposal_doc = {
        "team_id": team_id_str,
        "submitted_by": user_id_str,
        "file_id": str(file_id),
        "status": "pending",
        "created_at": datetime.utcnow(),
        "events": event_log
    }
    
    result = proposals_col.insert_one(proposal_doc)
    return {"message": "Proposal submitted successfully.", "proposal_id": str(result.inserted_id)}


@router.get("/my_proposal")
def get_my_proposal(current_user: dict = Depends(get_current_user)):
    user_id_str = str(current_user["_id"])
    
    team = teams_col.find_one({"members": user_id_str})
    if not team:
        raise HTTPException(status_code=400, detail="You are not in a group.")
    
    # Get the latest proposal by this team
    proposal = proposals_col.find_one(
        {"team_id": str(team["_id"])},
        sort=[("created_at", -1)]
    )
    
    if not proposal:
        return {"exists": False}
        
    return {
        "exists": True,
        "proposal_id": str(proposal["_id"]),
        "file_id": proposal.get("file_id"),
        "status": proposal.get("status"),
        "created_at": proposal.get("created_at"),
        "events": proposal.get("events", [])
    }


@router.get("/download/{file_id}")
def download_proposal(file_id: str):
    try:
        grid_out = fs.get(ObjectId(file_id))
    except:
        raise HTTPException(status_code=404, detail="File not found")
        
    return StreamingResponse(
        grid_out,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
    )

from pydantic import BaseModel
from typing import Optional

class ReviewPayload(BaseModel):
    action: str
    comment: Optional[str] = None

@router.get("/advisor/selected_groups")
def get_advisor_selected_groups(current_user: dict = Depends(get_current_user)):
    user_id_str = str(current_user["_id"])
    
    student_pitches_col = db["student_pitches"]
    profiles_col = db["profiles"]
    
    accepted_pitches = list(student_pitches_col.find({
        "advisor_id": user_id_str,
        "status": "accepted"
    }))
    
    selected_groups = []
    
    for pitch in accepted_pitches:
        team_id = pitch.get("team_id")
        if not team_id: continue
        
        try:
            team = teams_col.find_one({"_id": ObjectId(team_id)})
        except:
            continue
            
        if not team: continue
        
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
                
        proposal = proposals_col.find_one(
            {"team_id": str(team_id)},
            sort=[("created_at", -1)]
        )
        
        group_data = {
            "team_id": str(team["_id"]),
            "project_title": pitch.get("title", "Untitled Project"),
            "project_summary": pitch.get("summary", ""),
            "members": members_data,
            "has_proposal": proposal is not None,
        }
        
        if proposal:
            group_data["proposal_id"] = str(proposal["_id"])
            group_data["proposal_file_id"] = proposal.get("file_id")
            group_data["proposal_status"] = proposal.get("status")
            group_data["proposal_events"] = proposal.get("events", [])
            
        selected_groups.append(group_data)
        
    return selected_groups

@router.post("/review/{proposal_id}")
def review_proposal(
    proposal_id: str,
    payload: ReviewPayload,
    current_user: dict = Depends(get_current_user)
):
    user_id_str = str(current_user["_id"])
    if payload.action not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action.")
        
    try:
        proposal = proposals_col.find_one({"_id": ObjectId(proposal_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Proposal ID")
        
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    team_id = proposal.get("team_id")
    student_pitches_col = db["student_pitches"]
    pitch = student_pitches_col.find_one({
        "team_id": team_id,
        "advisor_id": user_id_str,
        "status": "accepted"
    })
    
    if not pitch:
        raise HTTPException(status_code=403, detail="You are not authorized to review this proposal.")
        
    new_event = {
        "action": f"advisor_{payload.action}",
        "actor_id": user_id_str,
        "role": "advisor",
        "timestamp": datetime.utcnow(),
        "comment": payload.comment or "No feedback provided."
    }
    
    new_status = f"advisor_{payload.action}"
    
    proposals_col.update_one(
        {"_id": ObjectId(proposal_id)},
        {
            "$set": {"status": new_status},
            "$push": {"events": new_event}
        }
    )
    
    return {"message": "Proposal review submitted successfully."}
