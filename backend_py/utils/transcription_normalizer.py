"""
LLM-based cleanup for voice transcription before expense classification.
"""

import logging
from functools import lru_cache

from agno.agent import Agent
from agno.models.google import Gemini

from config.transcription import WHISPER_LANGUAGE
from utils.llm_classifier import GEMINI_MODEL

logger = logging.getLogger(__name__)


def _get_normalize_prompt(text: str) -> str:
    language_hint = "español" if WHISPER_LANGUAGE == "es" else "the detected language"
    return f"""
You clean short expense dictation transcripts from speech recognition.

Rules:
- Fix obvious ASR errors (spelling, missing accents, wrong words).
- Convert Spanish number words to digits when clearly amounts (veinte → 20).
- Keep merchant names as close to the original as possible.
- Do NOT invent amounts, dates, or categories not implied by the text.
- If unsure about a word, keep the original.
- The text is likely in {language_hint}.
- Output ONLY the corrected sentence, no JSON, no explanation.

Transcript:
{text}
"""


@lru_cache(maxsize=1)
def _get_normalizer_agent() -> Agent:
    return Agent(model=Gemini(id=GEMINI_MODEL), markdown=True)


def normalize_expense_transcription(raw_text: str) -> str:
    """
    Repair voice-to-text artifacts before intent detection and classification.

    On failure, returns the original text unchanged.
    """
    text = (raw_text or "").strip()
    if not text:
        return text

    try:
        agent = _get_normalizer_agent()
        response = agent.run(_get_normalize_prompt(text))
        normalized = (response.content or "").strip()
        if not normalized:
            return text

        logger.info("Transcription normalized: raw=%r normalized=%r", text[:120], normalized[:120])
        return normalized
    except Exception as e:
        logger.warning("Transcription normalization failed, using raw text: %s", e)
        return text
