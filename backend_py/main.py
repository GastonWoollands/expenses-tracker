"""
Expenses Tracker Backend API
FastAPI backend with Supabase authentication and database
"""

from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
load_dotenv()

# Updated imports for Supabase
from auth.supabase_auth import supabase_auth_service
from services.expense_service_supabase import ExpenseService
from services.sheets_service import SheetsService
from services.llm_service import LLMService
from services.category_service_supabase import category_service
from models.expense import Expense, ExpenseCreate, ExpenseUpdate
from models.user import User
from routers.budget import router as budget_router

# Load environment variables

# Initialize FastAPI app
app = FastAPI(
    title="Expenses Tracker API",
    description="Backend API for expenses tracking with Supabase authentication",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
def preflight(rest_of_path: str):
    return Response(status_code=200)

# Security
security = HTTPBearer()

# Initialize services
expense_service = ExpenseService()
sheets_service = SheetsService()
llm_service = LLMService()

# Include routers
app.include_router(budget_router, prefix="/api/v1", tags=["budgets"])

# Initialize default categories on startup
@app.on_event("startup")
async def startup_event():
    await category_service.initialize_default_categories()

# Updated dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase token and return user data"""
    try:
        token = credentials.credentials
        user_data = await supabase_auth_service.verify_token(token)
        return User(**user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "expenses-tracker-api"}

# Authentication endpoints
@app.post("/auth/verify")
async def verify_token(user: User = Depends(get_current_user)):
    """Verify if the provided token is valid"""
    return {"valid": True, "user": user}

# Category endpoints
@app.get("/categories", response_model=List[dict])
async def get_categories():
    """Get all active categories"""
    try:
        categories = await category_service.get_all_categories(active_only=True)
        return [
            {
                "id": cat.id,
                "key": cat.key,
                "name": cat.name,
                "description": cat.description,
                "sort_order": cat.sort_order
            } for cat in categories
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/categories", response_model=dict)
async def create_category(
    category_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new category (admin only)"""
    try:
        from services.category_service_supabase import CategoryCreate
        category = await category_service.create_category(CategoryCreate(**category_data))
        return {
            "id": category.id,
            "key": category.key,
            "name": category.name,
            "description": category.description,
            "sort_order": category.sort_order
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/categories/{category_id}", response_model=dict)
async def update_category(
    category_id: str,
    category_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update a category (admin only)"""
    try:
        from services.category_service_supabase import CategoryUpdate
        category = await category_service.update_category(category_id, CategoryUpdate(**category_data))
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return {
            "id": category.id,
            "key": category.key,
            "name": category.name,
            "description": category.description,
            "sort_order": category.sort_order
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Expense endpoints
@app.post("/expenses", response_model=Expense)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new expense entry"""
    try:
        # Use LLM to classify the expense if description is provided
        if expense_data.description and not expense_data.category:
            classification = await llm_service.classify_expense(expense_data.description)
            expense_data.category = classification.get("category", "Uncategorized")
        
        # Create expense with user ID
        expense = await expense_service.create_expense(expense_data, current_user.uid)
        
        # Add to Google Sheets (optional)
        if sheets_service.enabled:
            await sheets_service.add_expense(expense, current_user.uid)
        
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/expenses", response_model=List[Expense])
async def get_expenses(
    current_user: User = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0
):
    """Get user's expenses with pagination"""
    try:
        expenses = await expense_service.get_user_expenses(
            current_user.uid, 
            limit=limit, 
            offset=offset
        )
        return expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense by ID"""
    try:
        expense = await expense_service.get_expense(expense_id, current_user.uid)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing expense"""
    try:
        expense = await expense_service.update_expense(
            expense_id, 
            expense_data, 
            current_user.uid
        )
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Update in Google Sheets (optional)
        if sheets_service.enabled:
            await sheets_service.update_expense(expense, current_user.uid)
        
        return expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an expense"""
    try:
        success = await expense_service.delete_expense(expense_id, current_user.uid)
        if not success:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        # Remove from Google Sheets (optional)
        if sheets_service.enabled:
            await sheets_service.delete_expense(expense_id, current_user.uid)
        
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoints
@app.get("/analytics/summary")
async def get_expense_summary(
    current_user: User = Depends(get_current_user),
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Get expense summary for analytics"""
    try:
        summary = await expense_service.get_expense_summary(
            current_user.uid, 
            month=month, 
            year=year
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/categories")
async def get_category_breakdown(
    current_user: User = Depends(get_current_user),
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Get expense breakdown by category"""
    try:
        breakdown = await expense_service.get_category_breakdown(
            current_user.uid, 
            month=month, 
            year=year
        )
        return breakdown
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fixed expenses endpoints
@app.get("/fixed-expenses")
async def get_fixed_expenses(current_user: User = Depends(get_current_user)):
    """Get user's fixed expenses"""
    try:
        fixed_expenses = await expense_service.get_fixed_expenses(current_user.uid)
        return fixed_expenses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fixed-expenses")
async def create_fixed_expense(
    fixed_expense: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new fixed expense"""
    try:
        result = await expense_service.create_fixed_expense(fixed_expense, current_user.uid)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
