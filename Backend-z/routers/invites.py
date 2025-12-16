from fastapi import APIRouter
from db.db import db
from fastapi import FastAPI, HTTPException
from schemas.invites import InviteCreate, InviteOut, InviteAction, LockAction
from bson import ObjectId
from fastapi import WebSocket, WebSocketDisconnect
from dependencies.auth import get_current_user
from fastapi import Depends
from datetime import datetime 

router = APIRouter()

app = FastAPI()
app.include_router(router)

profiles_col = db["profiles"]
invite_col = db['fydp_group_invites']
teams_col = db['teams'] 

# ---------------- WebSocket connections ----------------
active_connections = {}

async def send_ws_message(user_id: str, message: dict):
    ws = active_connections.get(user_id)
    if ws:
        await ws.send_json(message)

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)


# ---------------- Users ----------------
@router.get("/users")
def get_all_users(current_user: dict = Depends(get_current_user)):
    # Get current user's ID
    current_user_id = str(current_user["_id"])
    
    # Get all users EXCEPT current user
    users = []
    for doc in profiles_col.find({}, {"name": 1, "user_id": 1, "_id": 0}):
        user_id = str(doc["user_id"])
        
        # Skip current user
        if user_id == current_user_id:
            continue
        
        # Check if user is in any team
        team_info = teams_col.find_one({
            "$or": [
                {"leader": user_id},
                {"members": user_id}
            ]
        }, {"team_name": 1, "team_id": 1})
        
        if team_info:
            # User is in a team
            users.append({
                "user_id": user_id,
                "name": doc["name"],
                "status": "in_team",
            })
        else:
            # User is free (not in any team)
            users.append({
                "user_id": user_id,
                "name": doc["name"],
                "status": "free",
            })
    
    return users

# ---------------- Send Invite ----------------
@router.post("/invite/")
async def send_invite(invite: InviteCreate, current_user: dict = Depends(get_current_user)):
    sender_id = str(current_user["_id"])
    
    # 1. Self-invite check
    if sender_id == invite.receiver_id:
        raise HTTPException(400, "Cannot invite yourself")
    
    # 2. Check if sender is in locked team
    locked_team = teams_col.find_one({"members": sender_id, "is_locked": True})
    if locked_team:
        raise HTTPException(400, "You are in a locked team. Cannot send invites.")
    
    # 3. Check if receiver is in locked team
    receiver_locked_team = teams_col.find_one({"members": invite.receiver_id, "is_locked": True})
    if receiver_locked_team:
        raise HTTPException(400, "Receiver is already in a locked team")
    
    # ========== 4. Check duplicate invite FIRST ==========
    existing = invite_col.find_one({
        "sender_id": sender_id,
        "receiver_id": invite.receiver_id,
        "status": {"$ne": "rejected"}
    })
    if existing:
        raise HTTPException(400, "Invite already sent (pending or accepted)")
    
    # ========== 5. Check group capacity ==========
    # Count ACCEPTED group members (including yourself)
    accepted_invites = list(invite_col.find({
        "$or": [
            {"sender_id": sender_id, "status": "accepted"},
            {"receiver_id": sender_id, "status": "accepted"}
        ]
    }))
    
    group_members = set()
    for inv in accepted_invites:
        group_members.add(inv["sender_id"])
        group_members.add(inv["receiver_id"])
    
    current_members = len(group_members)  # Including yourself
    
    # Max 4 members per group
    if current_members >= 4:
        raise HTTPException(400, "Your group already has 4 members")
    
    # Available slots = 4 - current_members
    available_slots = 4 - current_members
    
    # ========== 6. Check pending invites ==========
    # Count PENDING invites (not total invites)
    pending_count = invite_col.count_documents({
        "sender_id": sender_id,
        "status": "pending"
    })
    
    # Can't have more pending invites than available slots
    if pending_count >= available_slots:
        if available_slots == 0:
            raise HTTPException(400, "Group is full (4 members)")
        elif available_slots == 1:
            raise HTTPException(400, f"Group has {current_members} members. Can invite 1 more person.")
        else:
            raise HTTPException(400, f"Group has {current_members} members. Already have {pending_count} pending invites.")    
    
    # ========== Create group_id ==========
    sender_accepted_invites = list(invite_col.find({
    "$or": [
        {"sender_id": sender_id, "status": "accepted"},
        {"receiver_id": sender_id, "status": "accepted"}
    ]
    }))

    if sender_accepted_invites:
        group_id = sender_accepted_invites[0]["group_id"]  # Use existing group
    else:
        group_id = str(ObjectId())  # Create new group if sender has no group
    
    # ========== Insert invite ==========
    result = invite_col.insert_one({
        "sender_id": sender_id,
        "receiver_id": invite.receiver_id,
        "group_id": group_id,
        "status": "pending",
        "created_at": datetime.utcnow()
    })
    
    # ========== WebSocket notification ==========
    await send_ws_message(invite.receiver_id, {
        "type": "invite_received",
        "invite_id": str(result.inserted_id),
        "sender_id": sender_id
    })
    
    return {"message": "Invitation sent", "invite_id": str(result.inserted_id)}



