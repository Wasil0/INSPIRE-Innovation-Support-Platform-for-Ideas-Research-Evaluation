from pydantic import BaseModel
from typing import Optional

class IndustryProfileCreate(BaseModel):
    company_name: str
    company_type: str            # Startup, SME, Enterprise, MNC
    industry_domain: str         # IT, Healthcare, FinTech, etc.
    company_description: str
    founded_year: int
    location: str

class IndustryProfileResponse(IndustryProfileCreate):
    industry_id: str             # MongoDB document _id

class IndustryProfileResponseNoID(IndustryProfileCreate):
    pass
