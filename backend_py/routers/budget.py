"""
Budget router for API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from models.budget import Budget, BudgetCreate, BudgetUpdate
from models.user import User
from services.budget_service import BudgetService
from auth.firebase_auth import get_current_user_from_token

router = APIRouter()
budget_service = BudgetService()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from Firebase token"""
    token = credentials.credentials
    return await get_current_user_from_token(token)

@router.get("/budgets", response_model=List[Budget])
async def get_budgets(current_user: User = Depends(get_current_user)):
    """Get all budgets for the current user"""
    try:
        budgets = await budget_service.get_budgets(current_user.uid)
        return budgets
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budgets/summary")
async def get_budgets_summary(
    current_user: User = Depends(get_current_user),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000)
):
    """Get budgets with expenses and percentages for the specified month/year"""
    try:
        budgets_summary = await budget_service.get_budgets_with_expenses(
            current_user.uid, 
            month=month, 
            year=year
        )
        return budgets_summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/budgets", response_model=Budget)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new budget"""
    try:
        budget = await budget_service.create_budget(budget_data, current_user.uid)
        return budget
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(
    budget_id: str,
    budget_data: BudgetUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a budget"""
    try:
        budget = await budget_service.update_budget(budget_id, budget_data, current_user.uid)
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        return budget
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a budget"""
    try:
        success = await budget_service.delete_budget(budget_id, current_user.uid)
        if not success:
            raise HTTPException(status_code=404, detail="Budget not found")
        return {"message": "Budget deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/income")
async def get_income(current_user: User = Depends(get_current_user)):
    """Get user income"""
    try:
        income_data = await budget_service.get_user_income(current_user.uid)
        # Return in format expected by frontend: { income: number }
        return {
            "income": income_data.get("monthly_income", 0.0),
            "currency": income_data.get("currency", "EUR"),
            "user_id": income_data.get("user_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/income")
async def update_income(
    income_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update user income"""
    try:
        # Frontend sends { income: number }, convert to expected format
        update_data = {
            "monthly_income": income_data.get("income", income_data.get("monthly_income", 0.0)),
            "currency": income_data.get("currency", "EUR")
        }
        result = await budget_service.update_user_income(current_user.uid, update_data)
        # Return in format expected by frontend: { income: number }
        return {
            "income": result.get("monthly_income", 0.0),
            "currency": result.get("currency", "EUR"),
            "user_id": result.get("user_id")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/budgets/category/{category_key}")
async def get_budget_by_category(
    category_key: str,
    current_user: User = Depends(get_current_user)
):
    """Get budget for a specific category"""
    try:
        # Get all budgets and find the one for this category
        budgets = await budget_service.get_budgets(current_user.uid)
        budget = next((b for b in budgets if b.category_key == category_key), None)
        
        if budget:
            return budget
        else:
            return {
                "category": category_key,
                "amount": 0
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/budgets/category/{category_key}")
async def update_budget_by_category(
    category_key: str,
    budget_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Update or create budget for a specific category"""
    try:
        amount = budget_data.get("amount", 0.0)
        
        # Check if budget exists for this category
        budgets = await budget_service.get_budgets(current_user.uid)
        existing_budget = next((b for b in budgets if b.category_key == category_key), None)
        
        if existing_budget:
            # Update existing budget
            budget_update = BudgetUpdate(amount=amount)
            budget = await budget_service.update_budget(existing_budget.id, budget_update, current_user.uid)
            if not budget:
                raise HTTPException(status_code=404, detail="Budget not found")
            return budget
        else:
            # Create new budget
            budget_create = BudgetCreate(category_key=category_key, amount=amount)
            budget = await budget_service.create_budget(budget_create, current_user.uid)
            return budget
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

