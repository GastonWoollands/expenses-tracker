"""
User data models
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class User(BaseModel):
    """User model for Firebase authentication"""
    uid: str = Field(..., description="Firebase user ID")
    email: str = Field(..., description="User email")
    name: Optional[str] = Field(None, description="User first name")
    surname: Optional[str] = Field(None, description="User last name")
    phone_number: Optional[str] = Field(None, description="User phone number (unique)")
    display_name: Optional[str] = Field(None, description="User display name")
    photo_url: Optional[str] = Field(None, description="User photo URL")
    email_verified: bool = Field(default=False, description="Whether email is verified")
    created_at: datetime = Field(..., description="When the user was created")
    last_sign_in: Optional[datetime] = Field(None, description="Last sign in time")

class UserProfile(BaseModel):
    """Extended user profile model"""
    uid: str = Field(..., description="Firebase user ID")
    email: str = Field(..., description="User email")
    display_name: Optional[str] = Field(None, description="User display name")
    photo_url: Optional[str] = Field(None, description="User photo URL")
    preferences: dict = Field(default_factory=dict, description="User preferences")
    created_at: datetime = Field(..., description="When the user was created")
    last_sign_in: Optional[datetime] = Field(None, description="Last sign in time")
    total_expenses: float = Field(default=0.0, description="Total expenses amount")
    total_expenses_count: int = Field(default=0, description="Total number of expenses")

class UserUpdate(BaseModel):
    """User update model for profile updates"""
    name: Optional[str] = Field(None, description="User first name")
    surname: Optional[str] = Field(None, description="User last name")
    phone_number: Optional[str] = Field(None, description="User phone number (unique)")
    email: Optional[str] = Field(None, description="User email")

class UserPreferences(BaseModel):
    """User preferences model"""
    default_currency: str = Field(default="USD", description="Default currency")
    date_format: str = Field(default="YYYY-MM-DD", description="Preferred date format")
    theme: str = Field(default="light", description="UI theme preference")
    notifications: bool = Field(default=True, description="Enable notifications")
    monthly_budget: Optional[float] = Field(None, description="Monthly budget limit")
    categories: list = Field(default_factory=list, description="Preferred expense categories")
