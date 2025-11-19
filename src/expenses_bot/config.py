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

DATABASE_URL = os.getenv("DATABASE_URL")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))