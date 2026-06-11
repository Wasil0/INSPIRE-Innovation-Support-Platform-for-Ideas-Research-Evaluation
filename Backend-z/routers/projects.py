from fastapi import APIRouter, Query, Depends, HTTPException
from db.db import db
from dependencies.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/projects", tags=["Projects"])
projects_col = db["Past_Projects"]

#General Projects Page (No Search)
#GET /projects?page=1&limit=12

#Search by title/description
#/projects?q=handwritten

#Search + filter batch
#/projects?q=vision&batch=2020

# Filter by advisor
# /projects?advisor=Majida

# Combined
# /projects?q=urdu&batch=2020&advisor=Fauzia&page=1&limit=6

def serialize_project(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
def get_projects(
    q: str | None = Query(None),
    batch: str | None = Query(None),
    advisor: str | None = Query(None),
    page: int = 1,
    limit: int = 10
):
    query = {}

    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"advisor": {"$regex": q, "$options": "i"}},
            {"team_members": {"$regex": q, "$options": "i"}},
            {"batch": {"$regex": q, "$options": "i"}}
        ]

    if batch:
        query["batch"] = batch

    if advisor:
        query["advisor"] = {"$regex": advisor, "$options": "i"}

    skip = (page - 1) * limit

    cursor = projects_col.find(query)

    # Default sort by batch (latest first)
    cursor = cursor.sort([("batch", -1)])

    cursor = cursor.skip(skip).limit(limit)

    total = projects_col.count_documents(query)

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": [serialize_project(doc) for doc in cursor]
    }

    
    
##Filters Data for Frontend Dropdowns
@router.get("/meta")
def get_meta():
    batches = projects_col.distinct("batch")
    advisors = projects_col.distinct("advisor")

    return {
        "batches": sorted(batches),
        "advisors": sorted(advisors)
    }

@router.get("/current-approved")
def get_current_approved_projects(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all currently approved FYDP projects (committee_accepted proposals).
    Includes project title, summary, advisor info, and member profiles.
    Accessible to all authenticated users (including Industry).
    """
    proposals_col = db["project_proposals"]
    teams_col = db["teams"]
    profiles_col = db["profiles"]
    pitches_col = db["student_pitches"]
    advisors_col = db["advisors"]
    
    # Get all committee accepted proposals
    query = {"status": "committee_accepted"}
    
    total = proposals_col.count_documents(query)
    skip = (page - 1) * limit
    
    proposals_cursor = proposals_col.find(query).sort("created_at", -1).skip(skip).limit(limit)
    
    results = []
    for p in proposals_cursor:
        team_id = p.get("team_id")
        if not team_id: continue
        
        try:
            team = teams_col.find_one({"_id": ObjectId(team_id)})
        except:
            continue
            
        if not team: continue
        
        pitch = pitches_col.find_one({"team_id": str(team_id), "status": "accepted"})
        project_title = pitch.get("title", "Untitled Proposal") if pitch else "Untitled Proposal"
        project_summary = pitch.get("summary", "") if pitch else ""
        advisor_id_str = pitch.get("advisor_id") if pitch else None
        
        advisor_name = "Unknown Advisor"
        if advisor_id_str:
            try:
                adv_profile = advisors_col.find_one({"advisor_id": ObjectId(advisor_id_str)})
                if adv_profile:
                    advisor_name = adv_profile.get("name", "Unknown Advisor")
            except:
                pass
        
        members_data = []
        for member_id in team.get("members", []):
            try:
                prof = profiles_col.find_one({"user_id": ObjectId(member_id)})
                if prof:
                    members_data.append({
                        "user_id": str(prof.get("user_id")),
                        "name": prof.get("name", "Unknown"),
                        "roll_number": prof.get("roll_number", "N/A"),
                        "skills": prof.get("skills", [])
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
            "members": members_data
        })
        
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit if limit > 0 else 0,
        "data": results
    }
