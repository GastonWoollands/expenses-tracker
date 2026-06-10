"""
WhatsApp service for processing WhatsApp messages and saving expenses
"""

import asyncio
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from collections import defaultdict
import httpx

from database.neon_client import get_neon
from services.expense_service import ExpenseService
from models.expense import ExpenseCreate
from config.transcription import VOICE_CONFIRMATION_ENABLED
from services.voice_session_store import (
    voice_session_store,
    PendingVoiceExpense,
    is_affirmative_reply,
)
from utils.audio_transcription import transcribe_audio_bytes, TranscriptionResult
from utils.transcription_normalizer import normalize_expense_transcription
from utils.llm_classifier import classify_expense as classify_expense_llm

logger = logging.getLogger(__name__)

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

processed_messages = set()
message_timestamps = defaultdict(list)


class WhatsAppService:
    """Service for WhatsApp message processing and expense saving"""

    def __init__(self):
        self.expense_service = ExpenseService()
        self._neon = None

    @property
    def neon(self):
        if self._neon is None:
            self._neon = get_neon()
        return self._neon

    def is_message_processed(self, message_id: str) -> bool:
        return message_id in processed_messages

    def mark_message_processed(self, message_id: str):
        processed_messages.add(message_id)
        message_timestamps[message_id].append(datetime.now())

        cutoff = datetime.now() - timedelta(hours=24)
        for msg_id, timestamps in list(message_timestamps.items()):
            message_timestamps[msg_id] = [ts for ts in timestamps if ts > cutoff]
            if not message_timestamps[msg_id]:
                del message_timestamps[msg_id]
                if msg_id in processed_messages:
                    processed_messages.remove(msg_id)

    async def get_user_by_phone(self, phone_number: str) -> Optional[str]:
        try:
            normalized_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")

            user = await self.neon.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1",
                normalized_phone,
            )
            if user:
                return str(user["id"])

            user = await self.neon.fetchrow(
                "SELECT id FROM users WHERE phone_number = $1",
                f"+{normalized_phone}",
            )
            if user:
                return str(user["id"])

            logger.warning("User not found for phone number: %s", phone_number)
            return None
        except Exception as e:
            logger.error("Error looking up user by phone: %s", e)
            return None

    async def download_whatsapp_audio(self, media_id: str) -> bytes:
        if not WHATSAPP_ACCESS_TOKEN:
            raise ValueError("WHATSAPP_ACCESS_TOKEN not set - cannot download media")

        try:
            url = f"https://graph.facebook.com/v18.0/{media_id}"
            headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers)
                if response.status_code != 200:
                    raise Exception(f"Failed to get media URL: {response.status_code}")

                media_data = response.json()
                media_url = media_data.get("url")
                if not media_url:
                    raise Exception("Media URL not found in response")

                download_headers = {"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"}
                download_response = await client.get(
                    media_url, headers=download_headers, timeout=60.0
                )
                if download_response.status_code != 200:
                    raise Exception(f"Failed to download media: {download_response.status_code}")

                logger.info("Successfully downloaded audio media: %s", media_id)
                return download_response.content

        except Exception as e:
            logger.error("Error downloading WhatsApp audio %s: %s", media_id, e)
            raise

    async def transcribe_audio(
        self, audio_bytes: bytes, file_extension: str = ".ogg"
    ) -> TranscriptionResult:
        try:
            result = await asyncio.to_thread(
                transcribe_audio_bytes,
                audio_bytes,
                file_extension=file_extension,
            )
            if not result.text.strip():
                raise ValueError("Empty transcription result")
            return result
        except Exception as e:
            logger.error("Error transcribing audio: %s", e)
            raise

    async def classify_expense(self, text: str) -> Dict[str, Any]:
        try:
            return classify_expense_llm(text)
        except Exception as e:
            logger.error("Error classifying expense: %s", e)
            return {
                "category": "Uncategorized",
                "amount": None,
                "datetime": None,
                "description": None,
            }

    async def save_expense_to_neon(
        self,
        user_id: str,
        category: str,
        amount: float,
        date_str: str,
        description: str,
    ) -> Any:
        try:
            try:
                expense_date = datetime.strptime(date_str, "%Y-%m-%d")
            except Exception:
                expense_date = datetime.now()

            expense_data = ExpenseCreate(
                amount=float(amount),
                category=category,
                description=description,
                date=expense_date,
                currency="EUR",
            )

            expense = await self.expense_service.create_expense(expense_data, user_id)
            logger.info("Expense saved to Neon: %s", expense.id)
            return expense
        except Exception as e:
            logger.error("Error saving expense to Neon: %s", e)
            raise

    async def send_whatsapp_reply(self, to_number: str, message_text: str):
        if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
            logger.info("WhatsApp reply disabled (missing access token)")
            return

        try:
            url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
            headers = {
                "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            }
            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "text",
                "text": {"body": message_text},
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    logger.info("WhatsApp reply sent to %s", to_number)
                else:
                    logger.warning("Failed to send WhatsApp reply: %s", response.status_code)

        except Exception as e:
            logger.error("Error sending WhatsApp reply: %s", e)

    def _build_confirmation_message(
        self, transcription: TranscriptionResult, normalized_text: str, updated: bool = False
    ) -> str:
        lines = []
        if updated:
            lines.append("Updated transcription.")
        lines.append(f'I heard: "{normalized_text}"')
        if transcription.is_low_confidence:
            lines.append("Note: transcription confidence is low.")
        lines.extend(
            [
                "",
                "Is this correct?",
                "Reply YES to save, or send the corrected text.",
            ]
        )
        return "\n".join(lines)

    async def _handle_pending_confirmation(
        self,
        from_number: str,
        user_id: str,
        message_text: str,
        pending: PendingVoiceExpense,
    ) -> None:
        if is_affirmative_reply(message_text):
            final_text = pending.normalized_text
        else:
            final_text = message_text.strip()

        voice_session_store.clear(from_number)
        await self._process_expense_text(from_number, user_id, final_text)

    async def _process_voice_message(self, from_number: str, user_id: str, message: dict) -> None:
        message_type = message.get("type")
        audio_obj = message.get("audio") or message.get("voice")
        if not audio_obj:
            await self.send_whatsapp_reply(
                from_number, "Sorry, I couldn't process the audio message."
            )
            return

        media_id = audio_obj.get("id")
        if not media_id:
            await self.send_whatsapp_reply(
                from_number, "Sorry, I couldn't process the audio message."
            )
            return

        try:
            had_pending = voice_session_store.get_pending(from_number) is not None

            await self.send_whatsapp_reply(from_number, "Transcribing audio...")
            audio_bytes = await self.download_whatsapp_audio(media_id)

            mime_type = audio_obj.get("mime_type", "").lower()
            if "mp3" in mime_type:
                file_extension = ".mp3"
            elif "wav" in mime_type:
                file_extension = ".wav"
            else:
                file_extension = ".ogg"

            transcription = await self.transcribe_audio(audio_bytes, file_extension)
            normalized_text = normalize_expense_transcription(transcription.text)
            logger.info("Voice transcription: raw=%r normalized=%r", transcription.text, normalized_text)

            from chatbot.service import get_chatbot_service

            chatbot = get_chatbot_service()
            chatbot_response = await chatbot.process_message(normalized_text, user_id)

            if chatbot_response.intent == "query":
                await self.send_whatsapp_reply(from_number, chatbot_response.answer)
                return

            if chatbot_response.intent == "greeting":
                await self.send_whatsapp_reply(from_number, chatbot_response.answer)
                return

            if VOICE_CONFIRMATION_ENABLED:
                voice_session_store.set_pending(
                    from_number,
                    PendingVoiceExpense(
                        user_id=user_id,
                        raw_transcription=transcription.text,
                        normalized_text=normalized_text,
                        avg_logprob=transcription.avg_logprob,
                        created_at=datetime.now(),
                    ),
                )
                await self.send_whatsapp_reply(
                    from_number,
                    self._build_confirmation_message(
                        transcription, normalized_text, updated=had_pending
                    ),
                )
                return

            await self._process_expense_text(from_number, user_id, normalized_text)

        except Exception as e:
            logger.error("Error processing %s message: %s", message_type, e)
            await self.send_whatsapp_reply(
                from_number,
                "Sorry, I couldn't understand the audio. Please try again or type your expense.",
            )

    async def _process_expense_text(
        self, from_number: str, user_id: str, message_text: str
    ) -> None:
        from chatbot.service import get_chatbot_service

        chatbot = get_chatbot_service()
        chatbot_response = await chatbot.process_message(message_text, user_id)

        if chatbot_response.intent == "query":
            await self.send_whatsapp_reply(from_number, chatbot_response.answer)
            return

        if chatbot_response.intent == "greeting":
            await self.send_whatsapp_reply(from_number, chatbot_response.answer)
            return

        logger.info("Classifying expense text: %s", message_text)
        result = await self.classify_expense(message_text)

        if not result or result.get("category") is None:
            await self.send_whatsapp_reply(
                from_number,
                f'Sorry, I couldn\'t process that expense. You said: "{message_text}". Please try again.',
            )
            return

        category = result["category"]
        amount = result["amount"]
        dt = result.get("datetime")

        if not (
            dt
            and isinstance(dt, str)
            and len(dt) >= 10
            and dt[:4].isdigit()
            and dt[5:7].isdigit()
            and dt[8:10].isdigit()
        ):
            dt = datetime.now().strftime("%Y-%m-%d")

        description = result.get("description") or message_text

        try:
            if isinstance(amount, str):
                amount = float(amount.replace(",", "").strip())
        except Exception:
            pass

        if amount is None:
            await self.send_whatsapp_reply(
                from_number,
                f'Sorry, I couldn\'t extract the amount. You said: "{message_text}". Please try again with the amount.',
            )
            return

        try:
            await self.save_expense_to_neon(user_id, category, amount, dt, description)
            logger.info("Expense saved: %s - %s - %s - %s", category, amount, dt, description)

            amount_str = f"{float(amount):.2f}"
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
            logger.error("Error saving expense: %s", e)
            await self.send_whatsapp_reply(from_number, f"Error saving expense: {str(e)}")

    async def process_whatsapp_message(self, message: dict):
        from_number = None
        try:
            message_id = message.get("id")
            from_number = message.get("from")
            message_type = message.get("type")

            logger.info(
                "Processing WhatsApp message: id=%s, from=%s, type=%s",
                message_id,
                from_number,
                message_type,
            )

            user_id = await self.get_user_by_phone(from_number)
            if not user_id:
                await self.send_whatsapp_reply(
                    from_number,
                    "Sorry, your phone number is not registered. Please register first.",
                )
                return

            if message_type == "text":
                text_object = message.get("text", {})
                message_text = text_object.get("body", "")

                if not message_text:
                    logger.warning("Empty message text received")
                    return

                pending = voice_session_store.get_pending(from_number)
                if pending:
                    await self._handle_pending_confirmation(
                        from_number, user_id, message_text, pending
                    )
                    return

                logger.info("Message text: %s", message_text)
                await self._process_expense_text(from_number, user_id, message_text)
                return

            if message_type in ("audio", "voice"):
                await self._process_voice_message(from_number, user_id, message)
                return

            logger.info("Ignoring unsupported message type: %s", message_type)

        except Exception as e:
            logger.error("Error processing WhatsApp message: %s", e)
            if from_number:
                await self.send_whatsapp_reply(
                    from_number, f"Error processing your message: {str(e)}"
                )


whatsapp_service = WhatsAppService()
