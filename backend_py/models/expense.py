"""
Expense data models
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ExpenseCategory(str, Enum):
    """Expense categories enum"""
    FOOD = "Food"
    SUBSCRIPTION = "Subscription"
    TRANSPORT = "Transport"
    HOUSING = "Housing"
    SERVICES = "Services"
    HEALTH = "Health"
    EDUCATION = "Education"
    TECHNOLOGY = "Technology"
    SHOPPING = "Shopping"
    TRAVEL = "Travel"
    BAR_RESTAURANT = "Bar and restaurant"
    HOBBY = "Hobby"
    OTHER = "Other"
    UNCATEGORIZED = "Uncategorized"

class ExpenseBase(BaseModel):
    """Base expense model with common fields"""
    amount: float = Field(..., gt=0, description="Expense amount")
    category: str = Field(..., description="Expense category")
    description: str = Field(..., min_length=1, max_length=500, description="Expense description")
    date: datetime = Field(..., description="Expense date")
    currency: str = Field(default="EUR", description="Currency code (e.g., EUR, USD, ARS)")
    is_fixed: bool = Field(default=False, description="Whether this is a fixed/recurring expense")

class ExpenseCreate(ExpenseBase):
    """Model for creating a new expense"""
    pass

class ExpenseUpdate(BaseModel):
    """Model for updating an existing expense"""
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    date: Optional[datetime] = None
    currency: Optional[str] = Field(None, description="Currency code (e.g., EUR, USD, ARS)")
    is_fixed: Optional[bool] = None

class Expense(ExpenseBase):
    """Full expense model with ID and metadata"""
    id: str = Field(..., description="Unique expense ID")
    user_id: str = Field(..., description="User ID who created the expense")
    category_id: str = Field(..., description="Category ID")
    currency: str = Field(..., description="Currency code")
    created_at: datetime = Field(..., description="When the expense was created")
    updated_at: datetime = Field(..., description="When the expense was last updated")

    class Config:
        from_attributes = True

class FixedExpense(BaseModel):
    """Model for fixed/recurring expenses"""
    id: str = Field(..., description="Unique fixed expense ID")
    user_id: str = Field(..., description="User ID")
    category: ExpenseCategory = Field(..., description="Expense category")
    amount: float = Field(..., gt=0, description="Expense amount")
    description: str = Field(..., min_length=1, max_length=500, description="Expense description")
    day_of_month: int = Field(..., ge=1, le=31, description="Day of month to apply the expense")
    is_active: bool = Field(default=True, description="Whether the fixed expense is active")
    created_at: datetime = Field(..., description="When the fixed expense was created")
    updated_at: datetime = Field(..., description="When the fixed expense was last updated")

class ExpenseSummary(BaseModel):
    """Model for expense summary analytics"""
    total_amount: float = Field(..., description="Total expense amount")
    total_count: int = Field(..., description="Total number of expenses")
    average_amount: float = Field(..., description="Average expense amount")
    period: str = Field(..., description="Summary period (e.g., '2024-01')")
    category_breakdown: dict = Field(..., description="Breakdown by category")

class CategoryBreakdown(BaseModel):
    """Model for category breakdown analytics"""
    category: str = Field(..., description="Category name")
    amount: float = Field(..., description="Total amount for this category")
    count: int = Field(..., description="Number of expenses in this category")
    percentage: float = Field(..., description="Percentage of total expenses")
