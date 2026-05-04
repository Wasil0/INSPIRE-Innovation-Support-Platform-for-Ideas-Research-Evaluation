from pymongo import MongoClient
import gridfs

# MongoDB connection
client = MongoClient("mongodb+srv://ansarirubas75_db_user:forfydpuse45@cluster0.8bmfqll.mongodb.net/")
db = client["project_portal"]

# Collections
users_col = db["users"]
profiles_col = db["profiles"]

# GridFS for file storage
fs = gridfs.GridFS(db)
