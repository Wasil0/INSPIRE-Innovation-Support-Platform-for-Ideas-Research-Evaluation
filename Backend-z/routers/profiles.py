from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from bson import ObjectId
from bson.errors import InvalidId
from fastapi.responses import StreamingResponse
from typing import Optional, List
from schemas.profiles import ProfileCreate, ProfileResponse, ProfileSummaryResponse
from db.db import users_col, profiles_col, fs, db
from fastapi import Depends
from dependencies.auth import get_current_user
from utils.mongo import serialize_mongo
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

# -------------------
# GET ALL STUDENTS (For Committee)
# -------------------

@router.get("/students/all")
def get_all_students(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or roll number"),
    group_filter: Optional[str] = Query(None, description="Filter by group status: 'formed', 'not_formed'"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all students with pagination, search, and filtering.
    Only accessible by committee members.
    """
    # Check if user is committee member (you may want to add this check)
    # For now, we'll allow any authenticated user (committee check can be added later)
    
    teams_col = db["teams"]
    
    # Build query
    query = {}
    
    # Search filter
    search_conditions = []
    if search:
        search_lower = search.lower()
        search_conditions = [
            {"name": {"$regex": search_lower, "$options": "i"}},
            {"roll_number": {"$regex": search_lower, "$options": "i"}}
        ]
    
    # Group filter - check if any stage is completed (group formed)
    group_conditions = {}
    if group_filter == "formed":
        # Students who have completed at least stage 1 (group formed)
        group_conditions["$or"] = [
            {"stages.stage1_completed": True},
            {"stages.stage2_completed": True},
            {"stages.stage3_completed": True},
            {"stages.stage4_completed": True}
        ]
    elif group_filter == "not_formed":
        # Students who haven't completed any stage (group not formed)
        group_conditions["$and"] = [
            {"stages.stage1_completed": {"$ne": True}},
            {"stages.stage2_completed": {"$ne": True}},
            {"stages.stage3_completed": {"$ne": True}},
            {"stages.stage4_completed": {"$ne": True}}
        ]
    
    # Combine search and group filters
    if search_conditions and group_conditions:
        query = {
            "$and": [
                {"$or": search_conditions},
                group_conditions
            ]
        }
    elif search_conditions:
        query["$or"] = search_conditions
    elif group_conditions:
        query.update(group_conditions)
    
    # Count total matching documents
    total_count = profiles_col.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = (total_count + limit - 1) // limit
    
    # Fetch profiles with pagination
    cursor = profiles_col.find(query).skip(skip).limit(limit).sort("name", 1)
    
    students = []
    for profile in cursor:
        user_id = str(profile.get("user_id"))
        
        # Get stage information
        stages = profile.get("stages", {})
        stage1_completed = stages.get("stage1_completed", False)
        stage2_completed = stages.get("stage2_completed", False)
        stage3_completed = stages.get("stage3_completed", False)
        stage4_completed = stages.get("stage4_completed", False)
        
        # Determine if group is formed (any stage completed)
        group_formed = stage1_completed or stage2_completed or stage3_completed or stage4_completed
        group_status = "Group Formed" if group_formed else "Group Not Formed"
        
        students.append({
            "user_id": user_id,
            "name": profile.get("name", ""),
            "roll_number": profile.get("roll_number", ""),
            "group_status": group_status,
            "group_formed": group_formed,
        })
    
    return {
        "students": serialize_mongo(students),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "total_pages": total_pages
        }
    }

# -------------------
# GET ALL LOCKED GROUPS (For Committee)
# -------------------

@router.get("/groups/all")
def get_all_locked_groups(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by member name or roll number"),
    stage_filter: Optional[str] = Query(None, description="Filter by stage: 'stage1', 'stage2', 'stage3', 'stage4'"),
    advisor_sort: Optional[str] = Query(None, description="Sort by advisor: 'has_advisor', 'no_advisor'"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all locked FYDP groups with member details, stage status, and advisor info.
    Only accessible by committee members.
    """
    # TODO: Add committee member role check here
    
    teams_col = db["teams"]
    advisors_col = db["advisors"]
    
    # Get all locked teams
    query = {"is_locked": True}
    
    # Apply filters
    if stage_filter or advisor_sort or search:
        # We'll filter after fetching teams based on member profiles
        pass
    
    # Count total locked teams
    total_count = teams_col.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = (total_count + limit - 1) // limit
    
    # Fetch teams with pagination
    teams_cursor = teams_col.find(query).skip(skip).limit(limit).sort("locked_at", -1)
    
    groups = []
    for team in teams_cursor:
        team_id = team.get("final_team_id") or team.get("team_id", "")
        member_ids = team.get("members", [])
        
        # Ensure member_ids is a list
        if not member_ids:
            continue
        
        if not isinstance(member_ids, list):
            # If it's a single value, convert to list
            member_ids = [member_ids]
        
        # Get member profiles
        member_object_ids = []
        for member_id in member_ids:
            try:
                # member_id might already be ObjectId or string
                if isinstance(member_id, ObjectId):
                    member_object_ids.append(member_id)
                elif isinstance(member_id, str):
                    member_object_ids.append(ObjectId(member_id))
                else:
                    # Try to convert to string first
                    member_object_ids.append(ObjectId(str(member_id)))
            except:
                continue
        
        if not member_object_ids:
            continue
        
        # Fetch member profiles
        member_profiles = list(profiles_col.find(
            {"user_id": {"$in": member_object_ids}},
            {"name": 1, "roll_number": 1, "user_id": 1, "stages": 1, "advisor_id": 1}
        ))
        
        # Get stage status from first member (all members should have same stage)
        stage_status = "Stage 1"
        advisor_id = None
        advisor_name = None
        
        if member_profiles:
            first_member = member_profiles[0]
            stages = first_member.get("stages", {})
            stage1 = stages.get("stage1_completed", False)
            stage2 = stages.get("stage2_completed", False)
            stage3 = stages.get("stage3_completed", False)
            stage4 = stages.get("stage4_completed", False)
            
            if stage4:
                stage_status = "Stage 4"
            elif stage3:
                stage_status = "Stage 3"
            elif stage2:
                stage_status = "Stage 2"
            elif stage1:
                stage_status = "Stage 1"
            
            # Get advisor_id from profile (if stage2 completed)
            if stage2:
                advisor_id = first_member.get("advisor_id")
                if advisor_id:
                    try:
                        advisor_obj_id = ObjectId(advisor_id) if isinstance(advisor_id, str) else advisor_id
                        advisor_doc = advisors_col.find_one({"advisor_id": advisor_obj_id})
                        if advisor_doc:
                            advisor_name = advisor_doc.get("name", "")
                    except:
                        pass
        
        # Build member list with names and roll numbers
        members_list = []
        for profile in member_profiles:
            members_list.append({
                "user_id": str(profile.get("user_id", "")),
                "name": profile.get("name", "Unknown"),
                "roll_number": profile.get("roll_number", "")
            })
        
        # Apply search filter (by member name or roll number)
        if search:
            search_lower = search.lower()
            matches_search = any(
                search_lower in member.get("name", "").lower() or 
                search_lower in member.get("roll_number", "").lower()
                for member in members_list
            )
            if not matches_search:
                continue
        
        # Apply stage filter
        if stage_filter:
            if stage_filter == "stage1" and stage_status != "Stage 1":
                continue
            elif stage_filter == "stage2" and stage_status != "Stage 2":
                continue
            elif stage_filter == "stage3" and stage_status != "Stage 3":
                continue
            elif stage_filter == "stage4" and stage_status != "Stage 4":
                continue
        
        # Apply advisor sort/filter
        if advisor_sort == "has_advisor":
            if not advisor_id:
                continue
        elif advisor_sort == "no_advisor":
            if advisor_id:
                continue
        
        groups.append({
            "team_id": team_id,
            "members": members_list,
            "stage_status": stage_status,
            "advisor_id": str(advisor_id) if advisor_id else None,
            "advisor_name": advisor_name,
            "total_members": len(members_list)
        })
    
    # Sort by advisor if requested
    if advisor_sort == "has_advisor":
        groups.sort(key=lambda x: (x.get("advisor_name") or ""))
    elif advisor_sort == "no_advisor":
        groups.sort(key=lambda x: (x.get("advisor_name") or ""), reverse=True)
    
    # Re-count after filtering
    if search or stage_filter or advisor_sort:
        total_count = len(groups)
        total_pages = (total_count + limit - 1) // limit
    
    return {
        "groups": serialize_mongo(groups),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "total_pages": total_pages
        }
    }
