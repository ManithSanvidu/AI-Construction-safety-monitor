import time
import requests
import datetime

# Replace this with your actual Render backend URL
RENDER_URL = "https://your-backend.onrender.com"

# 14 minutes in seconds (Render sleeps after 15 minutes of inactivity)
PING_INTERVAL = 14 * 60 

print(f"Starting Render keep-alive script for {RENDER_URL}")
print(f"Pinging every 14 minutes. Keep this terminal open!")
print("-" * 50)

while True:
    try:
        response = requests.get(RENDER_URL)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Pinged successfully. Status: {response.status_code}")
    except Exception as e:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Ping failed: {e}")
    
    time.sleep(PING_INTERVAL)
