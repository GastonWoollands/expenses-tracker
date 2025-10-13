"""
Supabase authentication service
"""

from typing import Dict, Any, Optional
from supabase import Client
from database.supabase_client import get_supabase_admin
from models.user import User
import logging

logger = logging.getLogger(__name__)

class SupabaseAuthService:
    """Supabase authentication service"""
    
    def __init__(self):
        self.client: Client = get_supabase_admin()
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Supabase JWT token and return user data
        
        Args:
            token: Supabase JWT token
            
        Returns:
            Dict containing user data
            
        Raises:
            Exception: If token is invalid
        """
        try:
            # Verify the JWT token
            response = self.client.auth.get_user(token)
            user = response.user
            
            if not user:
                raise Exception("Invalid token")
            
            # Get user profile from database
            user_profile = await self._get_user_profile(user.id)
            
            # If user doesn't exist in our database, create them
            if not user_profile:
                logger.info(f"Creating new user profile for {user.id}")
                user_data = {
                    "uid": user.id,
                    "email": user.email or "",
                    "display_name": user.user_metadata.get("display_name") or user.user_metadata.get("full_name") or "",
                    "photo_url": user.user_metadata.get("avatar_url") or "",
                    "email_verified": user.email_confirmed_at is not None,
                    "created_at": user.created_at,
                    "last_sign_in": user.last_sign_in_at
                }
                await self.create_user_profile(user_data)
                user_profile = await self._get_user_profile(user.id)
            
            return {
                "uid": user.id,
                "email": user.email or "",
                "display_name": user.user_metadata.get("display_name") or user_profile.get("display_name") or user.user_metadata.get("full_name") or "",
                "photo_url": user.user_metadata.get("avatar_url") or user_profile.get("photo_url") or "",
                "email_verified": user.email_confirmed_at is not None,
                "created_at": user.created_at,
                "last_sign_in": user.last_sign_in_at
            }
            
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise Exception(f"Invalid token: {str(e)}")
    
    async def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile from database"""
        try:
            result = self.client.table("users").select("*").eq("id", user_id).execute()
            if result.data:
                return result.data[0]
            return {}
        except Exception as e:
            logger.warning(f"Could not fetch user profile: {str(e)}")
            return {}
    
    async def create_user_profile(self, user_data: Dict[str, Any]) -> bool:
        """Create user profile in database"""
        try:
            data = {
                "id": user_data["uid"],  # Use Supabase auth user ID directly
                "email": user_data["email"],
                "display_name": user_data.get("display_name", ""),  # Use correct column name
                "photo_url": user_data.get("photo_url", ""),
                "email_verified": user_data.get("email_verified", False),
                "is_active": True
            }
            
            # Use upsert to handle case where user already exists
            result = self.client.table("users").upsert(data).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to create user profile: {str(e)}")
            return False
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile in database"""
        try:
            result = (self.client.table("users")
                     .update(updates)
                     .eq("id", user_id)
                     .execute())
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to update user profile: {str(e)}")
            return False

# Global instance
supabase_auth_service = SupabaseAuthService()
