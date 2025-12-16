from fastapi import APIRouter, HTTPException
from db.db import db
from schemas.industry_job import IndustryJobPosting, IndustryJobStatusUpdate, IndustryJobResponse
from bson import ObjectId
from dependencies.auth import get_current_user   # JWT dependency
from typing import List
from fastapi import Depends

router = APIRouter()
industry_jobs_col = db["Industry_Jobs"]

# ---------------- POST API ----------------
@router.post("/industry/jobs")
def create_industry_job(
    job: IndustryJobPosting,
    current_user: dict = Depends(get_current_user)  # JWT provides logged-in user
):
    # 🔐 Get industry_id from logged-in user
    user_industry_id = current_user["_id"]

    job_doc = {
        "title": job.title,
        "description": job.description,
        "job_type": job.job_type,
        "amount": job.amount,
        "duration": job.duration,
        "technology_stack": job.technology_stack or [],
        "expected_skills": job.expected_skills or [],
        "industry_id": ObjectId(user_industry_id),  # assign current user ID
        "status": "pending",           
    }

    # Check for duplicate job (title + description + industry_id)
    duplicate_check = industry_jobs_col.find_one({
        "title": job_doc["title"],
        "description": job_doc["description"],
        "industry_id": ObjectId(user_industry_id)
    })

    if duplicate_check:
        raise HTTPException(
            status_code=400,
            detail="An industry job posting with the same title and description already exists."
        )

    result = industry_jobs_col.insert_one(job_doc)    
    
    return {
        "message": "Industry job/internship/training submitted successfully and is pending approval",
        "job_id": str(result.inserted_id)
    }
    
    

# ---------------- PATCH API ----------------
@router.patch("/industry/jobs/{job_id}/status")
def update_industry_job_status(
    job_id: str,
    data: IndustryJobStatusUpdate
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    result = industry_jobs_col.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": data.status}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job posting not found")

    return {
        "message": f"Job posting status has been updated to '{data.status}'"
    }
    
    
    
@router.get("/industry/jobs/approved", response_model=List[IndustryJobResponse])
def get_approved_industry_jobs():
    """
    Get ALL approved industry jobs from ALL industries with their company profiles.
    Public endpoint - no authentication required.
    """
    jobs = []
    
    # Get all approved jobs
    cursor = industry_jobs_col.find({"status": "approved"})
    
    for doc in cursor:
        # Get the industry profile for each job
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
        
        jobs.append(IndustryJobResponse(
            job_id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            job_type=doc["job_type"],
            amount=doc.get("amount"),
            duration=doc.get("duration"),
            technology_stack=doc.get("technology_stack", []),
            expected_skills=doc.get("expected_skills", []),
            # Industry profile information
            company_name=industry_profile["company_name"],
            gmail=industry_gsuite_id,
            company_type=industry_profile["company_type"],
            industry_domain=industry_profile["industry_domain"],
            company_description=industry_profile["company_description"],
            founded_year=industry_profile["founded_year"],
            location=industry_profile["location"]
        ))
    
    return jobs


@router.get("/industry/jobs/pending", response_model=List[IndustryJobResponse])
def get_pending_industry_jobs():
    """
    Get ALL pending industry jobs from ALL industries with their company profiles.
    Public endpoint - no authentication required.
    """
    jobs = []
    
    # Get all pending jobs
    cursor = industry_jobs_col.find({"status": "pending"})
    
    for doc in cursor:
        # Get the industry profile for each job
        industry_profile = db["industry_profiles"].find_one({
            "industry_id": doc["industry_id"]
        })
        
        if not industry_profile:
            continue
        
        # Initialize industry_gsuite_id as None
        industry_gsuite_id = None
        
        # If the job has an industry_id, look up the industry's gsuite_id
        if doc.get("industry_id"):
            industry = db["users"].find_one({
                "_id": ObjectId(doc["industry_id"])
            })
            
            if industry and industry.get("gsuite_id"):
                industry_gsuite_id = industry["gsuite_id"]
        
        jobs.append(IndustryJobResponse(
            job_id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            job_type=doc["job_type"],
            amount=doc.get("amount"),
            duration=doc.get("duration"),
            technology_stack=doc.get("technology_stack", []),
            expected_skills=doc.get("expected_skills", []),
            # Industry profile information
            company_name=industry_profile["company_name"],
            gmail=industry_gsuite_id,
            company_type=industry_profile["company_type"],
            industry_domain=industry_profile["industry_domain"],
            company_description=industry_profile["company_description"],
            founded_year=industry_profile["founded_year"],
            location=industry_profile["location"]
        ))
    
    return jobs