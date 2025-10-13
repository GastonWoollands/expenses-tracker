# Expenses Tracker Backend

A FastAPI-based backend for personal expense tracking with Firebase authentication, AI-powered expense classification.

## 📁 Project Structure

```
backend_py/
├── main.py                 # FastAPI application entry point
├── run.py                  # Application runner
├── requirements.txt        # Python dependencies
├── env.example            # Environment variables template
├── Procfile               # Railway deployment config
├── railway.json           # Railway service config
│
├── models/                # Data models
│   ├── user.py           # User authentication models
│   ├── expense.py       # Expense data models
│   └── budget.py         # Budget management models
│
├── services/             # Business logic layer
│   ├── expense_service.py    # Expense CRUD operations
│   ├── budget_service.py     # Budget management
│   ├── category_service.py   # Category management
│   ├── llm_service.py        # AI expense classification
│   └── sheets_service.py     # Google Sheets integration
│
├── routers/              # API route handlers
│   └── budget.py         # Budget endpoints
│
├── auth/                 # Authentication
│   └── firebase_auth.py  # Firebase token verification
│
├── config/               # Configuration
│   └── categories.py     # Expense categories definition
│
└── *.db                  # SQLite database files
```

## 🗄️ Database Schema

### Core Entities

**Users** (`User` model)
- Firebase-authenticated users
- Stores: `uid`, `email`, `display_name`, `photo_url`, `email_verified`

**Expenses** (`ExpenseDB` table)
- Core expense records
- Fields: `id`, `user_id`, `amount`, `category`, `description`, `date`, `is_fixed`
- Links to categories via `category_id`

**Categories** (`CategoryDB` table)
- Predefined expense categories
- Fields: `id`, `key`, `name`, `description`, `is_active`, `sort_order`
- 13 default categories: Food, Subscription, Transport, Housing, etc.

**Budgets** (`BudgetDB` table)
- User-defined budget limits per category
- Fields: `id`, `user_id`, `category_key`, `amount`

**User Income** (`UserIncomeDB` table)
- Monthly income tracking
- Fields: `id`, `user_id`, `monthly_income`

## 🔄 Service Layer Architecture

### Core Services

**ExpenseService**
- CRUD operations for expenses
- Analytics: summaries, category breakdowns
- Fixed expense management

**BudgetService**
- Budget CRUD operations
- Income management
- Category-based budget tracking

**CategoryService**
- Category management
- Default category initialization
- Category validation

**LLMService** (Optional)
- AI-powered expense classification
- Uses Google Gemini for smart categorization
- Processes expense descriptions

**SheetsService** (Optional)
- Google Sheets integration
- Automatic expense syncing
- Backup and export functionality

## 🛡️ Authentication Flow

```
Client Request → Firebase Token → verify_firebase_token() → User Model → Protected Endpoint
```

1. Client sends Firebase ID token in `Authorization: Bearer <token>` header
2. `get_current_user()` dependency verifies token
3. Returns authenticated `User` object
4. Endpoints use `current_user: User = Depends(get_current_user)`

## 🚀 API Endpoints

### Authentication
- `POST /auth/verify` - Verify Firebase token

### Expenses
- `POST /expenses` - Create expense (with AI classification)
- `GET /expenses` - List user expenses (paginated)
- `GET /expenses/{id}` - Get specific expense
- `PUT /expenses/{id}` - Update expense
- `DELETE /expenses/{id}` - Delete expense

### Analytics
- `GET /analytics/summary` - Expense summary by period
- `GET /analytics/categories` - Category breakdown

### Categories
- `GET /categories` - List all categories
- `POST /categories` - Create category (admin)
- `PUT /categories/{id}` - Update category (admin)

### Budgets (`/api/v1/budgets`)
- `GET /budgets` - List user budgets
- `POST /budgets` - Create budget
- `PUT /budgets/{id}` - Update budget
- `DELETE /budgets/{id}` - Delete budget
- `GET /budgets/category/{key}` - Get budget by category
- `PUT /budgets/category/{key}` - Update budget by category

### Income
- `GET /income` - Get user income
- `PUT /income` - Update user income

## 🔧 Environment Setup

Required environment variables (see `env.example`):

```bash
# Database
DATABASE_URL=sqlite:///./expenses.db

# Firebase Authentication
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
# OR
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}

# Optional: AI Classification
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_BOT_EXPENSES=gemini-2.0-flash

# Optional: Google Sheets Integration
GSHEETS_CREDENTIALS=/path/to/sheets-credentials.json
GSHEETS_SHEET_NAME=Expenses Tracker
GSHEETS_EMAIL=your-email@example.com
```

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Run the application**
   ```bash
   python run.py
   # OR
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **Access API documentation**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## 🔄 Data Flow

```
Client → FastAPI → Service Layer → Database
                ↓
            Optional: AI Classification
                ↓
            Optional: Google Sheets Sync
```

## 📊 Key Features

- **Firebase Authentication** - Secure user management
- **AI-Powered Classification** - Automatic expense categorization
- **Budget Management** - Category-based budget tracking
- **Analytics** - Expense summaries and breakdowns
- **Google Sheets Integration** - Optional data export
- **Fixed Expenses** - Recurring expense management
- **RESTful API** - Clean, documented endpoints

## 🛠️ Development

The backend follows a clean architecture pattern:
- **Models**: Data structures and validation
- **Services**: Business logic and data access
- **Routers**: API endpoint definitions
- **Auth**: Authentication and authorization
- **Config**: Application configuration

Each service is self-contained and can be easily tested or modified independently.
