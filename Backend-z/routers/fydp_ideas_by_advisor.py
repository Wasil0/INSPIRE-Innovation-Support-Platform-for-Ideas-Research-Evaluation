from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional
from schemas.fydp_ideas_by_advisor import FypIdeaByAdvisor
from db.db import db, fs

router = APIRouter()
advisor_ideas_col = db["Advisor_ideas"]
advisors_col = db["advisors"]

# ------------------- POST: Add FYP Idea -------------------
@router.post("/advisor_ideas")
async def ideabyadvisor(
    title: str = Form(...),
    description: str = Form(...),
    flow_explanation: str = Form(...),
    domain: str = Form(...),
    skills_required: str = Form(...),
    source_type: str = Form(...),
    advisor_id: Optional[str] = Form(None),
    industry_name: Optional[str] = Form(None),
    flowchart_image: Optional[UploadFile] = File(None)
):
    # Validate source_type
    if source_type not in ["advisor", "industry"]:
        raise HTTPException(status_code=400, detail="source_type must be 'advisor' or 'industry'")

    # Validate advisor / industry
    if source_type == "advisor":
        if not advisor_id:
            raise HTTPException(status_code=400, detail="advisor_id is required")
        try:
            advisor_obj_id = ObjectId(advisor_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid advisor_id format")
    else:
        advisor_obj_id = None
        if not industry_name:
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

    # Convert comma-separated strings to lists
    domain_list = [d.strip() for d in domain.split(",") if d.strip()]
    skills_list = [s.strip() for s in skills_required.split(",") if s.strip()]

    # Duplicate check
    duplicate_query = {
        "title": title,
        "description": description,
        "source_type": source_type,
        "advisor_id": advisor_obj_id,
        "industry_name": industry_name
    }
    duplicate = advisor_ideas_col.find_one(duplicate_query)
    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="An FYP idea with the exact same details already exists."
        )

    # Save idea
    idea_doc = {
        "title": title,
        "description": description,
        "flowchart_image": ObjectId(image_id) if image_id else None,  # Store as ObjectId
        "domain": domain_list,
        "flow_explanation": flow_explanation,
        "advisor_id": advisor_obj_id,  # Store as ObjectId
        "source_type": source_type,
        "industry_name": industry_name,
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


@router.get("/advisor_ideas/my-ideas")
def get_my_ideas(
    advisor_id: str = Query(...),
    source_type: str = Query("advisor", description="advisor | industry")
):
    """
    Get all ideas posted by a specific advisor (for dropdown/selection purposes).
    Returns only id and title for efficiency.
    """
    query = {"source_type": source_type}
    
    try:
        query["advisor_id"] = ObjectId(advisor_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid advisor_id")
    
    ideas = advisor_ideas_col.find(
        query,
        {"_id": 1, "title": 1}  # Only return id and title
    ).sort("_id", -1)
    
    return [
        {
            "idea_id": str(idea["_id"]),
            "title": idea.get("title", "")
        }
        for idea in ideas
    ]


@router.get("/advisor_ideas")
def get_advisor_ideas(
    advisor_id: str | None = Query(None),
    sort: str | None = Query(None, description="az | za"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50)
):
    query = {"source_type": "advisor"}

    if advisor_id:
        try:
            query["advisor_id"] = ObjectId(advisor_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid advisor_id")

    # Sorting
    sort_query = None
    if sort == "az":
        sort_query = [("title", 1)]
    elif sort == "za":
        sort_query = [("title", -1)]

    skip = (page - 1) * limit

    cursor = advisor_ideas_col.find(query)

    if sort_query:
        cursor = cursor.sort(sort_query)

    cursor = cursor.skip(skip).limit(limit)

    total = advisor_ideas_col.count_documents(query)

    ideas = []
    for doc in cursor:
        advisor_name = None
        if doc.get("advisor_id"):
            advisor_doc = advisors_col.find_one({"advisor_id": doc["advisor_id"]})
            advisor_name = advisor_doc.get("name") if advisor_doc else None
        
        ideas.append({
            "idea_id": str(doc["_id"]),
            "title": doc.get("title"),
            "description": doc.get("description"),
            "flowchart_image": str(doc["flowchart_image"]) if doc.get("flowchart_image") else None,
            "domain": doc.get("domain", []),
            "flow_explanation": doc.get("flow_explanation"),
            "advisor_id": str(doc["advisor_id"]) if doc.get("advisor_id") else None,
            "advisor_name": advisor_name,
            "industry_name": doc.get("industry_name"),
            "skills_required": doc.get("skills_required", [])
        })

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "ideas": ideas
    }


# -------------------
# GET FLOWCHART IMAGE
# -------------------

@router.get("/advisor_ideas/image/{image_id}")
def get_flowchart_image(image_id: str):
    """
    Serve flowchart image from GridFS.
    """
    try:
        grid_out = fs.get(ObjectId(image_id))
    except:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return StreamingResponse(
        grid_out,
        media_type=grid_out.content_type or "image/png",
        headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
    )
