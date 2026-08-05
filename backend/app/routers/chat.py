import os
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
        
        # Build detailed stocks list
        stock_details_list = []
        for s in stocks:
            name = s.get('item_name', 'Unknown')
            qty = s.get('quantity', 'N/A')
            status = s.get('status', 'Unknown')
            stock_details_list.append(f"  * {name}: {qty} units ({status})")
        stocks_str = "\n".join(stock_details_list) if stock_details_list else "None"
    except:
        stocks=[]
        low_stocks=[]
        stocks_str = "Data unavailable"

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
        "You are the SiteWatch AI assistant for a construction safety monitoring dashboard.\n"
        "Answer the user's questions strictly based on the following real-time system data:\n\n"
        f"- Total Stocks Monitored: {len(stocks)}\n"
        f"- Low/Out of Stock Items: {','.join(low_stocks) if low_stocks else 'None'}\n"
        f"- All Stocks List:\n{stocks_str}\n\n"
        f"- Active Workers on Site: {active_workers}\n"
        f"- Recent Incidents: {', '.join(recent_incidents) if recent_incidents else 'None'}\n"
        f"- Recent Compliance Reports: {', '.join(recent_compliance) if recent_compliance else 'None'}\n\n"
        "Keep your answers concise, professional and helpful. If asked something outside of construction, safety or inventory, politely decline."
    )
    return context

@router.post("/")
async def chat_with_ai(request:ChatRequest):
    try:
        api_key = os.getenv("GOOGLE_API_KEY", "").strip('"').strip("'").strip()
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY environment variable is not configured")
        
        # Pop GCP default credentials to ensure the SDK doesn't attempt OAuth
        for key in ["GOOGLE_APPLICATION_CREDENTIALS", "GOOGLE_CLOUD_PROJECT"]:
            if key in os.environ:
                os.environ.pop(key)
                
        from google import genai
        from google.genai.errors import APIError
        
        # Initialize client specifically with api_key
        client = genai.Client(api_key=api_key)
        
        context=get_project_context()
        
        contents = [
            {"role": "user", "parts": [{"text": f"{context}\n\nUser Question: {request.message}\nAssistant Answer:"}]}
        ]
        
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=contents
        )
        return {"response": response.text.strip()}

    except Exception as e:
        print(f"Chatbot Diagnostic Log: {type(e).__name__} - {str(e)}")
        # Return a safe, generic error to the user
        raise HTTPException(status_code=500, detail="Sorry, I am having trouble connecting to the AI service. Please try again.")
    