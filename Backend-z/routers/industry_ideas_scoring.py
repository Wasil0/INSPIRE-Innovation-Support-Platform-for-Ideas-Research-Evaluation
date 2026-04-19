from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime

from db.db import db
from dependencies.auth import get_current_user
from utils.scoring import calculate_match_scores
from utils.mongo import serialize_mongo


router = APIRouter(prefix="/industry-projects", tags=["Industry Projects"])

profiles_col = db["profiles"]
teams_col = db["teams"]
industry_projects_col = db["Industry_Ideas"]
industry_interested_col = db["industry_interested_teams"]


@router.post("/{project_id}/interested", status_code=status.HTTP_201_CREATED)
def mark_interested(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Marks a team as interested in a given industry project.
    
    Steps:
    - Verify user belongs to a team
    - Ensure team and project exist
    - Prevent duplicate interest
    - Calculate team-project skill match
    - Store interest record in DB
    """
    user_id = ObjectId(current_user["_id"])

    profile = profiles_col.find_one({"user_id": user_id})
    if not profile or not profile.get("team_id"):
        raise HTTPException(400, "User is not part of a team")

    team_id = profile["team_id"]

    team = teams_col.find_one({"final_team_id": team_id})
    if not team:
        raise HTTPException(404, "Team not found")

    if industry_interested_col.find_one({
        "project_id": ObjectId(project_id),
        "team_id": team_id
    }):
        raise HTTPException(409, "Team already marked interest in this industry project")

    project = industry_projects_col.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(404, "Project not found")

    if project.get("status") != "approved":
        raise HTTPException(400, "Only approved industry projects can be applied to")

    team_profiles = list(
        profiles_col.find({
            "user_id": {"$in": [ObjectId(uid) for uid in team["members"]]}
        })
    )

    # Industry ideas use expected_skills and technology_stack. We'll use expected_skills for scoring.
    # We can combine expected_skills and technology_stack if we want to be thorough.
    combined_skills = project.get("expected_skills", []) + project.get("technology_stack", [])
    # Determine unique items (case-insensitive deduplication could be done but a simple set works fine)
    unique_skills_required = list(set(combined_skills))
    
    team_score, matched_skills, members = calculate_match_scores(
        team_profiles,
        unique_skills_required
    )

    industry_interested_col.insert_one({
        "industry_id": project.get("industry_id"),
        "project_id": ObjectId(project_id),
        "team_id": team_id,

        "team_score": team_score,
        "matched_skills": matched_skills,
        "members": members,

        "status": "pending",
        "created_at": datetime.utcnow()
    })

    return {
        "message": "Interest recorded",
        "team_score": team_score
    }


@router.get("/team/my-interests")
def my_team_interests(current_user: dict = Depends(get_current_user)):
    """
    Returns a list of all Industry projects the current user's team has shown interest in.
    """
    user_id = ObjectId(current_user["_id"])
    
    profile = profiles_col.find_one({"user_id": user_id})
    if not profile or not profile.get("team_id"):
        return []

    team_id = profile["team_id"]
    
    try:
        data = list(
            industry_interested_col.find(
                {"team_id": team_id},
                {"_id": 0}
            ).sort("created_at", -1)
        )
        return serialize_mongo(data)
    except Exception as e:
        print(f"Error fetching team industry interests: {e}")
        return []

@router.get("/industry/interested-groups")
def get_industry_interested_groups(current_user: dict = Depends(get_current_user)):
    """
    Returns a list of all groups that have shown interest in the logged-in industry user's ideas.
    """
    industry_id = ObjectId(current_user["_id"])
    
    try:
        # Fetch all interest records matching the industry_id
        interests = list(industry_interested_col.find({"industry_id": industry_id}))
        
        # Enrich the records with Idea titles
        result = []
        for interest in interests:
            record = serialize_mongo(interest)
            
            # Lookup the idea title
            idea = industry_projects_col.find_one({"_id": ObjectId(interest["project_id"])})
            if idea:
                record["idea_title"] = idea.get("title", "Unknown Idea")
                
            # Enrich members with names and emails
            if "members" in record and isinstance(record["members"], list):
                for mem in record["members"]:
                    uid_str = mem.get("user_id")
                    if uid_str:
                        try:
                            uid_obj = ObjectId(uid_str)
                        except Exception:
                            uid_obj = uid_str
                            
                        profile = profiles_col.find_one({"user_id": uid_obj})
                        mem["name"] = profile.get("name", "Unknown Member") if profile else "Unknown Member"
                        mem["roll_number"] = profile.get("roll_number", "") if profile else ""
                        
                        user_doc = db["users"].find_one({"_id": uid_obj})
                        if user_doc:
                            mem["email"] = user_doc.get("email") or user_doc.get("gsuite_id") or "Unknown Email"
                        else:
                            mem["email"] = "Unknown Email"
                            
            result.append(record)
            
        return result
    except Exception as e:
        print(f"Error fetching industry interested groups: {e}")
        return []
