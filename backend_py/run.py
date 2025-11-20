#!/usr/bin/env python3
"""
Run script for the Expenses Tracker Backend API
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    # Railway provides PORT environment variable
    railway_port = os.getenv("PORT")
    if railway_port:
        port = int(railway_port)
    
    print(f"Starting Expenses Tracker API on {host}:{port}")
    print(f"Reload mode: {reload}")
    print(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT', 'development')}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
