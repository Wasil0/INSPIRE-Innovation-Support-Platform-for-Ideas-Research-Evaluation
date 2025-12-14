from pymongo import MongoClient
from dotenv import load_dotenv
import os
import gridfs

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("No MONGO_URI found in environment variables")

client = MongoClient(MONGO_URI)
db = client["project_portal"]

users_col = db["users"]
profiles_col = db["profiles"]

# GridFS for file storage
fs = gridfs.GridFS(db)