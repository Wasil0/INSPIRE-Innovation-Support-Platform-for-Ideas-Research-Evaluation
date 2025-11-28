from pydantic import BaseModel

class User(BaseModel):
    gsuite_id: str
    password: str
    role: str

class SignInResponse(BaseModel):
    gsuite_id: str
    password: str

class UserInDB(User):
    hashed_password: str
