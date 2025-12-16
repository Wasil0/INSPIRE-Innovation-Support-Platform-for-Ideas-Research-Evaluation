from fastapi import APIRouter, HTTPException, Depends
from db.db import db
from schemas.industry_idea import IndustryIdea, IndustryIdeaStatusUpdate, ApprovedIdeaResponse
from bson import ObjectId
from dependencies.auth import get_current_user   # JWT dependency
from typing import List

router = APIRouter()
industry_ideas_col = db["Industry_Ideas"]

# ---------------- POST API ----------------
@router.post("/industry/ideas")
def create_industry_idea(
    idea: IndustryIdea,
    current_user: dict = Depends(get_current_user)  # JWT provides logged-in user
):
    # 🔐 Get industry_id from logged-in user
    user_industry_id = current_user["_id"]

    idea_doc = {
        "title": idea.title,
        "description": idea.description,
        "technology_stack": idea.technology_stack or [],
        "expected_skills": idea.expected_skills or [],
        "industry_id": ObjectId(user_industry_id),  # assign current user ID
        "status": "pending",           
    }

    # Check for duplicate idea (title + description + industry_id)
    duplicate_check = industry_ideas_col.find_one({
        "title": idea_doc["title"],
        "description": idea_doc["description"],
        "industry_id": ObjectId(user_industry_id)
    })

    if duplicate_check:
        raise HTTPException(
            status_code=400,
            detail="An industry idea with the same title and description already exists."
        )

    result = industry_ideas_col.insert_one(idea_doc)    
    
    return {
        "message": "Industry idea submitted successfully and the status is pending for approval",
        "idea_id": str(result.inserted_id)
    }



@router.patch("/industry/ideas/{idea_id}/status")
def update_industry_idea_status(
    idea_id: str,
    data: IndustryIdeaStatusUpdate
):
    if not ObjectId.is_valid(idea_id):
        raise HTTPException(status_code=400, detail="Invalid idea ID")

    result = industry_ideas_col.update_one(
        {"_id": ObjectId(idea_id)},
        {
            "$set": {
                "status": data.status,
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Industry idea not found")

    return {
        "message": f"Industry idea has been {data.status}"
    }



@router.get("/industry/ideas/approved", response_model=List[ApprovedIdeaResponse])
def get_approved_industry_ideas():
    """
    Get ALL approved industry ideas from ALL industries with their company profiles.
    Also includes advisor's gsuite_id if an advisor is assigned.
    Public endpoint - no authentication required.
    """
    ideas = []
    
    # Get all approved ideas
    cursor = industry_ideas_col.find({"status": "approved"})
    
    for doc in cursor:
        # Get the industry profile for each idea
        industry_profile = db["industry_profiles"].find_one({
            "industry_id": doc["industry_id"]
        })
        
        if not industry_profile:
            continue
        
        # Initialize advisor_gsuite_id as None
        industry_gsuite_id = None
        
        # If the idea has an advisor_id, look up the advisor's gsuite_id
        if doc.get("industry_id"):
            industry = db["users"].find_one({
                "_id": ObjectId(doc["industry_id"])
            })
            
            if industry and industry.get("gsuite_id"):
                industry_gsuite_id = industry["gsuite_id"]
        
        ideas.append(ApprovedIdeaResponse(
            idea_id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            technology_stack=doc.get("technology_stack", []),
            expected_skills=doc.get("expected_skills", []),
            # Industry profile information
            company_name=industry_profile["company_name"],
            gmail=industry_gsuite_id,
            company_type=industry_profile["company_type"],
            industry_domain=industry_profile["industry_domain"],
            company_description=industry_profile["company_description"],
            founded_year=industry_profile["founded_year"],
            location=industry_profile["location"],
            
        ))
    
    return ideas


@router.get("/industry/ideas/pending", response_model=List[ApprovedIdeaResponse])
def get_pending_industry_ideas():
    """
    Get ALL pending industry ideas from ALL industries with their company profiles.
    Public endpoint - no authentication required.
    """
    ideas = []
    
    # Get all pending ideas
    cursor = industry_ideas_col.find({"status": "pending"})
    
    for doc in cursor:
        # Get the industry profile for each idea
        industry_profile = db["industry_profiles"].find_one({
            "industry_id": doc["industry_id"]
        })
        
        if not industry_profile:
            continue
        
        # Initialize industry_gsuite_id as None
        industry_gsuite_id = None
        
        # If the idea has an industry_id, look up the industry's gsuite_id
        if doc.get("industry_id"):
            industry = db["users"].find_one({
                "_id": ObjectId(doc["industry_id"])
            })
            
            if industry and industry.get("gsuite_id"):
                industry_gsuite_id = industry["gsuite_id"]
        
        ideas.append(ApprovedIdeaResponse(
            idea_id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            technology_stack=doc.get("technology_stack", []),
            expected_skills=doc.get("expected_skills", []),
            # Industry profile information
            company_name=industry_profile["company_name"],
            gmail=industry_gsuite_id,
            company_type=industry_profile["company_type"],
            industry_domain=industry_profile["industry_domain"],
            company_description=industry_profile["company_description"],
            founded_year=industry_profile["founded_year"],
            location=industry_profile["location"],
        ))
    
    return ideas