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

REQUIRED_VARS = [
    "TELEGRAM_TOKEN_BOT_EXPENSES",
    "TELEGRAM_USER_ID",
    "GSHEETS_SHEET_NAME",
    "GSHEETS_EMAIL",
    "GEMINI_MODEL_BOT_EXPENSES"
]

missing = [var for var in REQUIRED_VARS if os.getenv(var) is None]
if missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN_BOT_EXPENSES")
TELEGRAM_USER_ID = os.getenv("TELEGRAM_USER_ID")
GSHEETS_SHEET_NAME = os.getenv("GSHEETS_SHEET_NAME")
GSHEETS_EMAIL = os.getenv("GSHEETS_EMAIL")
GEMINI_MODEL_BOT_EXPENSES = os.getenv("GEMINI_MODEL_BOT_EXPENSES")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GSHEETS_CREDENTIALS = os.path.join(BASE_DIR, 'credentials', 'expenses-bot-460118-2b5525e241d9.json')