from fastapi import APIRouter, HTTPException
from db.db import db
from schemas.industry_job import IndustryJobPosting, IndustryJobStatusUpdate
from bson import ObjectId

router = APIRouter()
industry_jobs_col = db["Industry_Jobs"]

# ---------------- POST API ----------------
@router.post("/industry/jobs")
def create_industry_job(job: IndustryJobPosting):
    job_doc = job.dict()
    
    # Ensure lists are not None
    job_doc["technology_stack"] = job_doc.get("technology_stack") or []
    job_doc["expected_skills"] = job_doc.get("expected_skills") or []

    # Check for duplicate job
    duplicate_check = industry_jobs_col.find_one({
        "title": job_doc["title"],
        "description": job_doc["description"],
        "industry_name": job_doc["industry_name"],
        "job_type": job_doc["job_type"],
        "location": job_doc.get("location")
    })

    if duplicate_check:
        raise HTTPException(
            status_code=400,
            detail="A job posting with the exact same details already exists."
        )

    # Add backend-only fields
    job_doc["status"] = "pending"

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
    
    
    
# ---------------- GET approved jobs ----------------
@router.get("/industry/jobs/approved")
def get_approved_jobs():
    jobs_cursor = industry_jobs_col.find({"status": "approved"})
    
    jobs = []
    for job in jobs_cursor:
        job["_id"] = str(job["_id"])  # convert ObjectId to string
        jobs.append(job)
    
    return {
        "jobs": jobs
    }