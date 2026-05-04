from pydantic import BaseModel, EmailStr
from typing import List, Optional
from typing import Literal

# ---------------- Pydantic Model ----------------
class IndustryJobPosting(BaseModel):
    title: str
    description: str
    job_type: Literal["full-time", "part-time", "internship", "training"]
    amount: Optional[str] = None
    duration: Optional[str] = None
    technology_stack: Optional[List[str]] = None
    expected_skills: Optional[List[str]] = None


class IndustryJobStatusUpdate(BaseModel):
   status: Literal["approved", "rejected"]
   
   
class IndustryJobResponse(BaseModel):
    job_id: str
    title: str
    description: str
    job_type: str
    amount: Optional[str] = None
    duration: Optional[str] = None
    technology_stack: List[str]
    expected_skills: List[str]
    # Industry profile fields
    company_name: str
    gmail: Optional[str] = None 
    company_type: str
    industry_domain: str
    company_description: str
    founded_year: int
    location: str