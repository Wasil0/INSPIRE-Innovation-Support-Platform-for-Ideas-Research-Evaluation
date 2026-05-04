from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from bson import ObjectId
from bson.errors import InvalidId
from fastapi.responses import StreamingResponse
from typing import Optional
from schemas.profiles import ProfileCreate, ProfileResponse, ProfileSummaryResponse
from db.db import users_col, profiles_col, fs
from fastapi import Depends
from dependencies.auth import get_current_user
# -------------------
# CREATE PROFILE
# -------------------
router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.post("/", response_model=ProfileCreate)
async def create_profile(
    current_user: dict = Depends(get_current_user),
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
    resume_pdf: Optional[UploadFile] = File(None),
    stage1_completed: Optional[bool] = Form(False),
    stage2_completed: Optional[bool] = Form(False),
    stage3_completed: Optional[bool] = Form(False),
    stage4_completed: Optional[bool] = Form(False)
):
    # 🔐 user_id from JWT
    user_obj_id = current_user["_id"]

    # Ensure user exists (same check as before)
    user = users_col.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_profile = profiles_col.find_one({"user_id": user_obj_id})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already exists")

    # Resume upload (unchanged)
    pdf_id = None
    if resume_pdf:
        if resume_pdf.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files allowed")

        pdf_bytes = await resume_pdf.read()
        pdf_id = fs.put(
            pdf_bytes,
            filename=resume_pdf.filename,
            contentType=resume_pdf.content_type
        )

    # Skills cleaning (unchanged)
    skills_list = (
        list(set(s.strip() for s in skills.split(",") if s.strip()))
        if skills else []
    )

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
        "skills": skills_list,
         "stages": {
            "stage1_completed": stage1_completed,
            "stage2_completed": stage2_completed,
            "stage3_completed": stage3_completed,
            "stage4_completed": stage4_completed
        },
    }

    profiles_col.insert_one(profile_doc)

    return {
        "user_id": str(user_obj_id),
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
        "skills": skills_list,
        "stages": {
            "stage1_completed": stage1_completed,
            "stage2_completed": stage2_completed,
            "stage3_completed": stage3_completed,
            "stage4_completed": stage4_completed
        },
    }
# -------------------
# GET PROFILE
# -------------------

@router.get("/{user_id}", response_model=ProfileResponse)
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

    # Get stage data or use default if not exists
    stage_data = profile.get("stages", {
        "stage1_completed": False,
        "stage2_completed": False,
        "stage3_completed": False,
        "stage4_completed": False
    })

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
        # Add stage data
        "stages": stage_data,
    }
    
    
# -------------------
# DOWNLOAD PDF
# -------------------

@router.get("/pdf/{pdf_id}")
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
