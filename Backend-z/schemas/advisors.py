from pydantic import BaseModel

class AdvisorCreate(BaseModel):
    advisor_id: str
    name: str
    department: str
    committee_member: bool = False
