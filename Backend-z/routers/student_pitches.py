from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from db.db import db, fs
from dependencies.auth import get_current_user
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter(prefix="/student_pitches", tags=["Student Pitches"])
student_pitches_col = db["student_pitches"]
advisors_col = db["advisors"]
teams_col = db["teams"]

@router.post("/")
async def create_pitch(
    advisor_id: str = Form(...),
    title: str = Form(...),
    summary: str = Form(...),
    detailed_description: str = Form(...),
    is_industry: str = Form("false"),
    flowchart_image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id_str = str(current_user["_id"])
    industry_flag = is_industry.lower() == "true"
    
    # 1. Find user's team
    team = teams_col.find_one({"members": user_id_str})
    if not team:
        raise HTTPException(status_code=400, detail="You must be in a group to pitch an idea.")
    team_id_str = str(team["_id"])
    
    # Validate advisor ID
    try:
        advisor_obj_id = ObjectId(advisor_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid advisor ID format.")
    
    # Check if advisor exists (they are stored with advisor_id as ObjectId in advisors collection)
    advisor = advisors_col.find_one({"advisor_id": advisor_obj_id})
    if not advisor:
         raise HTTPException(status_code=404, detail="Advisor not found.")
         
    # 2. Check limits (1 pitch per advisor per group)
    existing_pitch = student_pitches_col.find_one({
        "team_id": team_id_str, 
        "advisor_id": advisor_id,
        "status": {"$in": ["pending", "accepted"]} # If rejected, they can submit again
    })
    
    if existing_pitch:
        status_msg = "pending" if existing_pitch["status"] == "pending" else "accepted"
        raise HTTPException(status_code=400, detail=f"Your group already has a {status_msg} pitch for this advisor.")
        
    # 3. Check advisor slots limits (4 normal, 1 industry)
    if industry_flag:
        industry_accepted = student_pitches_col.count_documents({
            "advisor_id": advisor_id,
            "is_industry": True,
            "status": "accepted"
        })
        if industry_accepted >= 1:
            raise HTTPException(status_code=400, detail="Advisor already has 1 industry pitch accepted.")
    else:
        normal_accepted = student_pitches_col.count_documents({
            "advisor_id": advisor_id,
            "is_industry": False,
            "status": "accepted"
        })
        if normal_accepted >= 4:
            raise HTTPException(status_code=400, detail="Advisor already has 4 normal pitches accepted.")
            
    # 3.5 Process File Upload
    if flowchart_image.content_type not in ["image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Only PNG or JPG images allowed for flowchart")
    
    image_bytes = await flowchart_image.read()
    image_id = fs.put(
        image_bytes,
        filename=flowchart_image.filename,
        contentType=flowchart_image.content_type
    )
            
    # 4. Save pitch
    pitch_doc = {
        "team_id": team_id_str,
        "submitted_by": user_id_str,
        "advisor_id": advisor_id,
        "title": title,
        "summary": summary,
        "detailed_description": detailed_description,
        "flowchart_id": str(image_id),
        "is_industry": industry_flag,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    result = student_pitches_col.insert_one(pitch_doc)
    return {"message": "Pitch submitted successfully", "pitch_id": str(result.inserted_id)}

@router.get("/advisor/pitches")
def get_advisor_pitches(current_user: dict = Depends(get_current_user)):
    user_id_str = str(current_user["_id"])
    
    # Check if advisor
    advisor = advisors_col.find_one({"advisor_id": current_user["_id"]})
    if not advisor:
        raise HTTPException(status_code=403, detail="Only advisors can view these pitches.")
    advisor_id_str = str(advisor["advisor_id"])
    
    profiles_col = db["profiles"]
    
    pitches = []
    cursor = student_pitches_col.find({"advisor_id": advisor_id_str}).sort("created_at", -1)
    for p in cursor:
        team_id = p.get("team_id")
        
        # Get team to find members
        team = teams_col.find_one({"_id": ObjectId(team_id)}) if team_id and len(team_id) == 24 else None
        
        members_data = []
        if team and "members" in team:
            # Fetch member names from profiles
            for m_id in team["members"]:
                try:
                    profile = profiles_col.find_one({"user_id": ObjectId(m_id)})
                    if profile:
                        members_data.append({
                            "user_id": m_id, 
                            "name": profile.get("name", "Unknown"),
                            "roll_number": profile.get("roll_number", "N/A")
                        })
                except Exception:
                    pass
                    
        pitches.append({
            "pitch_id": str(p["_id"]),
            "team_id": team_id,
            "title": p.get("title", ""),
            "summary": p.get("summary", ""),
            "detailed_description": p.get("detailed_description", p.get("description", "")), # Fallback for old records
            "flowchart_id": p.get("flowchart_id"),
            "status": p.get("status", "pending"),
            "is_industry": p.get("is_industry", False),
            "created_at": p.get("created_at"),
            "members": members_data
        })
        
    return pitches

from schemas.student_pitches import PitchStatusUpdate

@router.put("/{pitch_id}/status")
def update_pitch_status(pitch_id: str, update_data: PitchStatusUpdate, current_user: dict = Depends(get_current_user)):
    if update_data.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    # Verify advisor
    advisor = advisors_col.find_one({"advisor_id": current_user["_id"]})
    if not advisor:
         raise HTTPException(status_code=403, detail="Only advisors can update pitch status.")
         
    try:
        pitch = student_pitches_col.find_one({"_id": ObjectId(pitch_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid pitch ID")
        
    if not pitch:
        raise HTTPException(status_code=404, detail="Pitch not found")
        
    # Check if this pitch belongs to this advisor
    if pitch.get("advisor_id") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You can only review pitches sent to you.")
        
    # Update status
    student_pitches_col.update_one({"_id": ObjectId(pitch_id)}, {"$set": {"status": update_data.status}})
    
    # Auto-cancel logic & stage advancement
    if update_data.status == "accepted":
        team_id = pitch.get("team_id")
        
        if team_id:
            # 1. Update all other 'pending' pitches for this team to 'rejected'
            student_pitches_col.update_many(
                {
                    "team_id": team_id, 
                    "status": "pending", 
                    "_id": {"$ne": ObjectId(pitch_id)}
                },
                {"$set": {"status": "rejected"}}
            )
            
            # 2. Update profiles for stage2_completed
            team = teams_col.find_one({"_id": ObjectId(team_id)})
            if team and "members" in team:
                profiles_col = db["profiles"]
                member_obj_ids = []
                for m in team["members"]:
                    try:
                        member_obj_ids.append(ObjectId(m))
                    except:
                        pass
                
                if member_obj_ids:
                    profiles_col.update_many(
                        {"user_id": {"$in": member_obj_ids}},
                        {"$set": {"stages.stage2_completed": True}}
                    )
                    
                    
    return {"message": f"Pitch marked as {update_data.status}"}

@router.get("/image/{image_id}")
def get_pitch_flowchart_image(image_id: str):
    """
    Serve pitch flowchart image from GridFS.
    """
    try:
        grid_out = fs.get(ObjectId(image_id))
    except:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return StreamingResponse(
        grid_out,
        media_type=grid_out.content_type or "image/png",
        headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
    )
