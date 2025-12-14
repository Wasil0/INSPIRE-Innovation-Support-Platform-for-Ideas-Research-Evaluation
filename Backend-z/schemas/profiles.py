from pydantic import BaseModel
from typing import Optional, List

class ProfileCreate(BaseModel):
    user_id: str
    name: Optional[str]
    section: Optional[str]
    roll_number: Optional[str]
    semester: Optional[str]
    batch_year: Optional[str]
    current_year: Optional[str]
    team_id: Optional[str] = None
    bio: Optional[str]
    github_link: Optional[str]
    resume_pdf_id: Optional[str]
    skills: Optional[List[str]] = []

class ProfileResponse(BaseModel):
    user_id: str
    name: Optional[str]
    gsuite_id: Optional[str] = None
    section: Optional[str]
    roll_number: Optional[str]
    semester: Optional[str]
    batch_year: Optional[str]
    current_year: Optional[str]
    team_id: Optional[str] = None
    bio: Optional[str]
    github_link: Optional[str]
    resume_pdf_id: Optional[str]
    skills: Optional[List[str]] = []

class ProfileSummaryResponse(BaseModel):
    name: Optional[str]
    gsuite_id: Optional[str] = None
    batch_year: Optional[str]
    current_year: Optional[str]
    skills: List[str] = []
    semester: Optional[str]
    team_id: Optional[str] = None
