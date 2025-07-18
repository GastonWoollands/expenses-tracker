from telethon import TelegramClient
import os
from dotenv import load_dotenv

load_dotenv()

api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")

SESSION_NAME = "user_session"

client = TelegramClient(SESSION_NAME, api_id, api_hash)

async def main():
    await client.start()
    print(">>> Session started and saved")

with client:
    client.loop.run_until_complete(main())
