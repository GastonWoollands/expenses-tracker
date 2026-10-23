# Expenses Tracker

A modern web application for tracking personal expenses with Firebase authentication, built with FastAPI backend and React frontend.

## Features

- **User Authentication**: Secure Firebase-based user registration and login
- **Expense Management**: Add, edit, delete, and categorize expenses
- **Smart Classification**: AI-powered expense categorization using Gemini
- **Analytics Dashboard**: Visual insights into spending patterns
- **Local Storage**: PostgreSQL (Neon) via the FastAPI backend
- **Responsive Design**: Clean, minimalist UI that works on all devices

## Architecture

- **Backend** (`backend_py/`): FastAPI REST API with PostgreSQL (Neon) storage, deployed on Railway via the root `Dockerfile`
- **Frontend** (`frontend/`): React TypeScript application, deployed on Vercel

## Quick Start

### Backend Setup
Python dependencies are managed with Poetry (`pyproject.toml` at the repo root).
```bash
poetry install
cd backend_py
cp env.example .env
# Edit .env with your configuration
poetry run python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env
# Edit .env with your Firebase configuration
npm run dev
```

## Documentation

- **Backend**: see [backend_py/README.md](backend_py/README.md)
- **Frontend**: see [frontend/README.md](frontend/README.md)
