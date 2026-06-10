"""
In-memory store for pending voice expense confirmations.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from config.transcription import VOICE_CONFIRMATION_TTL_SECONDS, AFFIRMATIVE_REPLIES


@dataclass
class PendingVoiceExpense:
    user_id: str
    raw_transcription: str
    normalized_text: str
    avg_logprob: Optional[float]
    created_at: datetime


class VoiceSessionStore:
    """Tracks pending voice transcriptions awaiting user confirmation."""

    def __init__(self, ttl_seconds: int = VOICE_CONFIRMATION_TTL_SECONDS):
        self._ttl = timedelta(seconds=ttl_seconds)
        self._pending: dict[str, PendingVoiceExpense] = {}

    def set_pending(self, phone: str, session: PendingVoiceExpense) -> None:
        self._pending[phone] = session

    def get_pending(self, phone: str) -> Optional[PendingVoiceExpense]:
        session = self._pending.get(phone)
        if session is None:
            return None
        if self._is_expired(session):
            self.clear(phone)
            return None
        return session

    def clear(self, phone: str) -> None:
        self._pending.pop(phone, None)

    def _is_expired(self, session: PendingVoiceExpense) -> bool:
        return datetime.now() - session.created_at > self._ttl


def is_affirmative_reply(text: str) -> bool:
    """Return True if the user is confirming a pending transcription."""
    normalized = text.strip().lower().rstrip(".!?,;:")
    return normalized in AFFIRMATIVE_REPLIES


voice_session_store = VoiceSessionStore()
