from fastapi import APIRouter, Query
from db.db import db

router = APIRouter(prefix="/projects", tags=["Projects"])
projects_col = db["Past_Projects"]

#General Projects Page (No Search)
#GET /projects?page=1&limit=12

#Search by title/description
#/projects?q=handwritten

#Search + filter batch
#/projects?q=vision&batch=2020

# Filter by advisor
# /projects?advisor=Majida

# Combined
# /projects?q=urdu&batch=2020&advisor=Fauzia&page=1&limit=6

def serialize_project(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/")
def get_projects(
    q: str | None = Query(None),
    batch: str | None = Query(None),
    advisor: str | None = Query(None),
    page: int = 1,
    limit: int = 10
):
    query = {}

    if q:
        query["$text"] = {"$search": q}

    if batch:
        query["batch"] = batch

    if advisor:
        query["advisor"] = {"$regex": advisor, "$options": "i"}

    skip = (page - 1) * limit

    cursor = projects_col.find(
        query,
        {"score": {"$meta": "textScore"}} if q else {}
    )

    if q:
        cursor = cursor.sort([("score", {"$meta": "textScore"})])

    cursor = cursor.skip(skip).limit(limit)

    total = projects_col.count_documents(query)

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": (total + limit - 1) // limit,
        "data": [serialize_project(doc) for doc in cursor]
    }

    
    
##Filters Data for Frontend Dropdowns
@router.get("/meta")
def get_meta():
    batches = projects_col.distinct("batch")
    advisors = projects_col.distinct("advisor")

    return {
        "batches": sorted(batches),
        "advisors": sorted(advisors)
    }




