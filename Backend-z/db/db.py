from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("No MONGO_URI found in environment variables")

client = MongoClient(MONGO_URI)
db = client["project_portal"]