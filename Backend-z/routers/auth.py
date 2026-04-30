from fastapi import APIRouter, HTTPException
from schemas.user import SignInResponse, User
from hashing import hash_password, verify_password
from db.db import db
from JWT.JWTtoken import (
    create_access_token,
    create_refresh_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
)
from datetime import timedelta
from schemas.token import Token
from jose import jwt, JWTError
from pydantic import BaseModel

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
    
    token_data = {
        "sub": str(existing_user["_id"]),
        "role": existing_user["role"]
    }

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data=token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": existing_user["role"]
    }


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh/")
async def refresh_access_token(body: RefreshRequest):
    """
    Accepts a valid refresh token and returns a brand-new access token.
    The frontend calls this automatically when it receives a 401 response.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired refresh token. Please log in again.",
    )
    try:
        payload = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])

        # Verify this is actually a refresh token, not an access token
        if payload.get("type") != "refresh":
            raise credentials_exception

        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Confirm user still exists in DB
    from bson import ObjectId
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception

    # Issue a fresh access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": user_id, "role": role},
        expires_delta=access_token_expires,
    )

    return {"access_token": new_access_token, "token_type": "bearer"}