## ---------------- Respond to Invite ----------------
@router.put("/invite/action/")
async def respond_to_invite(
    invite_action: InviteAction,
    current_user: dict = Depends(get_current_user)
):
    if invite_action.action not in ["accepted", "rejected"]:
        raise HTTPException(400, "Invalid action")
    
    try:
        invite_id = ObjectId(invite_action.invite_id)
    except:
        raise HTTPException(400, "Invalid invite ID")
    
    invite = invite_col.find_one({"_id": invite_id})
    if not invite:
        raise HTTPException(404, "Invite not found")
    
    # ========== ADD THESE CHECKS ==========
    # Prevent changing accepted → rejected
    if invite["status"] == "accepted" and invite_action.action == "rejected":
        raise HTTPException(400, "Cannot reject an already accepted invite. Use /group/leave to leave the group.")
    
    # Prevent changing rejected → accepted
    if invite["status"] == "rejected" and invite_action.action == "accepted":
        raise HTTPException(400, "Cannot accept a rejected invite.")
    
    # Prevent re-accepting/re-rejecting same status
    if invite["status"] == invite_action.action:
        raise HTTPException(400, f"Invite is already {invite['status']}.")
    # ========== END CHECKS ==========
    
    user_id = str(current_user["_id"])
    
    # Only receiver can respond
    if invite["receiver_id"] != user_id:
        raise HTTPException(403, "Only receiver can respond to this invite")
    
    if invite_action.action == "accepted":
        # Check if user is already in a locked team
        locked_team = teams_col.find_one({"members": user_id, "is_locked": True})
        if locked_team:
            raise HTTPException(400, "You are already in a locked team")
        
        # Check if user is already in any accepted group
        user_accepted_invites = list(invite_col.find({
            "$or": [
                {"sender_id": user_id, "status": "accepted"},
                {"receiver_id": user_id, "status": "accepted"}
            ]
        }))
        
        # Determine which group to use
        target_group_id = invite["group_id"]  # Default: sender's group
        
        # If user is already in a group
        if user_accepted_invites:
            existing_group_id = user_accepted_invites[0]["group_id"]
            
            # Check if user's current group has space
            user_group_invites = list(invite_col.find({
                "group_id": existing_group_id,
                "status": "accepted"
            }))
            
            # Count unique members in user's current group
            user_group_members = set()
            for inv in user_group_invites:
                user_group_members.add(inv["sender_id"])
                user_group_members.add(inv["receiver_id"])
            
            if len(user_group_members) < 4:
                # User's group has space, use their group
                target_group_id = existing_group_id
            else:
                raise HTTPException(400, "Your current group is full (4 members)")
        
        # Now check target group's capacity
        target_group_invites = list(invite_col.find({
            "group_id": target_group_id,
            "status": "accepted"
        }))
        
        # Count unique members in target group
        target_group_members = set()
        for inv in target_group_invites:
            target_group_members.add(inv["sender_id"])
            target_group_members.add(inv["receiver_id"])
        
        # Check if adding this user would exceed capacity
        # Note: user might already be counted if they're in the group
        future_members = target_group_members.copy()
        future_members.add(user_id)
        
        if len(future_members) > 4:
            raise HTTPException(400, "Group would exceed 4 members")
        
        # Update the invite with correct group_id
        update_data = {
            "status": "accepted",
            "group_id": target_group_id
        }
        
        # Update in database
        invite_col.update_one(
            {"_id": invite_id},
            {"$set": update_data}
        )
        
        # If user was joining sender's group (not their own), update other user_accepted_invites
        if user_accepted_invites and target_group_id != user_accepted_invites[0]["group_id"]:
            # User is moving from one group to another
            # Update all their accepted invites to new group
            old_group_id = user_accepted_invites[0]["group_id"]
            
            for user_inv in user_accepted_invites:
                invite_col.update_one(
                    {"_id": user_inv["_id"]},
                    {"$set": {"group_id": target_group_id}}
                )
            
            # Clean up any "orphaned" invites in old group
            # Delete any invites that now connect only to the moved user
            old_group_invites = list(invite_col.find({
                "group_id": old_group_id,
                "status": "accepted"
            }))
            
            # If old group has no invites left, it's empty (handled by leave logic)
    
    else:  # "rejected" action
        # Just update status
        invite_col.update_one(
            {"_id": invite_id},
            {"$set": {"status": "rejected"}}
        )
    
    # Send WebSocket notification to sender
    await send_ws_message(invite["sender_id"], {
        "type": "invite_responded",
        "invite_id": str(invite_id),
        "status": invite_action.action,
        "receiver_id": user_id
    })
    
    return {"message": f"Invite {invite_action.action}"}

