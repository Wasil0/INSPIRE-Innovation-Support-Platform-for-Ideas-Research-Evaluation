from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from database import db
from schemas.industry_profile import IndustryProfileCreate, IndustryProfileResponse, IndustryProfileResponseNoID
from dependencies.auth import get_current_user   # your JWT dependency

router = APIRouter(prefix="/industry", tags=["Industry"])
industry_profiles_col = db["industry_profiles"]

# -------------------- Endpoints --------------------
@router.post("/profile", response_model=IndustryProfileResponse)
def create_industry_profile(
    profile: IndustryProfileCreate,
    current_user: dict = Depends(get_current_user)   # JWT provides logged-in user
):
    # 🔐 Get industry_id from logged-in user
    user_industry_id = current_user["_id"]

    # Build document
    profile_doc = profile.dict()
    profile_doc["industry_id"] = ObjectId(user_industry_id)

    result = industry_profiles_col.insert_one(profile_doc)

    return {**profile_doc, "industry_id": str(user_industry_id)}


@router.get("/profile/me", response_model=IndustryProfileResponseNoID)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_industry_id = current_user["_id"]
    profile = industry_profiles_col.find_one({"industry_id": ObjectId(user_industry_id)})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile["_id"] = str(profile["_id"])
    # remove industry_id before returning
    profile.pop("industry_id", None)
    return profile



