import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes
)
from llm import classify_expense
from sheets import add_expense
from fixed_expenses import apply_fixed_expenses_for_month
import logging
from datetime import datetime, time as dtime
import time
from config import TELEGRAM_TOKEN, TELEGRAM_USER_ID, get_logger

#--------------------------------------------------------

logger = get_logger(__name__)
ALLOWED_USER_ID = TELEGRAM_USER_ID

#--------------------------------------------------------

def is_authorized(user_id) -> bool:
    return str(user_id) == str(ALLOWED_USER_ID)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming Telegram messages: classify and log expenses, reply with result or error."""
    text = update.message.text
    user = update.effective_user.username or update.effective_user.id
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    logger.info(f"Received message from {user}: {text} - {user_id} - {chat_id}")
    if not is_authorized(user_id):
        logger.warning(f"Unauthorized access attempt by user {user} (id={user_id})")
        await update.message.reply_text("Access denied. This bot is private.")
        return
    # Check if user is editing an expense
    editing_id = context.user_data.get("editing")
    if editing_id:
        # Expecting a message in the format: Category, Amount, Date, Description
        try:
            parts = [p.strip() for p in text.split(",", 3)]
            if len(parts) != 4:
                raise ValueError("Invalid format")
            category, amount, dt, description = parts
            # Optionally validate/parse amount and date here
            data = {
                "category": category,
                "amount": amount,
                "datetime": dt,
                "description": description
            }
            context.user_data[editing_id] = data
            del context.user_data["editing"]
            reply = (
                f"Category: {data['category']}\n"
                f"Amount: {data['amount']}\n"
                f"Datetime: {data['datetime']}\n"
                f"Description: {data['description']}"
            )
            keyboard = [
                [
                    InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_{editing_id}"),
                    InlineKeyboardButton("❌ Reject", callback_data=f"reject_{editing_id}"),
                    InlineKeyboardButton("✏️ Edit", callback_data=f"edit_{editing_id}")
                ]
            ]
            await update.message.reply_text(
                "✅ Updated! Please confirm, reject, or edit again:",
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        except Exception as e:
            await update.message.reply_text(
                "❌ Invalid format. Please send as:\n"
                "`Category, Amount, Date(YYYY-MM-DD), Description`",
                parse_mode="Markdown"
            )
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
            [
                InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_{data_id}"),
                InlineKeyboardButton("❌ Reject", callback_data=f"reject_{data_id}"),
                InlineKeyboardButton("✏️ Edit", callback_data=f"edit_{data_id}")
            ]
        ]
        logger.info(f"Replying to user {user}: {reply} (with confirmation and reject buttons)")
        await update.message.reply_text(reply, reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:
        logger.error(f"Error processing message from {user}: {e}")
        await update.message.reply_text("Sorry, I couldn't process your expense. Please try again.")

async def confirm_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data_id_full = query.data
    user = query.from_user.username or query.from_user.id
    user_id = query.from_user.id

    if data_id_full.startswith("confirm_"):
        data_id = data_id_full[len("confirm_"):]
        data = context.user_data.get(data_id)
        if not data:
            await query.answer()
            await query.edit_message_text("Error: No se encontró la información para guardar.")
            return
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
    elif data_id_full.startswith("reject_"):
        data_id = data_id_full[len("reject_"):]
        if data_id in context.user_data:
            del context.user_data[data_id]
        logger.info(f"Expense rejected by user {user}. Data ID: {data_id}")
        await query.answer()
        await query.edit_message_text("❌ Expense entry cancelled. Nothing was saved.")
    elif data_id_full.startswith("edit_"):
        data_id = data_id_full[len("edit_"):]
        data = context.user_data.get(data_id)
        if not data:
            await query.answer()
            await query.edit_message_text("Error: No data found to edit.")
            return
        # Mark this data_id as being edited
        context.user_data["editing"] = data_id
        await query.answer()
        await query.edit_message_text(
            "✏️ Please send the corrected expense in the format:\n"
            "`Category, Amount, Date(YYYY-MM-DD), Description`\n\n"
            f"Current: {data['category']}, {data['amount']}, {data['datetime']}, {data['description']}",
            parse_mode="Markdown"
        )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user.username or update.effective_user.id
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    logger.info(f"/start command received from {user} - {user_id} - {chat_id}")
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

async def run_fixed(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manually trigger fixed expenses for current month (owner only)."""
    user_id = update.effective_user.id
    if not is_authorized(user_id):
        await update.message.reply_text("Access denied.")
        return
    now = datetime.now()
    appended = apply_fixed_expenses_for_month(now.year, now.month)
    await update.message.reply_text(f"Fixed expenses processed. Appended: {appended}")

#--------------------------------------------------------

def main():
    """Start the Telegram bot."""

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("fixed", run_fixed))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(confirm_callback))

    async def monthly_fixed_job(ctx: ContextTypes.DEFAULT_TYPE):
        now = datetime.now()
        apply_fixed_expenses_for_month(now.year, now.month)

    if app.job_queue:
        app.job_queue.run_monthly(
            monthly_fixed_job,
            when=dtime(hour=0, minute=5),
            day=1
        )
    else:
        logging.warning(
            "JobQueue not available. Instala 'python-telegram-bot[job-queue]' para habilitar el scheduling."
        )
        
    now = datetime.now()
    if now.day == 1:
        apply_fixed_expenses_for_month(now.year, now.month)

    logging.info("Bot is running...")
    app.run_polling()

#--------------------------------------------------------

if __name__ == "__main__":
    main() 