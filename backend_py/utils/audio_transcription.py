"""
Audio transcription utility using Whisper.
"""

import os
import tempfile
import logging
from dataclasses import dataclass, field
from typing import Optional
from functools import lru_cache

import whisper

from config.transcription import (
    WHISPER_MODEL,
    WHISPER_LANGUAGE,
    WHISPER_INITIAL_PROMPT,
    WHISPER_CONFIDENCE_THRESHOLD,
)
from utils.audio_preprocessor import preprocess_audio_to_wav, is_ffmpeg_available

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class TranscriptionSegment:
    start: float
    end: float
    text: str
    avg_logprob: float
    no_speech_prob: float


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str
    model_name: str
    segments: list[TranscriptionSegment] = field(default_factory=list)
    avg_logprob: Optional[float] = None
    is_low_confidence: bool = False
    preprocessed: bool = False

    @property
    def confidence_label(self) -> str:
        return "low" if self.is_low_confidence else "ok"


@lru_cache(maxsize=1)
def get_whisper_model(model_name: str = WHISPER_MODEL) -> whisper.Whisper:
    """Load and cache the Whisper model."""
    try:
        logger.info("Loading Whisper model: %s", model_name)
        model = whisper.load_model(model_name)
        logger.info("Whisper model %s loaded successfully", model_name)
        return model
    except Exception as e:
        logger.error("Failed to load Whisper model %s: %s", model_name, e)
        raise


def _build_transcribe_options(language: Optional[str]) -> dict:
    opts: dict = {
        "temperature": 0,
        "condition_on_previous_text": False,
        "initial_prompt": WHISPER_INITIAL_PROMPT,
        "fp16": False,
    }
    if language:
        opts["language"] = language
    return opts


def _parse_result(raw: dict, model_name: str, language: str, preprocessed: bool) -> TranscriptionResult:
    segments = [
        TranscriptionSegment(
            start=s["start"],
            end=s["end"],
            text=s.get("text", "").strip(),
            avg_logprob=s.get("avg_logprob", 0.0),
            no_speech_prob=s.get("no_speech_prob", 0.0),
        )
        for s in raw.get("segments", [])
    ]
    avg_logprob = (
        sum(s.avg_logprob for s in segments) / len(segments) if segments else None
    )
    is_low_confidence = (
        avg_logprob is not None and avg_logprob < WHISPER_CONFIDENCE_THRESHOLD
    )
    return TranscriptionResult(
        text=raw.get("text", "").strip(),
        language=language,
        model_name=model_name,
        segments=segments,
        avg_logprob=avg_logprob,
        is_low_confidence=is_low_confidence,
        preprocessed=preprocessed,
    )


def _log_transcription_result(result: TranscriptionResult) -> None:
    logger.info(
        "Transcription complete model=%s language=%s confidence=%s avg_logprob=%s "
        "preprocessed=%s segments=%s text_preview=%r",
        result.model_name,
        result.language,
        result.confidence_label,
        result.avg_logprob,
        result.preprocessed,
        len(result.segments),
        result.text[:120],
    )


def transcribe_audio_file(
    audio_path: str,
    language: Optional[str] = None,
    model_name: str = WHISPER_MODEL,
    preprocessed: bool = False,
) -> TranscriptionResult:
    """Transcribe an audio file using Whisper."""
    resolved_language = language or WHISPER_LANGUAGE or "es"
    try:
        model = get_whisper_model(model_name)
        logger.info("Transcribing audio file: %s", audio_path)

        raw = model.transcribe(
            audio_path,
            **_build_transcribe_options(language or WHISPER_LANGUAGE or None),
        )
        result = _parse_result(raw, model_name, resolved_language, preprocessed)
        _log_transcription_result(result)

        if not result.text:
            raise ValueError("Empty transcription result")

        return result
    except Exception as e:
        logger.error("Failed to transcribe audio file %s: %s", audio_path, e)
        raise


def _prepare_audio_path(input_path: str) -> tuple[str, bool, list[str]]:
    """
    Optionally preprocess audio to WAV. Returns (path_for_whisper, preprocessed, temp_paths).
    """
    temp_paths: list[str] = []

    if not is_ffmpeg_available():
        logger.warning("ffmpeg not available; transcribing raw audio without preprocessing")
        return input_path, False, temp_paths

    wav_path = tempfile.mktemp(suffix=".wav")
    temp_paths.append(wav_path)
    try:
        preprocess_audio_to_wav(input_path, wav_path)
        return wav_path, True, temp_paths
    except Exception as e:
        logger.warning("Audio preprocessing failed, using raw audio: %s", e)
        for path in temp_paths:
            try:
                os.unlink(path)
            except OSError:
                pass
        return input_path, False, []


def transcribe_audio_bytes(
    audio_bytes: bytes,
    language: Optional[str] = None,
    model_name: str = WHISPER_MODEL,
    file_extension: str = ".ogg",
) -> TranscriptionResult:
    """Transcribe audio from bytes using Whisper."""
    input_path = None
    extra_temp_paths: list[str] = []

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(audio_bytes)
            input_path = temp_file.name

        whisper_path, preprocessed, extra_temp_paths = _prepare_audio_path(input_path)

        return transcribe_audio_file(
            whisper_path,
            language=language,
            model_name=model_name,
            preprocessed=preprocessed,
        )
    except Exception as e:
        logger.error("Failed to transcribe audio bytes: %s", e)
        raise
    finally:
        for path in [input_path, *extra_temp_paths]:
            if not path:
                continue
            try:
                os.unlink(path)
            except OSError as e:
                logger.warning("Failed to delete temporary file %s: %s", path, e)
