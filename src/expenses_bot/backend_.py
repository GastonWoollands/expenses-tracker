import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, HTTPException, status, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from expenses_bot.config import get_logger
from collections import defaultdict

# Initialize logging first
logger = get_logger(__name__)

# In-memory store for processed message IDs (prevents duplicate processing)
# In production, consider using Redis for distributed systems
processed_messages = set()
message_timestamps = defaultdict(list)

# WhatsApp webhook configuration
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
API_TOKEN = os.getenv("API_TOKEN")

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

try:
    from expenses_bot.api_routes import router as api_router
    app.include_router(api_router)
    logger.info("API routes included")
except Exception as e:
    logger.warning(f"Failed to include API routes: {e}")

logger.info("WhatsApp backend initialized")

@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "service": "WhatsApp Expenses Webhook"}

@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"status": "pong"}

#---------------------------------------------
# Auth and input models for direct API usage

class DirectMessage(BaseModel):
    from_number: str
    message: str

async def verify_token(request: Request):
    auth = request.headers.get("Authorization")
    if not API_TOKEN:
        return  # No token required if not configured
    if not auth or auth != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API token.")

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

def is_message_processed(message_id: str) -> bool:
    """Check if a message has already been processed."""
    return message_id in processed_messages

def mark_message_processed(message_id: str):
    """Mark a message as processed."""
    processed_messages.add(message_id)
    message_timestamps[message_id].append(datetime.now())
    
    # Clean up old entries (keep last 24 hours)
    cutoff = datetime.now() - timedelta(hours=24)
    for msg_id, timestamps in list(message_timestamps.items()):
        message_timestamps[msg_id] = [ts for ts in timestamps if ts > cutoff]
        if not message_timestamps[msg_id]:
            del message_timestamps[msg_id]
            if msg_id in processed_messages:
                processed_messages.remove(msg_id)

async def process_messages_background(data: dict):
    """Background task to process WhatsApp messages."""
    from expenses_bot.llm import classify_expense
    from expenses_bot.sheets import add_expense
    
    entries = data.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            
            for message in messages:
                message_id = message.get("id")
                if message_id and is_message_processed(message_id):
                    logger.info(f"Message {message_id} already processed, skipping")
                    continue
                
                # Mark as processed immediately to prevent duplicates
                if message_id:
                    mark_message_processed(message_id)
                
                try:
                    await process_whatsapp_message(message, classify_expense, add_expense)
                except Exception as e:
                    logger.error(f"Error processing message {message_id}: {e}")

