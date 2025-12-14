from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, profiles, advisors, fydp_ideas_by_advisor


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
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(advisors.router)
app.include_router(fydp_ideas_by_advisor.router)



