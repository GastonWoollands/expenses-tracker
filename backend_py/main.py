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
from services.sheets_service import SheetsService
from services.llm_service import LLMService
from services.category_service import category_service
from services.truelayer_service import TrueLayerService
from models.expense import Expense, ExpenseCreate, ExpenseUpdate
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
truelayer_service = TrueLayerService()

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

# Initialize default categories on startup
@app.on_event("startup")
async def startup_event():
    await category_service.initialize_default_categories()

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

# TrueLayer endpoints
@app.get("/api/truelayer/auth/link")
async def get_truelayer_auth_link(
    current_user: User = Depends(get_current_user)
):
    """
    Get TrueLayer OAuth authorization URL
    
    Workflow:
    1. Backend generates OAuth URL with state=user_id
    2. Frontend redirects user to this URL
    3. User logs in at TrueLayer and selects their bank (sandbox or live)
       - This happens on TrueLayer's page, NOT in our frontend
       - TrueLayer handles the bank selection internally
    4. TrueLayer redirects to /truelayer/callback with code and state
    5. Backend exchanges code for tokens and saves them
    6. Frontend can then list accounts and transactions (but NOT banks)
    
    IMPORTANT: The frontend NEVER calls login-api.truelayer-sandbox.com/providers.
    Bank selection is handled entirely by TrueLayer during the OAuth flow.
    """
    try:
        auth_url = truelayer_service.get_auth_url(state=current_user.uid)
        logger.info(f"Generated OAuth URL for user {current_user.uid[:10]}...")
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Error generating auth link: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/truelayer/callback")
async def truelayer_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Handle TrueLayer OAuth callback
    
    This endpoint receives the redirect from TrueLayer after:
    1. User logged in at TrueLayer
    2. User selected their bank (handled by TrueLayer, not our frontend)
    3. User authorized our app
    
    Flow:
    - TrueLayer redirects here with code and state (user_id)
    - Backend exchanges code for tokens using client_secret
    - Tokens are saved to database
    - Backend redirects to frontend with success/error
    
    IMPORTANT: 
    - This endpoint does NOT require authentication (TrueLayer redirects without token)
    - The state parameter contains the user_id (Firebase UID)
    - Bank selection happens on TrueLayer's side, not here
    """
    from fastapi.responses import HTMLResponse
    
    # Get frontend URL for redirect
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    
    if error:
        logger.error(f"TrueLayer callback error: {error}")
        # Return HTML that redirects to frontend with error
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="2;url={frontend_url}/truelayer/callback?error={error}">
            <title>TrueLayer Authorization</title>
        </head>
        <body>
            <p>Authorization failed: {error}</p>
            <p>Redirecting...</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)
    
    if not code:
        logger.error("TrueLayer callback: No code received")
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="2;url={frontend_url}/truelayer/callback?error=no_code">
            <title>TrueLayer Authorization</title>
        </head>
        <body>
            <p>No authorization code received</p>
            <p>Redirecting...</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)
    
    if not state:
        logger.error("TrueLayer callback: No state (user_id) received")
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="2;url={frontend_url}/truelayer/callback?error=no_state">
            <title>TrueLayer Authorization</title>
        </head>
        <body>
            <p>No user state received</p>
            <p>Redirecting...</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)
    
    # State contains the user_id (Firebase UID)
    user_id = state
    
    try:
        # Exchange code for tokens (this uses client_secret securely on backend)
        result = await truelayer_service.exchange_code_for_tokens(code, user_id)
        logger.info(f"TrueLayer: Successfully saved tokens for user {user_id[:10]}...")
        
        # Return HTML that redirects to frontend with success
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="2;url={frontend_url}/truelayer/callback?success=true">
            <title>TrueLayer Authorization</title>
        </head>
        <body>
            <p>Bank account connected successfully!</p>
            <p>Redirecting...</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)
        
    except Exception as e:
        logger.error(f"Error in TrueLayer callback: {e}")
        error_msg = str(e).replace('"', '&quot;')
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="2;url={frontend_url}/truelayer/callback?error={error_msg}">
            <title>TrueLayer Authorization</title>
        </head>
        <body>
            <p>Error: {error_msg}</p>
            <p>Redirecting...</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)

@app.get("/api/truelayer/status")
async def get_truelayer_status(
    current_user: User = Depends(get_current_user)
):
    """Check if user has connected TrueLayer"""
    try:
        is_connected = await truelayer_service.is_connected(current_user.uid)
        return {"connected": is_connected}
    except Exception as e:
        logger.error(f"Error checking status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/truelayer/accounts")
async def get_truelayer_accounts(
    current_user: User = Depends(get_current_user)
):
    """
    Get user's bank accounts from TrueLayer
    
    This endpoint returns the accounts that were connected during OAuth.
    The bank selection happened during the OAuth flow on TrueLayer's side.
    
    IMPORTANT: This does NOT return a list of available banks.
    Bank selection is handled by TrueLayer during OAuth, not by our API.
    """
    try:
        accounts = await truelayer_service.get_accounts(current_user.uid)
        return {"accounts": accounts}
    except Exception as e:
        logger.error(f"Error fetching accounts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/truelayer/accounts/{account_id}/transactions")
async def get_truelayer_transactions(
    account_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get transactions for a specific account"""
    try:
        transactions = await truelayer_service.get_transactions(
            current_user.uid,
            account_id,
            from_date,
            to_date
        )
        return {"transactions": transactions}
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/truelayer/sync")
async def sync_truelayer_transactions(
    account_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Sync transactions from TrueLayer, categorize with LLM, and save to database"""
    try:
        from utils.llm_classifier import classify_expense
        from datetime import datetime, timedelta
        
        # Get accounts if account_id not provided
        if not account_id:
            accounts = await truelayer_service.get_accounts(current_user.uid)
            if not accounts:
                return {"message": "No accounts found", "synced": 0}
            account_id = accounts[0]["account_id"]
        
        # Get transactions
        transactions = await truelayer_service.get_transactions(
            current_user.uid,
            account_id,
            from_date,
            to_date
        )
        
        synced_count = 0
        errors = []
        
        for tx in transactions:
            try:
                # Only process debit transactions (expenses)
                if tx.get("transaction_type") != "debit":
                    continue
                
                # Extract transaction data
                amount = abs(float(tx.get("amount", 0)))
                description = tx.get("description", "Unknown transaction")
                transaction_date = tx.get("timestamp", datetime.utcnow().isoformat())
                
                # Use LLM to classify the transaction
                classification = classify_expense(description)
                category = classification.get("category", "Uncategorized")
                
                # Create expense
                expense_data = ExpenseCreate(
                    amount=amount,
                    category=category,
                    description=description,
                    date=transaction_date,
                    currency=tx.get("currency", "EUR")
                )
                
                await expense_service.create_expense(expense_data, current_user.uid)
                synced_count += 1
                
            except Exception as e:
                logger.error(f"Error processing transaction {tx.get('transaction_id')}: {e}")
                errors.append(str(e))
        
        return {
            "message": f"Synced {synced_count} transactions",
            "synced": synced_count,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        logger.error(f"Error syncing transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/truelayer/disconnect")
async def disconnect_truelayer(
    current_user: User = Depends(get_current_user)
):
    """Disconnect TrueLayer integration"""
    try:
        await truelayer_service.disconnect(current_user.uid)
        return {"message": "Disconnected successfully"}
    except Exception as e:
        logger.error(f"Error disconnecting: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
