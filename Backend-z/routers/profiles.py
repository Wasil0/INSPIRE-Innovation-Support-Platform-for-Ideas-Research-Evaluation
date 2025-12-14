from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from bson import ObjectId
from bson.errors import InvalidId
from fastapi.responses import StreamingResponse
from typing import Optional
from schemas.profiles import ProfileCreate, ProfileResponse, ProfileSummaryResponse
from database import users_col, profiles_col, fs

router = APIRouter()

# -------------------
# CREATE PROFILE
# -------------------

@router.post("/profiles", response_model=ProfileCreate)
async def create_profile(
    user_id: str = Form(...),
    name: str = Form(...),
    section: str = Form(...),
    roll_number: str = Form(...),
    semester: str = Form(...),
    batch_year: str = Form(...),
    current_year: str = Form(...),
    team_id: Optional[str] = Form(None),
    bio: str = Form(...),
    github_link: str = Form(...),
    skills: Optional[str] = Form(None),
    resume_pdf: Optional[UploadFile] = File(None)
):
    # Validate user_id
    try:
        user_obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    user = users_col.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_profile = profiles_col.find_one({"user_id": user_obj_id})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile for this user_id already exists")

    # Handle resume upload
    pdf_id = None
    if resume_pdf:
        if resume_pdf.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files allowed")
        pdf_bytes = await resume_pdf.read()
        pdf_id = fs.put(pdf_bytes, filename=resume_pdf.filename, contentType=resume_pdf.content_type)

    # Clean skills list
    skills_list = list(set(s.strip() for s in skills.split(",") if s.strip())) if skills else []

    profile_doc = {
        "user_id": user_obj_id,
        "name": name,
        "section": section,
        "roll_number": roll_number,
        "semester": semester,
        "batch_year": batch_year,
        "current_year": current_year,
        "team_id": team_id,
        "bio": bio,
        "github_link": github_link,
        "resume_pdf_id": pdf_id,
        "skills": skills_list
    }

    profiles_col.insert_one(profile_doc)

    return {
        "user_id": user_id,
        "name": name,
        "section": section,
        "roll_number": roll_number,
        "semester": semester,
        "batch_year": batch_year,
        "current_year": current_year,
        "team_id": team_id,
        "bio": bio,
        "github_link": github_link,
        "resume_pdf_id": str(pdf_id) if pdf_id else None,
        "skills": skills_list
    }

# -------------------
# GET PROFILE
# -------------------

@router.get("/profiles/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str):
    try:
        user_obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    profile = profiles_col.find_one({"user_id": user_obj_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_doc = users_col.find_one({"_id": user_obj_id})
    gsuite_id = user_doc.get("gsuite_id") if user_doc else None

    return {
        "user_id": str(profile["user_id"]),
        "gsuite_id": gsuite_id,
        "name": profile.get("name"),
        "section": profile.get("section"),
        "roll_number": profile.get("roll_number"),
        "semester": profile.get("semester"),
        "batch_year": profile.get("batch_year"),
        "current_year": profile.get("current_year"),
        "team_id": profile.get("team_id"),
        "bio": profile.get("bio"),
        "github_link": profile.get("github_link"),
        "resume_pdf_id": str(profile.get("resume_pdf_id")) if profile.get("resume_pdf_id") else None,
        "skills": profile.get("skills", []),
    }

# -------------------
# DOWNLOAD PDF
# -------------------

@router.get("/profiles/pdf/{pdf_id}")
def preview_pdf(pdf_id: str):
    try:
        grid_out = fs.get(ObjectId(pdf_id))
    except:
        raise HTTPException(status_code=404, detail="PDF not found")

    return StreamingResponse(
        grid_out,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
    )

# -------------------
# PROFILE SUMMARY
# -------------------

@router.get("/profiles/summary/{user_id}", response_model=ProfileSummaryResponse)
def get_profile_summary(user_id: str):
    try:
        user_obj_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    profile = profiles_col.find_one({"user_id": user_obj_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_doc = users_col.find_one({"_id": user_obj_id})
    gsuite_id = user_doc.get("gsuite_id") if user_doc else None

    return {
        "name": profile.get("name"),
        "gsuite_id": gsuite_id,
        "batch_year": profile.get("batch_year"),
        "current_year": profile.get("current_year"),
        "skills": profile.get("skills", []),
        "semester": profile.get("semester"),
        "team_id": profile.get("team_id"),
    }
