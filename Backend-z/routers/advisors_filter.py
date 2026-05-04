from fastapi import APIRouter, Query
from db.db import db
from bson import ObjectId

router = APIRouter()
advisor_ideas_col = db["Advisor_ideas"]
advisors_col = db["advisors"]

@router.get("/advisor-ideas")
def get_advisor_ideas(
    q: str | None = Query(None),
    advisor: str | None = Query(None),      # advisor_id
    sort: str | None = Query("az"),
    page: int = Query(1, ge=1)
):
    LIMIT = 20
    skip = (page - 1) * LIMIT

    match_stage = {"source_type": "advisor"}

    # -------- SEARCH --------
    if q:
        match_stage["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]

    # -------- FILTER BY ADVISOR --------
    if advisor:
        match_stage["advisor_id"] = ObjectId(advisor)

    # -------- SORT --------
    sort_order = 1 if sort == "az" else -1

    pipeline = [
        {"$match": match_stage},

        # Join with Advisors collection
        {
            "$lookup": {
                "from": "Advisors",
                "localField": "advisor_id",
                "foreignField": "advisor_id",
                "as": "advisor"
            }
        },
        {"$unwind": {"path": "$advisor", "preserveNullAndEmptyArrays": True}},

        # Sorting
        {"$sort": {"title": sort_order}},

        # Pagination
        {"$skip": skip},
        {"$limit": LIMIT},

        # Shape response
        {
            "$project": {
                "project_id": {"$toString": "$_id"},   # ✅ ADDED
                "title": 1,
                "description": 1,
                "flowchart_image": {
                    "$cond": [
                        {"$ifNull": ["$flowchart_image", False]},
                        {"$toString": "$flowchart_image"},
                        None
                    ]
                },
                "domain": 1,
                "flow_explanation": 1,
                "skills_required": 1,

                "advisor_id": {"$toString": "$advisor_id"},
                "advisor_name": "$advisor.name",
                "department": "$advisor.department"
            }
        }

            ]

    ideas = list(advisor_ideas_col.aggregate(pipeline))
    total = advisor_ideas_col.count_documents(match_stage)

    return {
        "page": page,
        "per_page": LIMIT,
        "total": total,
        "pages": (total + LIMIT - 1) // LIMIT,
        "ideas": ideas
    }
