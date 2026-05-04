# schemas/invites.py
from pydantic import BaseModel

class InviteCreate(BaseModel):
    receiver_id: str

class InviteOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    group_id: str
    status: str

    class Config:
        orm_mode = True

class InviteAction(BaseModel):
    invite_id: str
    action: str  # "accepted" or "rejected"

class LockAction(BaseModel):  # NEW
    action: str  # "lock" or "unlock"