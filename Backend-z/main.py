from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.indexes import create_indexes
from routers import auth
from routers import advisors, fydp_ideas_by_advisor
from routers import profiles
from routers import projects
from routers import industry_idea
from routers import industry_job
from routers import industry_profile
from routers import invites
from routers import advisor_ideas_scoring
from routers import industry_ideas_scoring
from routers import student_job_applications
from routers import chat
from routers import stages_status
from routers import team_members
from routers import student_pitches
from routers import project_proposals
from routers import committee

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # ⚠️ Add your production frontend URL here before deploying:
    # "https://your-app.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["health"])
def health_check():
    """Lightweight endpoint used by Render/cron-job.org to keep the server awake."""
    return {"status": "ok"}

@app.on_event("startup")
def startup():
    create_indexes()

app.include_router(auth.router)
app.include_router(advisors.router)
app.include_router(fydp_ideas_by_advisor.router)
app.include_router(profiles.router)
app.include_router(projects.router)
app.include_router(industry_idea.router)
app.include_router(industry_job.router)
app.include_router(industry_profile.router)
app.include_router(invites.router)
app.include_router(advisor_ideas_scoring.router)
app.include_router(industry_ideas_scoring.router)
app.include_router(student_job_applications.router)
app.include_router(chat.router)
app.include_router(stages_status.router)
app.include_router(team_members.router)
app.include_router(student_pitches.router)
app.include_router(project_proposals.router)
app.include_router(committee.router)