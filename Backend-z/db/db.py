from pymongo import MongoClient
import os

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://ansarirubas75_db_user:forfydpuse45@cluster0.8bmfqll.mongodb.net/"
)

client = MongoClient(MONGO_URI)
db = client["project_portal"]