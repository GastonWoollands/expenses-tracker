"""
User service for managing user profiles
"""

from typing import Optional, Dict, Any
from database.neon_client import get_neon
from models.user import User, UserUpdate
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service for user profile operations"""
    
    def __init__(self):
        self._neon = None
    
    @property
    def neon(self):
        """Get Neon client (lazy loading)"""
        if self._neon is None:
            self._neon = get_neon()
        return self._neon
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by ID"""
        try:
            user = await self.neon.fetchrow(
                """SELECT id, email, name, surname, phone_number, created_at 
                   FROM users WHERE id = $1""",
                user_id
            )
            
            if user:
                return {
                    "uid": str(user["id"]),
                    "email": user.get("email", ""),
                    "name": user.get("name"),
                    "surname": user.get("surname"),
                    "phone_number": user.get("phone_number"),
                    "created_at": user.get("created_at")
                }
            return None
        except Exception as e:
            logger.error(f"Failed to get user profile: {str(e)}")
            raise
    
    async def update_user_profile(self, user_id: str, user_update: UserUpdate) -> Optional[Dict[str, Any]]:
        """Update user profile"""
        try:
            # Helper function to normalize values
            def normalize_value(value: Optional[str]) -> Optional[str]:
                """Convert empty/whitespace strings to None"""
                if value is None:
                    return None
                stripped = value.strip()
                return stripped if stripped else None
            
            # Check if phone_number is being updated and if it's already taken
            # Only check uniqueness if phone_number is not None and not empty
            normalized_phone = normalize_value(user_update.phone_number) if user_update.phone_number is not None else None
            if normalized_phone:
                existing_user = await self.neon.fetchrow(
                    "SELECT id FROM users WHERE phone_number = $1 AND id != $2",
                    normalized_phone, user_id
                )
                if existing_user:
                    raise ValueError("Phone number already exists")
            
            # Build update query dynamically
            # Convert empty strings to None (NULL in database)
            
            updates = {}
            if user_update.name is not None:
                updates["name"] = normalize_value(user_update.name)
            if user_update.surname is not None:
                updates["surname"] = normalize_value(user_update.surname)
            if user_update.phone_number is not None:
                updates["phone_number"] = normalize_value(user_update.phone_number)
            if user_update.email is not None:
                updates["email"] = normalize_value(user_update.email)
            
            if not updates:
                # No updates to make, return current profile
                return await self.get_user_profile(user_id)
            
            # Build SET clauses
            set_clauses = []
            values = []
            param_index = 1
            
            for field, value in updates.items():
                set_clauses.append(f"{field} = ${param_index}")
                values.append(value)
                param_index += 1
            
            values.append(user_id)  # Add user_id for WHERE clause
            query = f"""
                UPDATE users 
                SET {', '.join(set_clauses)} 
                WHERE id = ${param_index}
                RETURNING id, email, name, surname, phone_number, created_at
            """
            
            updated_user = await self.neon.fetchrow(query, *values)
            
            if updated_user:
                return {
                    "uid": str(updated_user["id"]),
                    "email": updated_user.get("email", ""),
                    "name": updated_user.get("name"),
                    "surname": updated_user.get("surname"),
                    "phone_number": updated_user.get("phone_number"),
                    "created_at": updated_user.get("created_at")
                }
            return None
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to update user profile: {str(e)}")
            raise


# Global instance
user_service = UserService()

