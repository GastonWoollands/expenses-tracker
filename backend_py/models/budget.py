"""
Budget models for database and API
"""

from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Create Base for budget models
Base = declarative_base()

class BudgetDB(Base):
    """Budget database model"""
    __tablename__ = "budgets"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    category_key = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    

class UserIncomeDB(Base):
    """User income database model"""
    __tablename__ = "user_income"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True, unique=True)
    monthly_income = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    

# Pydantic models for API
class BudgetBase(BaseModel):
    category_key: str
    amount: float

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None

class Budget(BudgetBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserIncome(BaseModel):
    user_id: str
    monthly_income: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
