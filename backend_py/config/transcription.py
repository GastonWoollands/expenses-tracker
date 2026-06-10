"""
Transcription configuration for WhatsApp voice messages.
"""

import os

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "es")
WHISPER_INITIAL_PROMPT = os.getenv(
    "WHISPER_INITIAL_PROMPT",
    "Registro de gastos en español. Gasté 25 euros en supermercado. "
    "Compré café en Starbucks. Transporte Uber.",
)
WHISPER_CONFIDENCE_THRESHOLD = float(os.getenv("WHISPER_CONFIDENCE_THRESHOLD", "-0.7"))

VOICE_CONFIRMATION_ENABLED = os.getenv("VOICE_CONFIRMATION_ENABLED", "true").lower() == "true"
VOICE_CONFIRMATION_TTL_SECONDS = int(os.getenv("VOICE_CONFIRMATION_TTL_SECONDS", "600"))

AFFIRMATIVE_REPLIES = frozenset(
    {"si", "sí", "yes", "ok", "vale", "correcto", "confirmo", "confirmar", "guardar"}
)
