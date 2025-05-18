import os
import json
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, MessageHandler, ContextTypes, filters, CommandHandler, CallbackQueryHandler
from llm import classify_expense
from sheets import add_expense
import logging
from datetime import datetime
import time

#--------------------------------------------------------

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN_BOT_EXPENSES")
logger = logging.getLogger(__name__)
ALLOWED_USER_ID = os.getenv("TELEGRAM_USER_ID")

#--------------------------------------------------------

def is_authorized(user_id) -> bool:
    return str(user_id) == str(ALLOWED_USER_ID)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming Telegram messages: classify and log expenses, reply with result or error."""
    text = update.message.text
    user = update.effective_user.username or update.effective_user.id
    user_id = update.effective_user.id
    logger.info(f"Received message from {user}: {text}")
    if not is_authorized(user_id):
        logger.warning(f"Unauthorized access attempt by user {user} (id={user_id})")
        await update.message.reply_text("Access denied. This bot is private.")
        return
    try:
        result = classify_expense(text)
        logger.info(f"LLM result for user {user}: {result}")
        if not result or result.get("category") is None:
            raise ValueError("LLM did not return a valid result.")
        # Use current date if datetime is invalid or None
        dt = result.get("datetime")
        if not (isinstance(dt, str) and len(dt) >= 10 and dt[:4].isdigit() and dt[5:7].isdigit() and dt[8:10].isdigit()):
            dt = datetime.now().strftime("%Y-%m-%d")
        description = result.get("description") or text
        # Prepare data for confirmation
        data = {
            "category": result["category"],
            "amount": result["amount"],
            "datetime": dt,
            "description": description
        }
        # Genera un ID único
        data_id = str(int(time.time() * 1000))
        context.user_data[data_id] = data
        reply = (
            f"Category: {data['category']}\n"
            f"Amount: {data['amount']}\n"
            f"Datetime: {data['datetime']}\n"
            f"Description: {data['description']}"
        )
        keyboard = [
            [InlineKeyboardButton("✅ Confirm", callback_data=data_id)]
        ]
        logger.info(f"Replying to user {user}: {reply} (with confirmation button)")
        await update.message.reply_text(reply, reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:
        logger.error(f"Error processing message from {user}: {e}")
        await update.message.reply_text("Sorry, I couldn't process your expense. Please try again.")

async def confirm_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data_id = query.data
    data = context.user_data.get(data_id)
    if not data:
        await query.answer()
        await query.edit_message_text("Error: No se encontró la información para guardar.")
        return
    user = query.from_user.username or query.from_user.id
    user_id = query.from_user.id
    if not is_authorized(user_id):
        logger.warning(f"Unauthorized callback attempt by user {user} (id={user_id})")
        await query.answer()
        await query.edit_message_text("Access denied. This bot is private.")
        return
    try:
        add_expense(data["category"], data["amount"], data["datetime"], data["description"])
        logger.info(f"Expense confirmed and saved for user {user}: {data}")
        await query.answer()
        await query.edit_message_text(
            f"✅ Saved to Google Sheets!\n\n"
            f"Category: {data['category']}\n"
            f"Amount: {data['amount']}\n"
            f"Datetime: {data['datetime']}\n"
            f"Description: {data['description']}"
        )
        # Limpia el dato después de usarlo
        del context.user_data[data_id]
    except Exception as e:
        logger.error(f"Error saving confirmed expense for user {user}: {e}")
        await query.answer()
        await query.edit_message_text("Error: Could not save expense to Google Sheets.")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user.username or update.effective_user.id
    user_id = update.effective_user.id
    logger.info(f"/start command received from {user}")
    if not is_authorized(user_id):
        logger.warning(f"Unauthorized /start attempt by user {user} (id={user_id})")
        await update.message.reply_text("Access denied. This bot is private.")
        return
    welcome_message = (
        "👋 *Welcome to Expenses Bot!*\n\n"
        "Easily track your expenses by sending me your Apple Pay receipts or any expense message.\n\n"
        "*How to use:*\n"
        "- Just send a payment notification or a message like `Bought coffee for 3.50 on 2024-06-01`.\n"
        "- I will automatically categorize, extract the amount and date, and log it to your Google Sheet.\n\n"
        "*Features:*\n"
        "- 📊 Automatic expense categorization\n"
        "- 🗂️ Google Sheets integration\n"
        "- 🤖 Works with Apple Pay and plain text\n\n"
        "Type or forward your first expense to get started!"
    )
    logger.info(f"Replying to user {user} with welcome message.")
    await update.message.reply_text(welcome_message, parse_mode="Markdown")

#--------------------------------------------------------

def main():
    """Start the Telegram bot."""
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(confirm_callback))
    logger.info("Bot is running...")
    app.run_polling()

#--------------------------------------------------------

if __name__ == "__main__":
    main() 