from pydantic import BaseModel
from typing import Optional, List

class FypIdeaByAdvisor(BaseModel):
    title: str
    description: str
    flowchart_image: Optional[str] = None   # ObjectId as string or URL
    domain: List[str]
    flow_explanation: str
    advisor_id: Optional[str]         # Required if source_type is "advisor"
    source_type: str                  # "advisor" or "industry"
    industry_name: Optional[str] = None     # Required if source_type is "industry"
    skills_required: List[str]
