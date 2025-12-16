from fastapi import APIRouter, Depends, HTTPException
from db.db import db
from dependencies.auth import get_current_user  # your JWT dependency

router = APIRouter()

profiles_col = db["profiles"]

@router.get("/my-stages")
def get_my_stages(current_user: dict = Depends(get_current_user)):
    """
    Returns the stages status of the logged-in user.
    """
    user_id_str = str(current_user["_id"])

    # Fetch the profile of the current user
    profile = profiles_col.find_one({"user_id": current_user["_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    stages = profile.get("stages", {})

    return {
        "user_id": user_id_str,
        "stages": stages
    }