@app.post("/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive messages from WhatsApp Business API."""
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

        logger.info(f"WhatsApp webhook received")
        
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

async def download_whatsapp_audio(media_id: str) -> bytes:
    """
    Download audio file from WhatsApp Media API.
    
    Args:
        media_id: WhatsApp media ID
    
    Returns:
        Audio file content as bytes
    """
    if not WHATSAPP_ACCESS_TOKEN:
        raise ValueError("WHATSAPP_ACCESS_TOKEN not set - cannot download media")
    
    try:
        import httpx
        
        # First, get the media URL
        url = f"https://graph.facebook.com/v18.0/{media_id}"
        headers = {
            "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get media URL
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to get media URL: {response.status_code}")
            
            media_data = response.json()
            media_url = media_data.get("url")
            if not media_url:
                raise Exception("Media URL not found in response")
            
            # Download the actual media file
            download_headers = {
                "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"
            }
            download_response = await client.get(media_url, headers=download_headers, timeout=60.0)
            if download_response.status_code != 200:
                raise Exception(f"Failed to download media: {download_response.status_code}")
            
            logger.info(f"Successfully downloaded audio media: {media_id}")
            return download_response.content
            
    except Exception as e:
        logger.error(f"Error downloading WhatsApp audio {media_id}: {e}")
        raise

async def process_whatsapp_message(message: dict, classify_expense_func, add_expense_func):
    """Process incoming WhatsApp message and save to Google Sheets."""
    from_number = None
    try:
        message_id = message.get("id")
        from_number = message.get("from")
        message_type = message.get("type")
        
        logger.info(f"Processing WhatsApp message: id={message_id}, from={from_number}, type={message_type}")
        
        message_text = None
        
        # Handle text messages
        if message_type == "text":
            text_object = message.get("text", {})
            message_text = text_object.get("body", "")
            
            if not message_text:
                logger.warning("Empty message text received")
                return
            
            logger.info(f"Message text: {message_text}")
        
        # Handle audio/voice messages
        elif message_type in ("audio", "voice"):
            logger.info(f"Processing {message_type} message")
            
            # Get media ID from audio or voice object
            audio_obj = message.get("audio") or message.get("voice")
            if not audio_obj:
                logger.warning(f"No audio/voice object found in {message_type} message")
                await send_whatsapp_reply(from_number, "Sorry, I couldn't process the audio message.")
                return
            
            media_id = audio_obj.get("id")
            if not media_id:
                logger.warning(f"No media ID found in {message_type} message")
                await send_whatsapp_reply(from_number, "Sorry, I couldn't process the audio message.")
                return
            
            try:
                # Download audio
                await send_whatsapp_reply(from_number, "Transcribing audio...")
                audio_bytes = await download_whatsapp_audio(media_id)
                
                # Transcribe audio using Whisper
                from expenses_bot.transcription import transcribe_audio_bytes
                
                mime_type = audio_obj.get("mime_type", "").lower()
                if "mp3" in mime_type:
                    file_extension = ".mp3"
                elif "wav" in mime_type:
                    file_extension = ".wav"
                else:
                    file_extension = ".ogg"
                
                message_text = transcribe_audio_bytes(
                    audio_bytes,
                    language="es",
                    model_name="base",
                    file_extension=file_extension
                )
                
                if not message_text or not message_text.strip():
                    logger.warning("Empty transcription result")
                    await send_whatsapp_reply(from_number, "Sorry, I couldn't transcribe the audio message.")
                    return
                
                logger.info(f"Transcribed text: {message_text}")
                
            except Exception as e:
                logger.error(f"Error processing audio message: {e}")
                await send_whatsapp_reply(from_number, f"Error processing audio: {str(e)}")
                return
        
        else:
            logger.info(f"Ignoring unsupported message type: {message_type}")
            return
        
        # Process the message text (from text message or transcribed audio)
        if not message_text:
            logger.warning("No message text to process")
            return
        
        logger.info(f"Classifying text with Gemini LLM: {message_text}")
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
        
        # Normalize amount to float when possible
        try:
            if isinstance(amount, str):
                amount = float(amount.replace(",", "").strip())
        except Exception:
            pass

        # Save to Google Sheets
        try:
            add_expense_func(category, amount, dt, description)
            logger.info(f"Expense saved: {category} - {amount} - {dt} - {description}")

            # Compact list-style confirmation
            def _fmt_amount(v):
                try:
                    return f"{float(v):.2f}"
                except Exception:
                    return str(v) if v is not None else "-"

            amount_str = _fmt_amount(amount)
            desc = (description or "-").strip()
            if len(desc) > 120:
                desc = desc[:120] + "…"

            confirmation_msg = (
                "Expense saved!\n"
                f"- Category: {category}\n"
                f"- Amount: {amount_str}\n"
                f"- Date: {dt}\n"
                f"- Description: {desc}"
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

@app.post("/send_message")
async def send_message(data: DirectMessage, _: None = Depends(verify_token)):
    """Direct API to classify and save a message, then notify the user via WhatsApp."""
    try:
        from expenses_bot.llm import classify_expense
        from expenses_bot.sheets import add_expense

        fake_message = {
            "id": "api_direct_msg",
            "from": data.from_number,
            "type": "text",
            "text": {"body": data.message},
        }
        await process_whatsapp_message(fake_message, classify_expense, add_expense)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Direct send_message error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup():
    """Startup event."""
    logger.info("WhatsApp Expenses Backend starting...")
    
    try:
        from expenses_bot.database import init_db_pool
        await init_db_pool()
    except Exception as e:
        logger.warning(f"Database initialization failed (will continue with Google Sheets only): {e}")
    
    logger.info("Available routes:")
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            logger.info(f"  {list(route.methods or set())} {route.path}")

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event."""
    logger.info("WhatsApp Expenses Backend shutting down...")
    
    try:
        from expenses_bot.database import close_db_pool
        await close_db_pool()
    except Exception as e:
        logger.warning(f"Error closing database pool: {e}")
