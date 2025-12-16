from pydantic import BaseModel, EmailStr
from typing import List, Optional
from typing import Literal

# ---------------- Pydantic Model ----------------
class IndustryJobPosting(BaseModel):
    title: str
    description: str
    industry_name: str
    contact_email: EmailStr
    job_type: Literal["full-time", "part-time", "internship", "training"]
    location: Optional[str] = None
    amount: Optional[str] = None
    duration: Optional[str] = None
    technology_stack: Optional[List[str]] = None
    expected_skills: Optional[List[str]] = None


class IndustryJobStatusUpdate(BaseModel):
   status: Literal["approved", "rejected"]