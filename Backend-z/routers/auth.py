from fastapi import APIRouter, HTTPException
from schemas.user import SignInResponse, User
from hashing import hash_password, verify_password
from db.db import db
from JWT.JWTtoken import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from schemas.token import Token

router = APIRouter(prefix="/auth", tags=["auth"])  
users_col = db["users"]


@router.post("/signup/")
async def signup(user: User):
    # Check if user already exists
    existing_user = users_col.find_one({"gsuite_id": user.gsuite_id})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")
    
    # Hash the user's password
    hashed_password = hash_password(user.password)
    
    # Insert user data into MongoDB
    user_data = {
        "gsuite_id": user.gsuite_id,
        "hashed_password": hashed_password,
        "role": user.role,
        "created_at": "2021-05-01T12:00:00Z",
        "updated_at": "2021-05-01T12:00:00Z"
    }
    result = users_col.insert_one(user_data)
    
    return {"id": str(result.inserted_id)}


# Sign-in endpoint (verify credentials)
@router.post("/signin/")
async def signin(user: SignInResponse):
    # Find the user in the database
    existing_user = users_col.find_one({"gsuite_id": user.gsuite_id})
    
    if not existing_user:
        raise HTTPException(status_code=400, detail="Invalid gsuite_id or password")
    
    # Verify the user's password
    if not verify_password(user.password, existing_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Return role and user info (you could also generate a JWT token here for authentication)
    # return {"email": existing_user["email"], "role": existing_user["role"]}
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
    data={"sub": user.gsuite_id, "role": existing_user["role"]},
    expires_delta=access_token_expires)
    return {
    "access_token": access_token,
    "token_type": "bearer",
    "role": existing_user["role"]
    }


