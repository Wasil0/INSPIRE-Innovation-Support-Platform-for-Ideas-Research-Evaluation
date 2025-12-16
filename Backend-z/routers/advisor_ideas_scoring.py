from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime

from db.db import db
from dependencies.auth import get_current_user
from utils.scoring import calculate_match_scores
from utils.mongo import serialize_mongo


router = APIRouter(prefix="/advisor-projects", tags=["Advisor Projects"])

profiles_col = db["profiles"]
teams_col = db["teams"]
projects_col = db["Advisor_ideas"]
interested_col = db["interested_teams"]


@router.post("/{project_id}/interested", status_code=status.HTTP_201_CREATED)
def mark_interested(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    
    """
    Marks a team as interested in a given advisor project.

    Steps:
    - Verify user belongs to a team
    - Ensure team and project exist
    - Prevent duplicate interest
    - Calculate team–project skill match
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

    if interested_col.find_one({
        "project_id": ObjectId(project_id),
        "team_id": team_id
    }):
        raise HTTPException(409, "Team already marked interest")

    project = projects_col.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(404, "Project not found")

    team_profiles = list(
        profiles_col.find({
            "user_id": {"$in": [ObjectId(uid) for uid in team["members"]]}
        })
    )

    team_score, matched_skills, members = calculate_match_scores(
        team_profiles,
        project.get("skills_required", [])
    )

    interested_col.insert_one({
        "advisor_id": project["advisor_id"],
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


@router.get("/advisor/interested-teams")
def advisor_notifications(current_user: dict = Depends(get_current_user)):
    
    """
    Allows an advisor to view all teams interested in their projects.
    Results are sorted by most recent interest first.
    """
    
    data = list(
        interested_col.find(
            {"advisor_id": ObjectId(current_user["_id"])},
            {"_id": 0}
        ).sort("created_at", -1)
    )
    return serialize_mongo(data)

@router.get("/{project_id}/interested-teams")
def project_interested_teams(project_id: str):
    
    """
    Returns all teams interested in a specific project.
    Teams are sorted by highest matching score.
    """
    
    data = list(
        interested_col.find(
            {"project_id": ObjectId(project_id)},
            {"_id": 0}
        ).sort("team_score", -1)
    )
    return serialize_mongo(data)

@router.get("/team/my-interests")
def my_team_interests(current_user: dict = Depends(get_current_user)):
    
    """
    Allows a student to see all projects their team has applied for.
    """
    
    profile = profiles_col.find_one(
        {"user_id": ObjectId(current_user["_id"])}
    )

    if not profile or not profile.get("team_id"):
        raise HTTPException(400, "User not in a team")

    data = list(
        interested_col.find(
            {"team_id": profile["team_id"]},
            {"_id": 0}
        ).sort("created_at", -1)
    )
    return serialize_mongo(data)




"""
============================ Advisor Projects APIs ============================

This router handles the interaction between:
- Student teams
- Advisor projects
- Interest tracking and skill-based matching

APIs PROVIDED
-------------

1) POST /advisor-projects/{project_id}/interested
   Use:
   - Allows a student team to mark interest in an advisor’s project
   - Calculates team–project skill matching score

   Output:
   {
     "message": "Interest recorded",
     "team_score": <float>
   }

2) GET /advisor-projects/advisor/interested-teams
   Use:
   - Allows an advisor to view all teams interested in their projects
   - Sorted by latest interest first

   Output:
   [
     {
       "advisor_id": <str>,
       "project_id": <str>,
       "team_id": <str>,
       "team_score": <float>,
       "matched_skills": [<str>],
       "members": [...],
       "status": "pending",
       "created_at": <ISO datetime>
     }
   ]

3) GET /advisor-projects/{project_id}/interested-teams
   Use:
   - View all teams interested in a specific project
   - Sorted by best matching team first

   Output:
   [
     {
       "team_id": <str>,
       "team_score": <float>,
       "matched_skills": [...],
       "members": [...],
       "status": "pending"
     }
   ]

4) GET /advisor-projects/team/my-interests
   Use:
   - Allows a student to see all projects their team has applied to

   Output:
   [
     {
       "advisor_id": <str>,
       "project_id": <str>,
       "team_score": <float>,
       "matched_skills": [...],
       "members": [...],
       "status": "pending",
       "created_at": <ISO datetime>
     }
   ]

===============================================================================
"""