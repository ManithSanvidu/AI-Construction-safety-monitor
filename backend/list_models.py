from dotenv import load_dotenv
load_dotenv()
import os
from google import genai

api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    api_key = api_key.strip('"').strip("'")
client = genai.Client(api_key=api_key)
for m in client.models.list():
    print(m.name)
