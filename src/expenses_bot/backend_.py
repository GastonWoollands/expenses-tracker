import os
import json
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from expenses_bot.config import get_logger

# Initialize logging first
logger = get_logger(__name__)

# WhatsApp webhook configuration
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

# Validate required WhatsApp environment variables
if not WHATSAPP_VERIFY_TOKEN:
    logger.warning("WHATSAPP_VERIFY_TOKEN not set - webhook verification will fail")
if not WHATSAPP_ACCESS_TOKEN:
    logger.warning("WHATSAPP_ACCESS_TOKEN not set - replies will be disabled")
if not WHATSAPP_PHONE_NUMBER_ID:
    logger.warning("WHATSAPP_PHONE_NUMBER_ID not set - replies will be disabled")

# Initialize FastAPI app
app = FastAPI(title="WhatsApp Expenses Bot", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("WhatsApp backend initialized")

@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "service": "WhatsApp Expenses Webhook"}

@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"status": "pong"}

@app.get("/webhook")
async def whatsapp_verify(request: Request):
    """WhatsApp webhook verification endpoint."""
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")

@app.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Receive messages from WhatsApp Business API."""
    try:
        # Import here to avoid config issues at startup
        from expenses_bot.llm import classify_expense
        from expenses_bot.sheets import add_expense
        
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

        logger.info(f"WhatsApp webhook received")
        
        if data.get("object") != "whatsapp_business_account":
            logger.info("Ignoring non-WhatsApp webhook")
            return {"status": "ignored"}
        
        entries = data.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                
                for message in messages:
                    await process_whatsapp_message(message, classify_expense, add_expense)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"status": "error", "detail": str(e)}

async def process_whatsapp_message(message: dict, classify_expense_func, add_expense_func):
    """Process incoming WhatsApp message and save to Google Sheets."""
    from_number = None
    try:
        message_id = message.get("id")
        from_number = message.get("from")
        message_type = message.get("type")
        
        logger.info(f"Processing WhatsApp message: id={message_id}, from={from_number}, type={message_type}")
        
        if message_type != "text":
            logger.info(f"Ignoring non-text message type: {message_type}")
            return
        
        text_object = message.get("text", {})
        message_text = text_object.get("body", "")
        
        if not message_text:
            logger.warning("Empty message text received")
            return
        
        logger.info(f"Message text: {message_text}")
        
        # Classify using LLM
        result = classify_expense_func(message_text)
        
        if not result or result.get("category") is None:
            logger.warning(f"Failed to classify expense from text: {message_text}")
            await send_whatsapp_reply(from_number, "Sorry, I couldn't process that expense. Please try again.")
            return
        
        # Extract expense data
        category = result["category"]
        amount = result["amount"]
        dt = result.get("datetime")
        
        # Validate date
        if dt and isinstance(dt, str) and len(dt) >= 10 and dt[:4].isdigit() and dt[5:7].isdigit() and dt[8:10].isdigit():
            pass
        else:
            dt = datetime.now().strftime("%Y-%m-%d")
        
        description = result.get("description") or message_text
        
        # Save to Google Sheets
        try:
            add_expense_func(category, amount, dt, description)
            logger.info(f"Expense saved: {category} - {amount} - {dt} - {description}")
            
            confirmation_msg = (
                f"✅ Expense saved!\n\n"
                f"📁 Category: {category}\n"
                f"💰 Amount: {amount}\n"
                f"📅 Date: {dt}\n"
                f"📝 Description: {description}"
            )
            await send_whatsapp_reply(from_number, confirmation_msg)
            
        except Exception as e:
            logger.error(f"Error saving to Google Sheets: {e}")
            await send_whatsapp_reply(from_number, f"Error saving to Google Sheets: {str(e)}")
        
    except Exception as e:
        logger.error(f"Error processing WhatsApp message: {e}")
        if from_number:
            await send_whatsapp_reply(from_number, f"Error processing your message: {str(e)}")

async def send_whatsapp_reply(to_number: str, message_text: str):
    """Send a reply via WhatsApp API (optional)."""
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.info("WhatsApp reply disabled (missing access token)")
        return
    
    try:
        import httpx
        
        url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": message_text}
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                logger.info(f"WhatsApp reply sent to {to_number}")
            else:
                logger.warning(f"Failed to send WhatsApp reply: {response.status_code}")
                
    except Exception as e:
        logger.error(f"Error sending WhatsApp reply: {e}")

@app.on_event("startup")
async def startup():
    """Startup event."""
    logger.info("WhatsApp Expenses Backend starting...")
    logger.info("Available routes:")
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            logger.info(f"  {list(route.methods or set())} {route.path}")

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event."""
    logger.info("WhatsApp Expenses Backend shutting down...")
