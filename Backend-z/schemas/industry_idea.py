from pydantic import BaseModel, EmailStr
from typing import List, Optional
from typing import Literal

class IndustryIdea(BaseModel):
    title: str
    description: str
    industry_name: str
    contact_email: EmailStr
    technology_stack: Optional[List[str]] = []
    expected_skills: Optional[List[str]] = []


class IndustryIdeaStatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]
        
        