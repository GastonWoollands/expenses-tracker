"""
Audio transcription utility using Whisper
"""

import os
import tempfile
import logging
from typing import Optional
from functools import lru_cache
import whisper

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_whisper_model(model_name: str = "base") -> whisper.Whisper:
    """
    Load and cache the Whisper model.
    
    Args:
        model_name: Whisper model name (tiny, base, small, medium, large)
                    Defaults to 'base' for faster processing
    
    Returns:
        Loaded Whisper model
    """
    try:
        logger.info(f"Loading Whisper model: {model_name}")
        model = whisper.load_model(model_name)
        logger.info(f"Whisper model {model_name} loaded successfully")
        return model
    except Exception as e:
        logger.error(f"Failed to load Whisper model {model_name}: {e}")
        raise


def transcribe_audio_file(
    audio_path: str,
    language: Optional[str] = "es",
    model_name: str = "base"
) -> str:
    """
    Transcribe an audio file using Whisper.
    
    Args:
        audio_path: Path to the audio file
        language: Language code (e.g., 'es' for Spanish, 'en' for English)
                  If None, Whisper will auto-detect
        model_name: Whisper model name to use
    
    Returns:
        Transcribed text
    """
    try:
        model = get_whisper_model(model_name)
        logger.info(f"Transcribing audio file: {audio_path}")
        
        result = model.transcribe(audio_path, language=language)
        text = result.get("text", "").strip()
        
        logger.info(f"Transcription successful: {text[:100]}...")
        return text
    except Exception as e:
        logger.error(f"Failed to transcribe audio file {audio_path}: {e}")
        raise


def transcribe_audio_bytes(
    audio_bytes: bytes,
    language: Optional[str] = "es",
    model_name: str = "base",
    file_extension: str = ".ogg"
) -> str:
    """
    Transcribe audio from bytes using Whisper.
    
    Args:
        audio_bytes: Audio file content as bytes
        language: Language code (e.g., 'es' for Spanish, 'en' for English)
        model_name: Whisper model name to use
        file_extension: File extension for temporary file (e.g., '.ogg', '.mp3', '.wav')
    
    Returns:
        Transcribed text
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name
        
        try:
            text = transcribe_audio_file(temp_path, language=language, model_name=model_name)
            return text
        finally:
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {temp_path}: {e}")
    except Exception as e:
        logger.error(f"Failed to transcribe audio bytes: {e}")
        raise

