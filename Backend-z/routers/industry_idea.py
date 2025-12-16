from fastapi import APIRouter, HTTPException
from db.db import db
from schemas.industry_idea import IndustryIdea , IndustryIdeaStatusUpdate
from bson import ObjectId

router = APIRouter()
industry_ideas_col = db["Industry_Ideas"]

# ---------------- POST API ----------------
@router.post("/industry/ideas")
def industry_idea(idea: IndustryIdea):
    idea_doc = {
        "title": idea.title,
        "description": idea.description,
        "industry_name": idea.industry_name,
        "contact_email": idea.contact_email,
        "technology_stack": idea.technology_stack or [],
        "expected_skills": idea.expected_skills or [],
        "status": "pending",           
    }

    # Check for duplicate idea
    duplicate_check = industry_ideas_col.find_one({
        "title": idea_doc["title"],
        "description": idea_doc["description"],
        "industry_name": idea_doc["industry_name"]
    })

    if duplicate_check:
        raise HTTPException(
            status_code=400,
            detail="An industry idea with the exact same details already exists."
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



@router.get("/industry/ideas/approved")
def get_approved_industry_ideas():
    ideas = []

    cursor = industry_ideas_col.find(
        {"status": "approved"}
    )

    for doc in cursor:
        ideas.append({
            "idea_id": str(doc["_id"]),
            "title": doc["title"],
            "description": doc["description"],
            "industry_name": doc["industry_name"],
            "technology_stack": doc.get("technology_stack", []),
            "expected_skills": doc.get("expected_skills", []),
        })

    return ideas
