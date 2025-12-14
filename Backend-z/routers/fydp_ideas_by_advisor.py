from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional
from schemas.fydp_ideas_by_advisor import FypIdeaByAdvisor
from db.db import db, fs

router = APIRouter()
advisor_ideas_col = db["Advisor_ideas"]

# -------------------
# POST: Add FYP Idea (Flowchart Optional)
# -------------------
@router.post("/advisor_ideas")
async def ideabyadvisor(
    idea: FypIdeaByAdvisor = Depends(),  # Pydantic schema for validation
    flowchart_image: Optional[UploadFile] = File(None)  # Optional file upload
):
    # -------------------
    # Validate source_type
    # -------------------
    if idea.source_type not in ["advisor", "industry"]:
        raise HTTPException(status_code=400, detail="source_type must be 'advisor' or 'industry'")

    # -------------------
    # Validate advisor / industry
    # -------------------
    if idea.source_type == "advisor":
        if not idea.advisor_id:
            raise HTTPException(status_code=400, detail="advisor_id is required")
        try:
            advisor_obj_id = ObjectId(idea.advisor_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid advisor_id format")
    else:
        advisor_obj_id = None
        if not idea.industry_name:
            raise HTTPException(status_code=400, detail="industry_name is required")

    # -------------------
    # Handle optional image
    # -------------------
    image_id = None
    if flowchart_image:
        if flowchart_image.content_type not in ["image/png", "image/jpeg"]:
            raise HTTPException(status_code=400, detail="Only PNG or JPG images allowed")

        image_bytes = await flowchart_image.read()
        image_id = fs.put(
            image_bytes,
            filename=flowchart_image.filename,
            contentType=flowchart_image.content_type
        )

    # -------------------
    # Clean lists
    # -------------------
    domain_list = [d.strip() for d in idea.domain if d.strip()]
    skills_list = [s.strip() for s in idea.skills_required if s.strip()]

    # -------------------
    # Save idea
    # -------------------
    idea_doc = {
        "title": idea.title,
        "description": idea.description,
        "flowchart_image": image_id,   # None if not uploaded
        "domain": domain_list,
        "flow_explanation": idea.flow_explanation,
        "advisor_id": advisor_obj_id,
        "source_type": idea.source_type,
        "industry_name": idea.industry_name,
        "skills_required": skills_list
    }

    result = advisor_ideas_col.insert_one(idea_doc)

    return {
        "fyp_idea_id": str(result.inserted_id),
        "flowchart_image_id": str(image_id) if image_id else None
    }



@router.get("/advisor_ideas/top3")
def get_top_3_recent_ideas():
    ideas = advisor_ideas_col.find(
        {},                 # no filter
        {"_id": 0, "title": 1}  # exclude _id, include title only
    ).sort("_id", -1).limit(3)

    return [idea["title"] for idea in ideas]