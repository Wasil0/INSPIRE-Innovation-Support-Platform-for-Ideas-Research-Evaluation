from fastapi import FastAPI
from routers import invites, profiles, advisors, fydp_ideas_by_advisor, auth, industry_idea, industry_job, team_members, stages_status
from routers import industry_profile

app = FastAPI()

# Include Routers
app.include_router(profiles.router)
app.include_router(advisors.router)
app.include_router(fydp_ideas_by_advisor.router)
app.include_router(invites.router)
app.include_router(auth.router)  
app.include_router(industry_idea.router)
app.include_router(industry_job.router)
app.include_router(team_members.router)
app.include_router(stages_status.router)
app.include_router(industry_profile.router)