from pydantic import BaseModel
from typing import Optional, List

class StageStatus(BaseModel):
    stage1_completed: bool = False
    stage2_completed: bool = False
    stage3_completed: bool = False
    stage4_completed: bool = False

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
    # Nested stage field
    stages: Optional[StageStatus] = StageStatus()  # Default with all false

class ProfileResponse(BaseModel):
    user_id: str
    gsuite_id: Optional[str]
    name: Optional[str]
    section: Optional[str]
    roll_number: Optional[str]
    semester: Optional[str]
    batch_year: Optional[str]
    current_year: Optional[str]
    team_id: Optional[str]
    bio: Optional[str]
    github_link: Optional[str]
    resume_pdf_id: Optional[str]
    skills: Optional[List[str]] = []
    # Add these fields
    stage: Optional[StageStatus] = StageStatus()
    
    
class ProfileSummaryResponse(BaseModel):
    name: Optional[str]
    gsuite_id: Optional[str] = None
    batch_year: Optional[str]
    current_year: Optional[str]
    skills: List[str] = []
    semester: Optional[str]
    team_id: Optional[str] = None
