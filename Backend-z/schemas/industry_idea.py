from pydantic import BaseModel
from typing import List, Optional
from typing import Literal

class IndustryIdea(BaseModel):
    title: str
    description: str
    technology_stack: Optional[List[str]] = []
    expected_skills: Optional[List[str]] = []

class ApprovedIdeaResponse(BaseModel):
    idea_id: str
    title: str
    description: str
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
    

class IndustryIdeaStatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]
        
        