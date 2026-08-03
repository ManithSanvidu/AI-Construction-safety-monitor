import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from twilio.rest import Client

router = APIRouter(prefix="/api/contact", tags=["Contact"])
logger = logging.getLogger(__name__)

# Load Twilio config from env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_SENDER = os.getenv("TWILIO_WHATSAPP_SENDER")
ADMIN_WHATSAPP_NUMBER = os.getenv("ADMIN_WHATSAPP_NUMBER", "whatsapp:+94760429021")

class ContactMessage(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@router.post("/send")
async def send_contact_message(data: ContactMessage):
    # Dynamically fetch and strip accidental quotes from Render env vars
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "ACe55e19b57c97440065b182d31e374ce4").strip('"').strip("'")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "404df8b198d252e9e4898d2545c96fc8").strip('"').strip("'")
    TWILIO_WHATSAPP_SENDER = os.getenv("TWILIO_WHATSAPP_SENDER", "whatsapp:+14155238886").strip('"').strip("'")
    ADMIN_WHATSAPP_NUMBER = os.getenv("ADMIN_WHATSAPP_NUMBER", "whatsapp:+94760429021").strip('"').strip("'")

    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_SENDER]):
        logger.error("Twilio credentials are not fully configured.")
        raise HTTPException(status_code=500, detail="WhatsApp integration not configured on the server.")

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Format the WhatsApp message body
        whatsapp_body = (
            f"*New Contact Message*\n\n"
            f"*Name:* {data.name}\n"
            f"*Email:* {data.email}\n"
            f"*Subject:* {data.subject}\n\n"
            f"*Message:*\n{data.message}"
        )
        
        # Ensure correct WhatsApp prefix to prevent SMS routing or failures
        to_number = ADMIN_WHATSAPP_NUMBER if ADMIN_WHATSAPP_NUMBER.startswith("whatsapp:") else f"whatsapp:{ADMIN_WHATSAPP_NUMBER}"
        from_number = TWILIO_WHATSAPP_SENDER if TWILIO_WHATSAPP_SENDER.startswith("whatsapp:") else f"whatsapp:{TWILIO_WHATSAPP_SENDER}"

        # Send message to admin
        message = client.messages.create(
            body=whatsapp_body,
            from_=from_number,
            to=to_number
        )
        
        logger.info(f"WhatsApp message sent! SID: {message.sid}")
        return {"status": "success", "message": "Message sent successfully"}

    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message via WhatsApp.")
