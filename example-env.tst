# Google Sheets Configuration
GSHEETS_EMAIL=your_email@gmail.com
GSHEETS_SHEET_NAME=Expenses
GSHEETS_CREDENTIALS={"type": "service_account", "project_id": "...", ...}

# WhatsApp Business API Configuration
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# LLM Configuration
GEMINI_MODEL_BOT_EXPENSES=gemini-2.0-flash

# PostgreSQL / Neon Database Configuration
# DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Firebase Configuration (opcional)
# FIREBASE_CREDENTIALS={"type": "service_account", "project_id": "...", ...}

# Optional: Telegram (if migrating from Telegram bot)
# TELEGRAM_TOKEN_BOT_EXPENSES=your_telegram_bot_token
# TELEGRAM_USER_ID=your_telegram_user_id

# Optional: Cloudflare tunnel for local development
# CLOUDFLARED_CONFIG_PATH=/path/to/.cloudflared