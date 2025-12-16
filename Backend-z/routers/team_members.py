from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId
from db.db import db
from dependencies.auth import get_current_user



router = APIRouter()

profiles_col = db["profiles"]
teams_col = db["teams"]

# -------------------------------
# GET: My Team Members (Stage 1 Required)
# -------------------------------
@router.get("/my-team/members")
def get_my_team_members(current_user: dict = Depends(get_current_user)):
    """
    Returns names of all team members except the logged-in user,
    only if stage1_completed is true
    """
    # 0. Get user_id from the current_user document
    user_id_obj = current_user.get("_id")
    if not user_id_obj:
        raise HTTPException(status_code=400, detail="User ID missing in token")

    # 1. Get profile by user_id (in profiles collection)
    profile = profiles_col.find_one({"user_id": user_id_obj})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # 2. Check stage 1 completion
    if not profile.get("stages", {}).get("stage1_completed", False):
        raise HTTPException(status_code=403, detail="Stage 1 not completed")

    # 3. Get team_id from profile
    team_id = profile.get("team_id")
    if not team_id:
        raise HTTPException(status_code=404, detail="User is not in a team")

    # 4. Get team document by final_team_id
    team = teams_col.find_one({"final_team_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 5. Get member_ids
    member_ids = team.get("members", [])

    # 6. Convert member_ids (strings) to ObjectId
    member_object_ids = [ObjectId(uid) for uid in member_ids if uid != str(user_id_obj)]

    # 7. Fetch member profiles excluding logged-in user
    members_cursor = profiles_col.find(
        {"user_id": {"$in": member_object_ids}},
        {"_id": 0, "user_id": 1, "name": 1}
    )

    member_list = [{"user_id": str(m["user_id"]), "name": m["name"]} for m in members_cursor]

    return {
        "team_id": team_id,
        "total_members": len(member_list),
        "members": member_list
    }


@router.get("/group/lock-status")
def get_group_lock_status(current_user: dict = Depends(get_current_user)):
    """
    Returns the lock status of the current user's group:
    - how many members have locked
    - how many remaining
    - whether the group is fully locked
    """
    user_id_str = str(current_user["_id"])

    # 1. Find the team where the user is a member
    team = teams_col.find_one({"members": user_id_str})
    if not team:
        raise HTTPException(status_code=404, detail="You are not in any group")

    members = team.get("members", [])
    locked_by = team.get("locked_by", [])

    total_members = len(members)
    locked_count = len(locked_by)
    remaining = total_members - locked_count

    # 2. Check if current user has locked
    if user_id_str not in locked_by:
        raise HTTPException(status_code=403, detail="You have not locked your group yet")

    # 3. Optional: update is_locked if everyone has locked
    if remaining == 0 and not team.get("is_locked", False):
        teams_col.update_one({"_id": team["_id"]}, {"$set": {"is_locked": True}})
        is_fully_locked = True
    else:
        is_fully_locked = team.get("is_locked", False)

    # 4. Message formatting
    if remaining == 0:
        message = "All members have locked their group."
    elif remaining == 1:
        message = f"{locked_count} members have locked their group and 1 remaining."
    else:
        message = f"{locked_count} members have locked their group and {remaining} remaining."

    return {
        "message": message,
        "total_members": total_members,
        "locked": locked_count,
        "remaining": remaining,
        "is_fully_locked": is_fully_locked
    }
