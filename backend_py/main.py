"""
Expenses Tracker Backend API
FastAPI backend with Firebase authentication and Neon PostgreSQL database
"""

from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()  # Try loading from current directory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Updated imports for Firebase and Neon
from auth.firebase_auth import firebase_auth_service, get_current_user_from_token
from services.expense_service import ExpenseService
from services.fixed_expense_service import FixedExpenseService
from services.sheets_service import SheetsService
from services.llm_service import LLMService
from services.category_service import category_service
from models.expense import Expense, ExpenseCreate, ExpenseUpdate, FixedExpense, FixedExpenseCreate, FixedExpenseUpdate
from models.user import User, UserUpdate
from routers.budget import router as budget_router
from routers.whatsapp import router as whatsapp_router
from services.user_service import user_service

# Load environment variables

# Initialize FastAPI app
app = FastAPI(
    title="Expenses Tracker API",
    description="Backend API for expenses tracking with Firebase authentication and Neon PostgreSQL",
    version="1.0.0"
)

def get_cors_origins() -> List[str]:
    """Get CORS allowed origins from environment"""
    origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
    origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
    logger.info(f"CORS allowed origins: {origins}")
    return origins

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.options("/{rest_of_path:path}")
def preflight(rest_of_path: str):
    return Response(status_code=200)

# Security
security = HTTPBearer()

# Initialize services
expense_service = ExpenseService()
fixed_expense_service = FixedExpenseService()
sheets_service = SheetsService()
llm_service = LLMService()

# Include routers
app.include_router(budget_router, prefix="/api/v1", tags=["budgets"])
app.include_router(whatsapp_router)

from fastapi import Request, BackgroundTasks
import json
import os
from services.whatsapp_service import whatsapp_service

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")

@app.get("/webhook")
async def webhook_verify(request: Request):
    """WhatsApp webhook verification endpoint (without /whatsapp prefix)"""
    query_params = request.query_params
    
    mode = query_params.get("hub.mode")
    token = query_params.get("hub.verify_token")
    challenge = query_params.get("hub.challenge")
    
    logger.info(f"WhatsApp verification request: mode={mode}")
    
    if mode and token and mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully")
        return int(challenge)
    else:
        logger.warning("WhatsApp verification failed")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verification failed"
        )

async def process_messages_background(data: dict):
    """Background task to process WhatsApp messages"""
    entries = data.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            
            for message in messages:
                message_id = message.get("id")
                if message_id and whatsapp_service.is_message_processed(message_id):
                    logger.info(f"Message {message_id} already processed, skipping")
                    continue
                
                # Mark as processed immediately to prevent duplicates
                if message_id:
                    whatsapp_service.mark_message_processed(message_id)
                
                try:
                    await whatsapp_service.process_whatsapp_message(message)
                except Exception as e:
                    logger.error(f"Error processing message {message_id}: {e}")

@app.post("/webhook")
async def webhook_receive(request: Request, background_tasks: BackgroundTasks):
    """WhatsApp webhook receive endpoint (without /whatsapp prefix)"""
    try:
        try:
            raw_body = await request.body()
        except Exception:
            raw_body = b""

        if not raw_body:
            logger.info("Webhook POST received with empty body; acknowledging")
            return {"status": "ok", "detail": "empty body"}

        try:
            data = json.loads(raw_body)
        except Exception:
            logger.info("Webhook POST received with non-JSON body; acknowledging")
            return {"status": "ignored", "detail": "invalid json"}

        logger.info("WhatsApp webhook received")
        
        if data.get("object") != "whatsapp_business_account":
            logger.info("Ignoring non-WhatsApp webhook")
            return {"status": "ignored"}
        
        # Process messages in background to return 200 OK quickly
        # This prevents WhatsApp from retrying the webhook
        background_tasks.add_task(process_messages_background, data)
        
        # Return 200 OK immediately to prevent WhatsApp retries
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"status": "error", "detail": str(e)}

# Connection Pool Lifecycle
@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool, default categories, and scheduler"""
    from database.neon_client import get_neon
    neon = get_neon()
    await neon.get_pool()  # Initialize pool
    logger.info("Database connection pool initialized")
    await category_service.initialize_default_categories()
    
    # Start scheduler for automatic fixed expenses application
    from services.scheduler_service import scheduler_service
    await scheduler_service.start()
    # Apply current month on startup if needed
    await scheduler_service.apply_current_month_if_needed()

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection pool and shutdown scheduler"""
    # Shutdown scheduler first
    from services.scheduler_service import scheduler_service
    await scheduler_service.shutdown()
    
    # Close database connection pool
    from database.neon_client import get_neon
    neon = get_neon()
    await neon.close_pool()
    logger.info("Database connection pool closed")