# ---------------- Leave Temporary Group ----------------
@router.post("/group/leave")
async def leave_temporary_group(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Check if user is in a locked team
    locked_team = teams_col.find_one({"members": user_id, "is_locked": True})
    if locked_team:
        raise HTTPException(400, "Cannot leave a locked team")
    
    # Find all invites where user is involved
    user_invites = list(invite_col.find({
        "$or": [
            {"sender_id": user_id, "status": "accepted"},
            {"receiver_id": user_id, "status": "accepted"}
        ]
    }))
    
    if not user_invites:
        raise HTTPException(400, "You are not in any temporary group")
    
    # Get the group_id before deleting
    if user_invites:
        original_group_id = user_invites[0]["group_id"]
        
        # Find ALL members in the original group
        all_group_invites = list(invite_col.find({
            "group_id": original_group_id,
            "status": "accepted"
        }))
        
        original_members = set()
        for inv in all_group_invites:
            original_members.add(inv["sender_id"])
            original_members.add(inv["receiver_id"])
        
        # SAFELY remove the leaving user
        original_members.discard(user_id)  # Use discard instead of remove
        
        # If at least 2 members remain, create new group for them
        if len(original_members) >= 2:
            new_group_id = str(ObjectId())
            remaining_members = list(original_members)
            
            # Delete ALL old invites between remaining members (from original group)
            for i in range(len(remaining_members)):
                for j in range(i + 1, len(remaining_members)):
                    invite_col.delete_many({
                        "$or": [
                            {"sender_id": remaining_members[i], "receiver_id": remaining_members[j], "status": "accepted"},
                            {"sender_id": remaining_members[j], "receiver_id": remaining_members[i], "status": "accepted"}
                        ]
                    })
            
            # Create MINIMAL connections (just enough to form a group)
            # For 2 members: 1 connection
            # For 3 members: 2 connections (triangle)
            # For 4 members: 3 connections (star pattern)
            
            if len(remaining_members) == 2:
                # A-B
                invite_col.insert_one({
                    "sender_id": remaining_members[0],
                    "receiver_id": remaining_members[1],
                    "group_id": new_group_id,
                    "status": "accepted",
                    "created_at": datetime.utcnow()
                })
            elif len(remaining_members) == 3:
                # A-B, A-C (triangle with 2 edges)
                invite_col.insert_one({
                    "sender_id": remaining_members[0],
                    "receiver_id": remaining_members[1],
                    "group_id": new_group_id,
                    "status": "accepted",
                    "created_at": datetime.utcnow()
                })
                invite_col.insert_one({
                    "sender_id": remaining_members[0],
                    "receiver_id": remaining_members[2],
                    "group_id": new_group_id,
                    "status": "accepted",
                    "created_at": datetime.utcnow()
                })
            elif len(remaining_members) == 4:
                # A-B, A-C, A-D (star pattern)
                invite_col.insert_one({
                    "sender_id": remaining_members[0],
                    "receiver_id": remaining_members[1],
                    "group_id": new_group_id,
                    "status": "accepted",
                    "created_at": datetime.utcnow()
                })
                invite_col.insert_one({
                    "sender_id": remaining_members[0],
                    "receiver_id": remaining_members[2],
                    "group_id": new_group_id,
                    "status": "accepted",
                    "created_at": datetime.utcnow()
                })
                invite_col.insert_one({
                    "sender_id": remaining_members[0],
                    "receiver_id": remaining_members[3],
                    "group_id": new_group_id,
                    "status": "accepted",
                    "created_at": datetime.utcnow()
                })
    
    # Now delete all accepted invites involving the leaving user
    deleted_count = 0
    group_members_notified = set()

    for invite in user_invites:
        # Notify other members
        other_user = invite["receiver_id"] if invite["sender_id"] == user_id else invite["sender_id"]
        group_members_notified.add(other_user)
        
        # Delete the invite
        invite_col.delete_one({"_id": invite["_id"]})
        deleted_count += 1

    # Send notifications AFTER deleting all invites
    for member_id in group_members_notified:
        await send_ws_message(member_id, {
            "type": "member_left",
            "user_id": user_id
        })

    return {"message": "Left temporary group", "invites_removed": deleted_count}


# ---------------- Lock Group ----------------
@router.post("/group/lock")
async def lock_group(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Find user's current temporary group
    user_invites = list(invite_col.find({
        "$or": [
            {"sender_id": user_id, "status": "accepted"},
            {"receiver_id": user_id, "status": "accepted"}
        ]
    }))
    
    if not user_invites:
        raise HTTPException(400, "You are not in any temporary group")
    
    group_id = user_invites[0]["group_id"]
    
    # Get all accepted invites in this group
    group_invites = list(invite_col.find({
        "group_id": group_id,
        "status": "accepted"
    }))
    
    # Get unique members
    group_members = set()
    for invite in group_invites:
        group_members.add(invite["sender_id"])
        group_members.add(invite["receiver_id"])
    
    # Check if group has 3 or 4 members
    if len(group_members) < 3:
        raise HTTPException(400, "Group must have at least 3 members to lock")
    
    # Check if group already has a lock request from this user
    existing_lock = teams_col.find_one({"team_id": group_id, "locked_by": user_id})
    if existing_lock:
        raise HTTPException(400, "You have already requested to lock this group")
    
    # Add lock request
    teams_col.update_one(
        {"team_id": group_id},
        {
            "$addToSet": {"locked_by": user_id},
            "$setOnInsert": {
                "team_id": group_id,
                "members": list(group_members),
                "is_locked": False,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    # Check if all members have locked
    lock_data = teams_col.find_one({"team_id": group_id})
    if lock_data and len(lock_data.get("locked_by", [])) == len(group_members):
        # Generate final team ID
        final_team_id = f"team_{ObjectId()}"
        
        # All members have locked - finalize the team
        teams_col.update_one(
            {"team_id": group_id},
            {
                "$set": {
                    "is_locked": True,
                    "locked_at": datetime.utcnow(),
                    "final_team_id": final_team_id
                }
            }
        )
        
        # 🔥 ADD THESE 3 LINES - Update team_id in all members' profiles 🔥
        for member_id in group_members:
            # Update team_id in profile
            profiles_col.update_one(
                {"user_id": ObjectId(member_id)},
                {
                    "$set": {
                        "team_id": final_team_id,
                        "stages.stage1_completed": True,
                    }
               }
)
            
        # Notify all members
        for member in group_members:
            await send_ws_message(member, {
                "type": "group_locked",
                "team_id": group_id,
                "final_team_id": f"team_{ObjectId()}"
            })
        
        return {"message": "Group locked successfully!", "team_locked": True}
    
    return {"message": "Lock request recorded", "team_locked": False}


# ---------------- Get Group Members ----------------
@router.get("/group/members")
async def get_group_members(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Find user's group
    user_invites = list(invite_col.find({
        "$or": [
            {"sender_id": user_id, "status": "accepted"},
            {"receiver_id": user_id, "status": "accepted"}
        ]
    }))
    
    if not user_invites:
        return {"message": "You are not in any group", "members": []}
    
    group_id = user_invites[0]["group_id"]
    
    # Get all accepted invites in this group
    group_invites = list(invite_col.find({
        "group_id": group_id,
        "status": "accepted"
    }))
    
    # Get unique members with names
    members = []
    member_ids = set()
    
    for invite in group_invites:
        for uid in [invite["sender_id"], invite["receiver_id"]]:
            if uid not in member_ids:
                member_ids.add(uid)
                # Get user profile
                profile = profiles_col.find_one({"user_id": ObjectId(uid)})
                members.append({
                    "user_id": uid,
                    "name": profile.get("name", "Unknown") if profile else "Unknown"
                })
    
    # Check if group is locked
    team_data = teams_col.find_one({"team_id": group_id})
    is_locked = team_data.get("is_locked", False) if team_data else False
    
    return {
        "group_id": group_id,
        "is_locked": is_locked,
        "members": members,
        "total_members": len(members)
    }

# ---------------- Get Sent Invites ----------------
@router.get("/sent-invites/me") 
def get_sent_invites(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    invites = list(invite_col.find({"sender_id": user_id}))
    
    if not invites:
        return {"message": "You have not sent any invites."}
    
    result = []
    for invite in invites:
        try:
            receiver_obj_id = ObjectId(invite["receiver_id"])
        except:
            receiver_obj_id = None
        
        receiver_profile = profiles_col.find_one(
            {"user_id": receiver_obj_id} if receiver_obj_id else {},
            {"name": 1, "_id": 0}
        )
        receiver_name = receiver_profile["name"] if receiver_profile else "Unknown"
        
        result.append({
            "invite_id": str(invite["_id"]),
            "receiver": receiver_name,
            "status": invite["status"],
            "group_id": invite.get("group_id")
        })
    
    return result

# ---------------- Get Pending Invites ----------------
@router.get("/invites/me")
def get_pending_invites(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    invites = list(invite_col.find({"receiver_id": user_id, "status": "pending"}))
    
    if not invites:
        return {"message": "You have no pending invites."}
    
    result = []
    for invite in invites:
        try:
            sender_obj_id = ObjectId(invite["sender_id"])
        except:
            sender_obj_id = None
        
        sender_profile = profiles_col.find_one(
            {"user_id": sender_obj_id} if sender_obj_id else {},
            {"name": 1, "_id": 0}
        )
        sender_name = sender_profile["name"] if sender_profile else "Unknown"
        
        result.append({
            "invite_id": str(invite["_id"]),
            "sender": sender_name,
            "status": invite["status"],
            "group_id": invite.get("group_id")
        })
    
    return result

# ---------------- Delete Invite ----------------
@router.delete("/invite/{invite_id}")
def delete_invite(invite_id: str, current_user: dict = Depends(get_current_user)):
    try:
        invite_obj_id = ObjectId(invite_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid invite ID")
    
    invite = invite_col.find_one({"_id": invite_obj_id})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    # Only sender can delete their own invite
    if invite["sender_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Can only delete your own invites")
    
    result = invite_col.delete_one({"_id": invite_obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    return {"message": "Invite deleted successfully."}