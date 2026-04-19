from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime

from db.db import db
from dependencies.auth import get_current_user
from utils.mongo import serialize_mongo

router = APIRouter(prefix="/student/jobs", tags=["Student Job Applications"])

industry_jobs_col = db["Industry_Jobs"]
student_job_applications_col = db["student_job_applications"]
profiles_col = db["profiles"]
users_col = db["users"]

@router.post("/{job_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_industry_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Allows an individual student to apply for a listed Industry Job.
    Stores the application independently connected to the user_id.
    """
    user_id = ObjectId(current_user["_id"])

    # Verify user exists and is a student
    profile = profiles_col.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=400, detail="User profile not found")

    # Ensure job exists
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = industry_jobs_col.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")

    if job.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Only approved industry jobs can be applied to")

    # Prevent duplicate applications
    if student_job_applications_col.find_one({
        "job_id": ObjectId(job_id),
        "user_id": user_id
    }):
        raise HTTPException(status_code=409, detail="You have already applied for this job")

    student_job_applications_col.insert_one({
        "job_id": ObjectId(job_id),
        "user_id": user_id,
        "industry_id": job.get("industry_id"),
        "status": "applied",
        "created_at": datetime.utcnow()
    })

    return {
        "message": "Successfully applied for the job!"
    }


@router.get("/my-applications")
def my_applied_jobs(current_user: dict = Depends(get_current_user)):
    """
    Returns a list of all Industry jobs the current user has applied for.
    """
    user_id = ObjectId(current_user["_id"])
    
    try:
        data = list(
            student_job_applications_col.find(
                {"user_id": user_id},
                {"_id": 0}
            ).sort("created_at", -1)
        )
        return serialize_mongo(data)
    except Exception as e:
        print(f"Error fetching applied jobs: {e}")
        return []


@router.get("/industry-view/applicants")
def get_industry_job_applicants(current_user: dict = Depends(get_current_user)):
    """
    Returns a list of all students who have applied to the logged-in industry user's jobs.
    """
    industry_id = ObjectId(current_user["_id"])
    
    try:
        # Fetch all job application records matching the industry_id
        applications = list(student_job_applications_col.find({"industry_id": industry_id}))
        
        # Enrich the records with Job titles and Student profiles
        result = []
        for app in applications:
            record = serialize_mongo(app)
            
            # Lookup the job title
            job = industry_jobs_col.find_one({"_id": ObjectId(app["job_id"])})
            if job:
                record["job_title"] = job.get("title", "Unknown Job")
                
            # Lookup the student profile
            profile = profiles_col.find_one({"user_id": ObjectId(app["user_id"])})
            if profile:
                record["student_name"] = profile.get("name", "Unknown Name")
                
                user_doc = users_col.find_one({"_id": profile["user_id"]})
                record["student_email"] = "Unknown Email"
                if user_doc:
                    record["student_email"] = user_doc.get("email") or user_doc.get("gsuite_id") or "Unknown Email"
                    
                record["student_roll"] = profile.get("roll_number", "")
                record["student_skills"] = profile.get("skills", [])
                record["resume_id"] = str(profile.get("resume_pdf_id", "")) if profile.get("resume_pdf_id") else None
            else:
                record["student_name"] = "Unknown Profile"
                
            result.append(record)
            
        return result
    except Exception as e:
        print(f"Error fetching industry job applicants: {e}")
        return []
