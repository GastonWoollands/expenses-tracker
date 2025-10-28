#!/usr/bin/env python3
"""
WhatsApp Expenses Bot Runner
Deploy the WhatsApp backend server
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))
    
    print(f"Starting WhatsApp Expenses Bot on {host}:{port}")
    print(f"Workers: {workers}")
    
    # Start the server
    uvicorn.run(
        "expenses_bot.backend_:app",
        host=host,
        port=port,
        workers=workers,
        reload=os.getenv("RELOAD", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
