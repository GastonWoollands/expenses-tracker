# Expenses Tracker

A modern web application for tracking personal expenses with Firebase authentication, built with FastAPI backend and React frontend.

## 🚀 Features

- **User Authentication**: Secure Firebase-based user registration and login
- **Expense Management**: Add, edit, delete, and categorize expenses
- **Smart Classification**: AI-powered expense categorization using Gemini
- **Analytics Dashboard**: Visual insights into spending patterns
- **Local Storage**: SQLite database with optional Google Sheets sync
- **Responsive Design**: Clean, minimalist UI that works on all devices

## 🏗️ Architecture

The project follows a clean separation of concerns:

- **Backend** (`backend_py/`): FastAPI-based REST API with SQLite storage
- **Frontend** (`frontend/`): React TypeScript application
- **Legacy Bot** (`src/expenses_bot/`): Original Telegram bot (deprecated)

## 🚀 Quick Start

### Backend Setup
```bash
cd backend_py
pip install -r requirements.txt
cp env.example .env
# Edit .env with your configuration
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env
# Edit .env with your Firebase configuration
npm run dev
```

## 📖 Documentation

- **New Web App**: See [README_NEW.md](README_NEW.md) for complete setup instructions
- **Legacy Bot**: The original Telegram bot code is preserved in `src/expenses_bot/`

## 🔄 Migration

This project has been migrated from a Telegram bot to a full web application while preserving all original functionality:

- ✅ AI-powered expense classification
- ✅ Google Sheets integration
- ✅ Fixed/recurring expenses
- ✅ Multi-user support (new)
- ✅ Web-based interface (new)
- ✅ Advanced analytics (new)

---

*The web application provides all the functionality of the original Telegram bot with additional features and a modern user interface.*