# Updated dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase token and return user data"""
    try:
        token = credentials.credentials
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await get_current_user_from_token(token)
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
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

# User profile endpoints
@app.get("/api/v1/users/me", response_model=User)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    try:
        profile = await user_service.get_user_profile(current_user.uid)
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Merge with current user data
        return User(
            uid=profile["uid"],
            email=profile.get("email", current_user.email),
            name=profile.get("name"),
            surname=profile.get("surname"),
            phone_number=profile.get("phone_number"),
            display_name=current_user.display_name,
            photo_url=current_user.photo_url,
            email_verified=current_user.email_verified,
            created_at=profile.get("created_at") or current_user.created_at,
            last_sign_in=current_user.last_sign_in
        )
    except Exception as e:
        logger.error(f"Failed to get user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/users/me", response_model=User)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    try:
        updated_profile = await user_service.update_user_profile(current_user.uid, user_update)
        if not updated_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Merge with current user data
        return User(
            uid=updated_profile["uid"],
            email=updated_profile.get("email", current_user.email),
            name=updated_profile.get("name"),
            surname=updated_profile.get("surname"),
            phone_number=updated_profile.get("phone_number"),
            display_name=current_user.display_name,
            photo_url=current_user.photo_url,
            email_verified=current_user.email_verified,
            created_at=updated_profile.get("created_at") or current_user.created_at,
            last_sign_in=current_user.last_sign_in
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
        # Add user_id to category data
        category_data["user_id"] = current_user.uid
        category = await category_service.create_category(category_data)
        return {
            "id": category.id,
            "key": category.key,
            "name": category.name,
            "description": category.description,
            "type": category.type,
            "icon": category.icon
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
        category = await category_service.update_category(category_id, category_data)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return {
            "id": category.id,
            "key": category.key,
            "name": category.name,
            "description": category.description,
            "type": category.type,
            "icon": category.icon
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
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get user's expenses with pagination and optional date filtering"""
    try:
        from datetime import datetime, timezone
        start = None
        end = None
        
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                start = datetime.fromisoformat(start_date)
            # Ensure timezone-aware
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                end = datetime.fromisoformat(end_date)
            # Ensure timezone-aware
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
        
        expenses = await expense_service.get_user_expenses(
            current_user.uid, 
            limit=limit, 
            offset=offset,
            start_date=start,
            end_date=end
        )
        return expenses
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
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
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    expense_type: Optional[str] = None,
    categories: Optional[str] = None,  # Comma-separated list
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None
):
    """Get expense breakdown by category"""
    try:
        from datetime import datetime, timezone
        start = None
        end = None
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                start = datetime.fromisoformat(start_date)
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                end = datetime.fromisoformat(end_date)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
        
        category_list = None
        if categories:
            category_list = [c.strip() for c in categories.split(',') if c.strip()]
        
        breakdown = await expense_service.get_category_breakdown(
            current_user.uid,
            start_date=start,
            end_date=end,
            expense_type=expense_type,
            categories=category_list,
            min_amount=min_amount,
            max_amount=max_amount
        )
        return breakdown
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/trends")
async def get_expense_trends(
    current_user: User = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    expense_type: Optional[str] = None,  # 'fixed', 'variable', or None for all
    categories: Optional[str] = None,  # Comma-separated list
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None
):
    """Get monthly spending trends over time"""
    try:
        from datetime import datetime, timezone
        start = None
        end = None
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                start = datetime.fromisoformat(start_date)
            # Ensure timezone-aware
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                end = datetime.fromisoformat(end_date)
            # Ensure timezone-aware
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
        
        category_list = None
        if categories:
            category_list = [c.strip() for c in categories.split(',') if c.strip()]
        
        trends = await expense_service.get_expense_trends(
            current_user.uid,
            start_date=start,
            end_date=end,
            expense_type=expense_type,
            categories=category_list,
            min_amount=min_amount,
            max_amount=max_amount
        )
        return trends
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting expense trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/patterns")
async def get_spending_patterns(
    current_user: User = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    expense_type: Optional[str] = None,  # 'fixed', 'variable', or None for all
    categories: Optional[str] = None,  # Comma-separated list
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None
):
    """Get spending patterns by day of week and time of month"""
    try:
        from datetime import datetime, timezone
        start = None
        end = None
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                start = datetime.fromisoformat(start_date)
            # Ensure timezone-aware
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                end = datetime.fromisoformat(end_date)
            # Ensure timezone-aware
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
        
        category_list = None
        if categories:
            category_list = [c.strip() for c in categories.split(',') if c.strip()]
        
        patterns = await expense_service.get_spending_patterns(
            current_user.uid,
            start_date=start,
            end_date=end,
            expense_type=expense_type,
            categories=category_list,
            min_amount=min_amount,
            max_amount=max_amount
        )
        return patterns
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting spending patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/top-categories")
async def get_top_categories_with_trends(
    current_user: User = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    expense_type: Optional[str] = None,  # 'fixed', 'variable', or None for all
    categories: Optional[str] = None,  # Comma-separated list
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    limit: int = 10
):
    """Get top categories with trend indicators"""
    try:
        from datetime import datetime, timezone
        start = None
        end = None
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                start = datetime.fromisoformat(start_date)
            # Ensure timezone-aware
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                end = datetime.fromisoformat(end_date)
            # Ensure timezone-aware
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
        
        category_list = None
        if categories:
            category_list = [c.strip() for c in categories.split(',') if c.strip()]
        
        top_categories = await expense_service.get_top_categories_with_trends(
            current_user.uid,
            start_date=start,
            end_date=end,
            expense_type=expense_type,
            categories=category_list,
            min_amount=min_amount,
            max_amount=max_amount,
            limit=limit
        )
        return top_categories
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting top categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/fixed-vs-variable")
async def get_fixed_vs_variable_comparison(
    current_user: User = Depends(get_current_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[str] = None,  # Comma-separated list
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None
):
    """Get comparison of fixed vs variable expenses"""
    try:
        from datetime import datetime, timezone
        start = None
        end = None
        if start_date:
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                start = datetime.fromisoformat(start_date)
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
        if end_date:
            try:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                end = datetime.fromisoformat(end_date)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
        
        category_list = None
        if categories:
            category_list = [c.strip() for c in categories.split(',') if c.strip()]
        
        comparison = await expense_service.get_fixed_vs_variable_comparison(
            current_user.uid,
            start_date=start,
            end_date=end,
            categories=category_list,
            min_amount=min_amount,
            max_amount=max_amount
        )
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting fixed vs variable comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Fixed expenses endpoints
@app.get("/api/v1/fixed-expenses", response_model=List[dict])
async def get_fixed_expenses(current_user: User = Depends(get_current_user)):
    """Get user's fixed expenses"""
    try:
        fixed_expenses = await fixed_expense_service.get_fixed_expenses(current_user.uid)
        return fixed_expenses
    except Exception as e:
        logger.error(f"Error getting fixed expenses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/fixed-expenses/{fixed_expense_id}", response_model=dict)
async def get_fixed_expense(
    fixed_expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific fixed expense by ID"""
    try:
        fixed_expense = await fixed_expense_service.get_fixed_expense(fixed_expense_id, current_user.uid)
        if not fixed_expense:
            raise HTTPException(status_code=404, detail="Fixed expense not found")
        return fixed_expense
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fixed expense: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/fixed-expenses", response_model=dict)
async def create_fixed_expense(
    fixed_expense_data: FixedExpenseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new fixed expense"""
    try:
        result = await fixed_expense_service.create_fixed_expense(
            fixed_expense_data.dict(), 
            current_user.uid
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating fixed expense: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/fixed-expenses/{fixed_expense_id}", response_model=dict)
async def update_fixed_expense(
    fixed_expense_id: str,
    fixed_expense_data: FixedExpenseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing fixed expense"""
    try:
        result = await fixed_expense_service.update_fixed_expense(
            fixed_expense_id,
            fixed_expense_data.dict(exclude_unset=True),
            current_user.uid
        )
        if not result:
            raise HTTPException(status_code=404, detail="Fixed expense not found")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating fixed expense: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/fixed-expenses/{fixed_expense_id}")
async def delete_fixed_expense(
    fixed_expense_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a fixed expense (soft delete - sets is_active=false)"""
    try:
        success = await fixed_expense_service.delete_fixed_expense(fixed_expense_id, current_user.uid)
        if not success:
            raise HTTPException(status_code=404, detail="Fixed expense not found")
        return {"message": "Fixed expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting fixed expense: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/fixed-expenses/apply/{year}/{month}")
async def apply_fixed_expenses_for_month(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user)
):
    """Manually apply fixed expenses for a specific month/year"""
    try:
        if month < 1 or month > 12:
            raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        if year < 2000 or year > 2100:
            raise HTTPException(status_code=400, detail="Year must be between 2000 and 2100")
        
        count = await fixed_expense_service.apply_fixed_expenses_for_month(current_user.uid, year, month)
        return {
            "message": f"Applied {count} fixed expense(s) for {year}-{month:02d}",
            "count": count,
            "year": year,
            "month": month
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying fixed expenses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
