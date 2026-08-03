import os
import json
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import db

router=APIRouter(prefix="/api/chat",tags=["chat"])

class ChatRequest(BaseModel):
    message:str

def get_project_context():
    try:
        stocks=list(db.stocks.find())
        low_stocks=[s['item_name'] for s in stocks if s.get('status') in ['Low stock','Out of Stock'] or s.get('critical_out of stock')]
    except:
        stocks=[]
        low_stocks=[]

    #Get Workers status
    try:
        workers=list(db.workers.find())
        active_workers=len([w for w in workers if w.get('status')=='Active'])
    except:
        active_workers="Data unavailable"

    #Get incidents data
    try:
        incidents = list(db.incidents.find().sort("timestamp", -1).limit(5))
        recent_incidents = [f"{i.get('type', 'Unknown')} at {i.get('timestamp', 'Unknown')}" for i in incidents]
    except:
        recent_incidents = ["Data unavailable"]

    #Get compliance reports data
    try:
        compliance_reports = list(db.compliance_reports.find().sort("timestamp", -1).limit(5))
        recent_compliance = [f"Report on {c.get('timestamp', 'Unknown')}: {c.get('status', 'Unknown')}" for c in compliance_reports]
    except:
        recent_compliance = ["Data unavailable"]

    context=(
        "You are the SiteWatch AI assistant for a construction safety monitoring dashboard."
        "Answer the user's questions strictly based on the following real-time system data:\n\n"

        f"- Low/Out of Stock Items: {','.join(low_stocks) if low_stocks else 'None'}\n"
        f"- Total Stocks Monitored: {len(stocks)}\n"
        f"- Active Workers on Site: {active_workers}\n"
        f"- Recent Incidents: {', '.join(recent_incidents) if recent_incidents else 'None'}\n"
        f"- Recent Compliance Reports: {', '.join(recent_compliance) if recent_compliance else 'None'}\n\n"
        "Keep your answers concise, professional and helpful. If asked something outside of construction, safety or inventory, politely decline."
    )
    return context

@router.post("/")
async def chat_with_ai(request:ChatRequest):
    try:
        api_key = os.getenv("GEMINI_API_KEY", "").strip('"').strip("'").strip()
        if not api_key:
            return {"response": "The AI assistant is currently unavailable because the API key is not configured on the server."}
        
        context=get_project_context()
        prompt = f"{context}\n\nUser Question: {request.message}\nAssistant Answer:"

        # Use REST API directly to avoid any GCP default credential interference on Render
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        import asyncio
        response = await asyncio.to_thread(requests.post, url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"API Error {response.status_code}: {response.text}")
            
        result = response.json()
        try:
            answer = result["candidates"][0]["content"]["parts"][0]["text"]
            return {"response": answer.strip()}
        except (KeyError, IndexError) as e:
            raise Exception(f"Unexpected API response format: {json.dumps(result)}")

    except Exception as e:
        print(f"Chatbot Error:{e}")
        # Return the actual error message so the frontend can display it
        raise HTTPException(status_code=500,detail=f"Chatbot Error: {str(e)}")
    