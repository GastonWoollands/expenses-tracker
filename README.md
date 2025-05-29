# Expenses Tracker Bot

A private Telegram bot to help you log and categorize your expenses directly into Google Sheets. Powered by LLM-based classification and Google Sheets integration.

## Features

- 📊 Automatic expense categorization (LLM-powered)
- 🗂️ Google Sheets integration for logging expenses
- 🤖 Works with Apple Pay receipts and plain text messages
- 🔒 Private: Only authorized users can access

## Usage

1. **Start the Bot**  
   Run the bot with:
   ```bash
   poetry run python src/expenses_bot/bot.py
   ```
   or use your preferred method to start the script.

2. **Interact on Telegram**  
   - Send your Apple Pay receipt or any expense message (e.g., `Bought coffee for 3.50 on 2024-06-01`).
   - The bot will extract the category, amount, date, and description.
   - Confirm, reject, or edit the extracted data using the provided buttons.
   - Upon confirmation, the expense is logged to your Google Sheet.

3. **Edit or Correct**  
   - Use the "✏️ Edit" button to correct any field before saving.

## Setup

- Configure your Telegram bot token and user ID in `src/expenses_bot/config.py` or via environment variables.
- Set up Google Sheets credentials as described in the code comments.

## Security

- Only the user ID specified in the config can use the bot. Unauthorized users will be denied access.

---

*For more details, see the code in `src/expenses_bot/`.*
