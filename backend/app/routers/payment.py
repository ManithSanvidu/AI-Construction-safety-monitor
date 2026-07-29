import os
import hashlib
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/api/payment", tags=["Payment"])
logger = logging.getLogger(__name__)

# Credentials from .env
MERCHANT_ID = os.getenv("PAYHERE_MERCHANT_ID", "1228514")
MERCHANT_SECRET = os.getenv("PAYHERE_MERCHANT_SECRET", "4h1iZ3Dq03iB7M6wz4M8tY4iU8eN8R4p4h8x0Z9H5i4Y")

class HashRequest(BaseModel):
    order_id: str
    amount: float
    currency: str

@router.post("/generate-hash")
def generate_hash(request: HashRequest):
    try:
        # Amount must be formatted to two decimal places
        amount_formatted = "{:.2f}".format(request.amount)
        
        # Step 1: md5(merchant_secret).upper()
        md5_sig = hashlib.md5(MERCHANT_SECRET.encode('utf-8')).hexdigest().upper()
        
        # Step 2: merchant_id + order_id + amount_formatted + currency + md5_sig
        hash_string = f"{MERCHANT_ID}{request.order_id}{amount_formatted}{request.currency}{md5_sig}"
        
        # Step 3: md5 of the concatenated string, uppercase
        final_hash = hashlib.md5(hash_string.encode('utf-8')).hexdigest().upper()
        
        return {
            "merchant_id": MERCHANT_ID,
            "hash": final_hash
        }
    except Exception as e:
        logger.error(f"Error generating payment hash: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/notify")
async def payment_notify(request: Request):
    """
    Webhook endpoint for PayHere to notify us of payment status.
    This will be called asynchronously by PayHere's servers.
    """
    form_data = await request.form()
    
    merchant_id = form_data.get("merchant_id")
    order_id = form_data.get("order_id")
    payhere_amount = form_data.get("payhere_amount")
    payhere_currency = form_data.get("payhere_currency")
    status_code = form_data.get("status_code")
    md5sig = form_data.get("md5sig")
    
    if not all([merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig]):
        return {"status": "error", "message": "Missing parameters"}
        
    # Verify the signature
    md5_secret = hashlib.md5(MERCHANT_SECRET.encode('utf-8')).hexdigest().upper()
    local_sig_string = f"{merchant_id}{order_id}{payhere_amount}{payhere_currency}{status_code}{md5_secret}"
    local_md5sig = hashlib.md5(local_sig_string.encode('utf-8')).hexdigest().upper()
    
    if local_md5sig == md5sig:
        if status_code == '2': # 2 means success
            logger.info(f"Payment successful for order {order_id}")
            # Here you would typically update the database to mark the organization as PAID
        else:
            logger.info(f"Payment status {status_code} for order {order_id}")
    else:
        logger.warning(f"Invalid payment signature for order {order_id}")
        
    return {"status": "success"}
