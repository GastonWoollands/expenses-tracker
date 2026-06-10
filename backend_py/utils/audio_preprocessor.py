"""
Audio preprocessing for Whisper transcription.
"""

import logging
import subprocess

logger = logging.getLogger(__name__)


def preprocess_audio_to_wav(input_path: str, output_path: str) -> None:
    """
    Convert input audio to 16 kHz mono WAV optimized for Whisper.

    Raises:
        FileNotFoundError: ffmpeg is not installed
        subprocess.CalledProcessError: ffmpeg conversion failed
    """
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        input_path,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-af",
        "highpass=f=80,lowpass=f=8000,loudnorm",
        "-c:a",
        "pcm_s16le",
        output_path,
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)


def is_ffmpeg_available() -> bool:
    """Return True if ffmpeg is available on PATH."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            check=True,
            capture_output=True,
            text=True,
        )
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False
