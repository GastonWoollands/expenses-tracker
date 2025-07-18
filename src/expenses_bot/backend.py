import os
from fastapi import FastAPI, Request, HTTPException, status, Depends
from pydantic import BaseModel
from telethon import TelegramClient
# from dotenv import load_dotenv

# load_dotenv()

API_TOKEN = os.getenv("API_TOKEN")
TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_SESSION = os.getenv("TELEGRAM_SESSION", "/app/user_session.session")
TELEGRAM_TARGET = os.getenv("TELEGRAM_TARGET")

assert API_TOKEN, "API_TOKEN is not set"
assert TELEGRAM_API_ID, "TELEGRAM_API_ID is not set"
assert TELEGRAM_API_HASH, "TELEGRAM_API_HASH is not set"
assert TELEGRAM_TARGET, "TELEGRAM_TARGET is not set"

app = FastAPI()
client = TelegramClient(TELEGRAM_SESSION, TELEGRAM_API_ID, TELEGRAM_API_HASH)

class TransactionMessage(BaseModel):
    message: str

async def verify_token(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or auth != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API token.")

@app.on_event("startup")
async def startup_event():
    await client.start()

@app.on_event("shutdown")
async def shutdown_event():
    await client.disconnect()

@app.post("/send_transaction")
async def send_transaction(
    data: TransactionMessage,
    _: None = Depends(verify_token)
):
    try:
        await client.send_message(TELEGRAM_TARGET, data.message)
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@app.get("/ping")
async def ping():
    return {"status": "pong"}

@app.on_event("startup")
async def print_routes():
    print("Routes available:")
    for route in app.routes:
        print(f"{route.path} - {route.methods}")
