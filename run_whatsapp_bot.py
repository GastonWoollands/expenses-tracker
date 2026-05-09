#!/usr/bin/env python3
"""
Run the Neon-backed FastAPI app (same as Docker / backend_py/run.py webhook).

Uses backend_py/main:app so WhatsApp saves expenses to Postgres, not Google Sheets.
"""

import os
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parent
    backend_dir = repo_root / "backend_py"

    sys.path.insert(0, str(backend_dir))
    os.chdir(backend_dir)

    env_backend = backend_dir / ".env"
    if env_backend.exists():
        load_dotenv(env_backend)
    load_dotenv(repo_root / ".env")

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    workers = int(os.getenv("WORKERS", "1"))

    print(f"Starting expenses API + WhatsApp on {host}:{port} (workers={workers})")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        reload=os.getenv("RELOAD", "false").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
