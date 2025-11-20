import os
from dotenv import load_dotenv
import logging

# Centralized logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)

def get_logger(name=None):
    return logging.getLogger(name)

load_dotenv()

# Do not hard-fail on import. Sheets code will validate when used.
REQUIRED_VARS = [
    "GSHEETS_EMAIL",
    "GSHEETS_CREDENTIALS",
]

missing = [var for var in REQUIRED_VARS if os.getenv(var) is None]
if missing:
    logging.getLogger(__name__).warning(
        "Missing env vars at startup (will be required when using Sheets): %s",
        ", ".join(missing),
    )

# TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN_BOT_EXPENSES")
# TELEGRAM_USER_ID = os.getenv("TELEGRAM_USER_ID")
GSHEETS_SHEET_NAME = os.getenv("GSHEETS_SHEET_NAME", "Expenses")
GSHEETS_EMAIL = os.getenv("GSHEETS_EMAIL")
GEMINI_MODEL_BOT_EXPENSES = os.getenv("GEMINI_MODEL_BOT_EXPENSES", "gemini-2.0-flash")
GSHEETS_CREDENTIALS = os.getenv("GSHEETS_CREDENTIALS")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))