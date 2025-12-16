from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.indexes import create_indexes
from routers import auth
from routers import advisors, fydp_ideas_by_advisor
from routers import profiles
from routers import projects
from routers import industry_idea
from routers import industry_job
from routers import invites
from routers import advisor_ideas_scoring

app = FastAPI()
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(industry_idea.router)
app.include_router(invites.router)
app.include_router(advisor_ideas_scoring.router)

