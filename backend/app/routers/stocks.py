import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from bson import ObjectId
from app.database import db
from datetime import datetime
from twilio.rest import Client

router=APIRouter(prefix="/api/stocks",tags=["stocks"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "stocks")
os.makedirs(UPLOAD_DIR, exist_ok=True)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID","ACe55e19b57c97440065b182d31e374ce4")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "404df8b198d252e9e4898d2545c96fc8")
TWILIO_WHATSAPP_SENDER = os.getenv("TWILIO_WHATSAPP_SENDER", "whatsapp:+14155238886")
ADMIN_WHATSAPP_NUMBER = os.getenv("ADMIN_WHATSAPP_NUMBER", "whatsapp:+94760429021")

def serialize_doc(doc):
    if"_id" in doc:
        doc["_id"]=str(doc["_id"])
    return doc

@router.get("/")
async def get_stocks():
    stocks=list(db.stocks.find().sort("item_name",1))
    return [serialize_doc(s) for s in stocks]

@router.post("/")
async def add_stock(
    item_name: str = Form(...),
    quantity: int = Form(...),
    unit: str = Form(...),
    brand: str = Form(...),
    unit_price: float = Form(...),
    purchase_date: str = Form(...),
    status: str = Form(...),
    additional_info: Optional[str] = Form(""),
    image: Optional[UploadFile] = File(None)
):

    image_url = ""

    if image:
        file_path=os.path.join(UPLOAD_DIR,image.filename)
        with open(file_path,"wb") as buffer:
            shutil.copyfileobj(image.file,buffer)
        image_url = f"/uploads/stocks/{image.filename}"

    stock_doc={
        "stock_id": f"STK-{int(datetime.utcnow().timestamp())}",
        "item_name": item_name,
        "quantity": quantity,
        "unit": unit,
        "brand": brand,
        "unit_price": unit_price,
        "total_value": quantity * unit_price,
        "purchase_date": purchase_date,
        "status": status,
        "additional_info": additional_info,
        "image_url": image_url,
        "critical_out_of_stock": False
    }

    result=db.stocks.insert_one(stock_doc)
    stock_doc["_id"]=str(result.inserted_id)
    return stock_doc

@router.put("/{stock_id}")
async def update_stock(
     stock_id: str,
    item_name: str = Form(...),
    quantity: int = Form(...),
    unit: str = Form(...),
    brand: str = Form(...),
    unit_price: float = Form(...),
    purchase_date: str = Form(...),
    status: str = Form(...),
    additional_info: Optional[str] = Form(""),
    image: Optional[UploadFile] = File(None)
):
    
    existing_stock = db.stocks.find_one({"_id": ObjectId(stock_id)})
    
    # Automatically set status to Available if the new quantity meets or exceeds the requested amount
    if existing_stock and existing_stock.get("critical_out_of_stock"):
        requested_qty = existing_stock.get("requested_quantity", 1)
        if quantity > 0 and quantity >= requested_qty:
            status = "Available"

    update_data = {
        "item_name": item_name,
        "quantity": quantity,
        "unit": unit,
        "brand": brand,
        "unit_price": unit_price,
        "total_value": quantity * unit_price,
        "purchase_date": purchase_date,
        "status": status,
        "additional_info": additional_info,
        # Remove critical flag when updated
        "critical_out_of_stock": False,
        "requested_quantity": 0,
        "requested_by": ""
    }

    if image and image.filename:
        file_path=os.path.join(UPLOAD_DIR,image.filename)
        with open(file_path,"wb") as buffer:
            shutil.copyfileobj(image.file,buffer)
        update_data["image_url"]=f"/uploads/stocks/{image.filename}"

    db.stocks.update_one({"_id":ObjectId(stock_id)},{"$set":update_data})
    return {"status":"success","message":"Stock updated"}

@router.delete("/{stock_id}")
async def delete_stock(stock_id:str):
    db.stocks.delete_one({"_id":ObjectId(stock_id)})
    return {"status":"success","message":"Stock deleted"}

@router.post("/{stock_id}/request")
async def request_stock(stock_id: str, worker_name: str = Form(...), quantity: int = Form(1)):
    stock = db.stocks.find_one({"_id": ObjectId(stock_id)})
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    db.stocks.update_one(
        {"_id":ObjectId(stock_id)},
        {"$set":{"critical_out_of_stock":True,"status":"Out of stock", "requested_quantity": quantity, "requested_by": worker_name}}
    )

    try:
        client=Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message=client.messages.create(
            from_=TWILIO_WHATSAPP_SENDER,
            body=f"⚠️ *STOCK ALERT* ⚠️\nWorker '{worker_name}' has requested *{quantity}x* stock for *{stock['item_name']}* (ID: {stock['stock_id']}).\nStatus marked as CRITICAL OUT OF STOCK.",
            to=ADMIN_WHATSAPP_NUMBER
        )
    except Exception as e:
        print(f"Failed to send WhatsApp message:{e}")

    return {"status":"success","message":"Request sent to Admin"}

