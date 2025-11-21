"""
WhatsApp service for processing WhatsApp messages and saving expenses
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from collections import defaultdict
import httpx

from database.neon_client import get_neon
from services.expense_service import ExpenseService
from services.sheets_service import SheetsService
from models.expense import ExpenseCreate

logger = logging.getLogger(__name__)

# WhatsApp configuration
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

# In-memory store for processed message IDs (prevents duplicate processing)
processed_messages = set()
message_timestamps = defaultdict(list)


class WhatsAppService:
    """Service for WhatsApp message processing and expense saving"""
    
    def __init__(self):
        self.expense_service = ExpenseService()
        self.sheets_service = SheetsService()
        self._neon = None
    
    @property
    def neon(self):
        """Get Neon client (lazy loading)"""
        if self._neon is None:
            self._neon = get_neon()
        return self._neon
    
    def is_message_processed(self, message_id: str) -> bool:
        """Check if a message has already been processed"""
        return message_id in processed_messages
    
    def mark_message_processed(self, message_id: str):
        """Mark a message as processed"""
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
    
    async def get_user_by_phone(self, phone_number: str) -> Optional[str]:
        """Get user ID by phone number"""
        try:
            # Normalize phone number (remove +, spaces, etc.)
            normalized_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")
            
            # Try exact match first
            user = await self.neon.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1",
                normalized_phone
            )
            
            if user:
                return str(user["id"])
            
            # Try with + prefix
            user = await self.neon.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1",
                f"+{normalized_phone}"
            )
            
            if user:
                return str(user["id"])
            
            logger.warning(f"User not found for phone number: {phone_number}")
            return None
        except Exception as e:
            logger.error(f"Error looking up user by phone: {e}")
            return None
    
    async def download_whatsapp_audio(self, media_id: str) -> bytes:
        """Download audio file from WhatsApp Media API"""
        if not WHATSAPP_ACCESS_TOKEN:
            raise ValueError("WHATSAPP_ACCESS_TOKEN not set - cannot download media")
        
        try:
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
    
    async def transcribe_audio(self, audio_bytes: bytes, file_extension: str = ".ogg") -> str:
        """Transcribe audio using Whisper"""
        try:
            # Import transcription from expenses_bot
            import sys
            from pathlib import Path
            
            # Add expenses_bot to path if needed
            expenses_bot_path = Path(__file__).parent.parent.parent / "src" / "expenses_bot"
            if str(expenses_bot_path) not in sys.path:
                sys.path.insert(0, str(expenses_bot_path))
            
            # Import with full module path
            from expenses_bot.transcription import transcribe_audio_bytes  # type: ignore
            
            message_text = transcribe_audio_bytes(
                audio_bytes,
                language="es",
                model_name="base",
                file_extension=file_extension
            )
            
            if not message_text or not message_text.strip():
                raise ValueError("Empty transcription result")
            
            return message_text.strip()
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            raise
    
    async def classify_expense(self, text: str) -> Dict[str, Any]:
        """Classify expense using LLM"""
        try:
            # Import LLM classification from expenses_bot
            import sys
            from pathlib import Path
            
            # Add expenses_bot to path if needed
            expenses_bot_path = Path(__file__).parent.parent.parent / "src" / "expenses_bot"
            if str(expenses_bot_path) not in sys.path:
                sys.path.insert(0, str(expenses_bot_path))
            
            # Import with full module path
            from expenses_bot.llm import classify_expense  # type: ignore
            
            result = classify_expense(text)
            return result
        except Exception as e:
            logger.error(f"Error classifying expense: {e}")
            return {"category": "Uncategorized", "amount": None, "datetime": None, "description": None}
    
    async def save_expense_to_neon(
        self, 
        user_id: str, 
        category: str, 
        amount: float, 
        date_str: str, 
        description: str
    ) -> Any:
        """Save expense to Neon database"""
        try:
            # Parse date
            try:
                expense_date = datetime.strptime(date_str, "%Y-%m-%d")
            except:
                expense_date = datetime.now()
            
            # Create expense
            expense_data = ExpenseCreate(
                amount=float(amount),
                category=category,
                description=description,
                date=expense_date,
                currency="EUR"
            )
            
            expense = await self.expense_service.create_expense(expense_data, user_id)
            logger.info(f"Expense saved to Neon: {expense.id}")
            return expense
        except Exception as e:
            logger.error(f"Error saving expense to Neon: {e}")
            raise
    
    async def save_expense_to_sheets(
        self, 
        user_id: str, 
        category: str, 
        amount: float, 
        date_str: str, 
        description: str
    ):
        """Save expense to Google Sheets (optional)"""
        try:
            if self.sheets_service.enabled:
                # Create a simple expense object for sheets
                expense_obj = type('Expense', (), {
                    'category': category,
                    'amount': amount,
                    'date': date_str,
                    'description': description
                })()
                await self.sheets_service.add_expense(expense_obj, user_id)
                logger.info("Expense saved to Google Sheets")
        except Exception as e:
            logger.warning(f"Error saving expense to Google Sheets (non-critical): {e}")
    
    async def send_whatsapp_reply(self, to_number: str, message_text: str):
        """Send a reply via WhatsApp API"""
        if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
            logger.info("WhatsApp reply disabled (missing access token)")
            return
        
        try:
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
    
    async def process_whatsapp_message(self, message: dict):
        """Process incoming WhatsApp message and save expense"""
        from_number = None
        try:
            message_id = message.get("id")
            from_number = message.get("from")
            message_type = message.get("type")
            
            logger.info(f"Processing WhatsApp message: id={message_id}, from={from_number}, type={message_type}")
            
            # Find user by phone number
            user_id = await self.get_user_by_phone(from_number)
            if not user_id:
                await self.send_whatsapp_reply(
                    from_number, 
                    "Sorry, your phone number is not registered. Please register first."
                )
                return
            
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
                    await self.send_whatsapp_reply(from_number, "Sorry, I couldn't process the audio message.")
                    return
                
                media_id = audio_obj.get("id")
                if not media_id:
                    logger.warning(f"No media ID found in {message_type} message")
                    await self.send_whatsapp_reply(from_number, "Sorry, I couldn't process the audio message.")
                    return
                
                try:
                    # Download and transcribe audio
                    await self.send_whatsapp_reply(from_number, "Transcribing audio...")
                    audio_bytes = await self.download_whatsapp_audio(media_id)
                    
                    mime_type = audio_obj.get("mime_type", "").lower()
                    if "mp3" in mime_type:
                        file_extension = ".mp3"
                    elif "wav" in mime_type:
                        file_extension = ".wav"
                    else:
                        file_extension = ".ogg"
                    
                    message_text = await self.transcribe_audio(audio_bytes, file_extension)
                    logger.info(f"Transcribed text: {message_text}")
                    
                except Exception as e:
                    logger.error(f"Error processing audio message: {e}")
                    await self.send_whatsapp_reply(from_number, f"Error processing audio: {str(e)}")
                    return
            
            else:
                logger.info(f"Ignoring unsupported message type: {message_type}")
                return
            
            # Process the message text (from text message or transcribed audio)
            if not message_text:
                logger.warning("No message text to process")
                return
            
            # Classify expense
            logger.info(f"Classifying text with LLM: {message_text}")
            result = await self.classify_expense(message_text)
            
            if not result or result.get("category") is None:
                logger.warning(f"Failed to classify expense from text: {message_text}")
                await self.send_whatsapp_reply(from_number, "Sorry, I couldn't process that expense. Please try again.")
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
            
            try:
                if isinstance(amount, str):
                    amount = float(amount.replace(",", "").strip())
            except Exception:
                pass
            
            if amount is None:
                logger.warning(f"Could not extract amount from message: {message_text}")
                await self.send_whatsapp_reply(from_number, "Sorry, I couldn't extract the amount from your message.")
                return
            
            # Save to Neon database
            try:
                expense = await self.save_expense_to_neon(user_id, category, amount, dt, description)
                logger.info(f"Expense saved: {category} - {amount} - {dt} - {description}")
                
                # Save to Google Sheets (optional, non-blocking)
                await self.save_expense_to_sheets(user_id, category, amount, dt, description)
                
                # Send confirmation
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
                await self.send_whatsapp_reply(from_number, confirmation_msg)
                
            except Exception as e:
                logger.error(f"Error saving expense: {e}")
                await self.send_whatsapp_reply(from_number, f"Error saving expense: {str(e)}")
        
        except Exception as e:
            logger.error(f"Error processing WhatsApp message: {e}")
            if from_number:
                await self.send_whatsapp_reply(from_number, f"Error processing your message: {str(e)}")


# Global instance
whatsapp_service = WhatsAppService()

