"""
WhatsApp webhook router
"""

import json
import logging
import os
from fastapi import APIRouter, Request, HTTPException, status, BackgroundTasks, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from services.whatsapp_service import whatsapp_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# WhatsApp configuration
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
API_TOKEN = os.getenv("API_TOKEN")

# Security
security = HTTPBearer(auto_error=False)


class DirectMessage(BaseModel):
    """Model for direct API message"""
    from_number: str
    message: str


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API token for direct message endpoint"""
    if not API_TOKEN:
        return  # No token required if not configured
    if not credentials or credentials.credentials != API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API token"
        )


@router.get("/webhook")
async def whatsapp_verify(request: Request):
    """WhatsApp webhook verification endpoint"""
    query_params = request.query_params
    
    mode = query_params.get("hub.mode")
    token = query_params.get("hub.verify_token")
    challenge = query_params.get("hub.challenge")
    
    logger.info(f"WhatsApp verification request: mode={mode}")
    
    if mode and token and mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully")
        return int(challenge)
    else:
        logger.warning("WhatsApp verification failed")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verification failed"
        )


async def process_messages_background(data: dict):
    """Background task to process WhatsApp messages"""
    entries = data.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            
            for message in messages:
                message_id = message.get("id")
                if message_id and whatsapp_service.is_message_processed(message_id):
                    logger.info(f"Message {message_id} already processed, skipping")
                    continue
                
                # Mark as processed immediately to prevent duplicates
                if message_id:
                    whatsapp_service.mark_message_processed(message_id)
                
                try:
                    await whatsapp_service.process_whatsapp_message(message)
                except Exception as e:
                    logger.error(f"Error processing message {message_id}: {e}")


@router.post("/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive messages from WhatsApp Business API"""
    try:
        try:
            raw_body = await request.body()
        except Exception:
            raw_body = b""

        if not raw_body:
            logger.info("Webhook POST received with empty body; acknowledging")
            return {"status": "ok", "detail": "empty body"}

        try:
            data = json.loads(raw_body)
        except Exception:
            logger.info("Webhook POST received with non-JSON body; acknowledging")
            return {"status": "ignored", "detail": "invalid json"}

        logger.info("WhatsApp webhook received")
        
        if data.get("object") != "whatsapp_business_account":
            logger.info("Ignoring non-WhatsApp webhook")
            return {"status": "ignored"}
        
        # Process messages in background to return 200 OK quickly
        # This prevents WhatsApp from retrying the webhook
        background_tasks.add_task(process_messages_background, data)
        
        # Return 200 OK immediately to prevent WhatsApp retries
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"status": "error", "detail": str(e)}


@router.post("/send_message")
async def send_message(
    data: DirectMessage,
    _: None = Depends(verify_token)
):
    """Direct API to classify and save a message, then notify the user via WhatsApp"""
    try:
        fake_message = {
            "id": "api_direct_msg",
            "from": data.from_number,
            "type": "text",
            "text": {"body": data.message},
        }
        await whatsapp_service.process_whatsapp_message(fake_message)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Direct send_message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

