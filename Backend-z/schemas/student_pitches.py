from pydantic import BaseModel

class StudentPitchCreate(BaseModel):
    advisor_id: str
    title: str
    description: str
    is_industry: bool = False

class PitchStatusUpdate(BaseModel):
    status: str
