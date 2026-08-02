from pymongo import MongoClient
from app.config import MONGO_URI

# Ensure the client is created with appropriate settings
# We disable serverSelectionTimeoutMS so it fails fast if unable to connect
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client.get_database("construction_safety")

def get_db():
    yield db