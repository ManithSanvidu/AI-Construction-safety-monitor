from pymongo import MongoClient
from app.config import MONGO_URI
import dns.resolver

# Workaround for DNS timeouts on some hotspots
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8']
# Ensure the client is created with appropriate settings
# We disable serverSelectionTimeoutMS so it fails fast if unable to connect
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=500)
db = client.get_database("construction_safety")

def get_db():
    yield db