"""
Chatbot API router for expense queries.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from chatbot.service import get_chatbot_service
from models.user import User
from auth.firebase_auth import get_current_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chatbot", tags=["chatbot"])
security = HTTPBearer()


class ChatMessage(BaseModel):
    """Chat message model."""
    user: str
    bot: str


class QueryRequest(BaseModel):
    """Request model for chatbot query."""
    question: str = Field(..., min_length=1, max_length=500)
    history: Optional[List[ChatMessage]] = None


class QueryResponse(BaseModel):
    """Response model for chatbot query."""
    answer: str
    intent: str
    should_log_expense: bool = False
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify Firebase token and return user data."""
    try:
        token = credentials.credentials
        if not token:
            raise HTTPException(
                status_code=401,
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
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/query", response_model=QueryResponse)
async def query_expenses(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Process natural language query about expenses.
    
    This endpoint accepts a question in natural language and returns
    information about the user's expenses.
    """
    logger.info(f"Chatbot query from user {current_user.uid[:8]}: {request.question[:50]}...")
    
    try:
        chatbot = get_chatbot_service()
        
        history = None
        if request.history:
            history = [{"user": msg.user, "bot": msg.bot} for msg in request.history]
        
        response = await chatbot.process_message(
            text=request.question,
            user_id=current_user.uid,
            history=history,
        )
        
        return QueryResponse(
            answer=response.answer,
            intent=response.intent,
            should_log_expense=response.should_log_expense,
            data=response.data,
            error=response.error,
        )
        
    except Exception as e:
        logger.error(f"Chatbot query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
