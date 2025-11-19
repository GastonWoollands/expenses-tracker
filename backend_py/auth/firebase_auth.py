"""
Firebase authentication service
"""

from typing import Dict, Any, Optional
import firebase_admin
from firebase_admin import credentials, auth
from models.user import User
import logging
import os
import json

logger = logging.getLogger(__name__)

class FirebaseAuthService:
    """Firebase authentication service"""
    
    _initialized = False
    
    def __init__(self):
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        if FirebaseAuthService._initialized:
            return
        
        try:
            try:
                firebase_admin.get_app()
                logger.warning("Firebase Admin SDK already initialized")
                FirebaseAuthService._initialized = True
                return
            except ValueError:
                pass
            
            firebase_credentials_guita = os.getenv("FIREBASE_CREDENTIALS_GUITA")
            firebase_credentials_legacy = os.getenv("FIREBASE_CREDENTIALS")
            firebase_credentials = firebase_credentials_guita or firebase_credentials_legacy
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            
            if firebase_credentials:
                env_var_name = "FIREBASE_CREDENTIALS_GUITA" if firebase_credentials_guita else "FIREBASE_CREDENTIALS"
                try:
                    cred_dict = json.loads(firebase_credentials)
                    project_id = cred_dict.get('project_id', 'unknown')
                    cred = credentials.Certificate(cred_dict)
                    
                    if project_id != 'guita-fa387':
                        logger.error(f"Firebase project ID mismatch: expected 'guita-fa387', got '{project_id}'")
                        logger.error("Set FIREBASE_CREDENTIALS_GUITA with correct project credentials")
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON in {env_var_name}: {e}")
                    raise ValueError(f"Invalid JSON in {env_var_name}: {e}")
            elif cred_path:
                if not os.path.exists(cred_path):
                    raise FileNotFoundError(f"Firebase credentials file not found: {cred_path}")
                cred = credentials.Certificate(cred_path)
                # Try to read project_id from file
                try:
                    with open(cred_path, 'r') as f:
                        cred_file = json.load(f)
                        project_id = cred_file.get('project_id', 'unknown')
                        if project_id != 'guita-fa387':
                            logger.error(f"Firebase project ID mismatch: expected 'guita-fa387', got '{project_id}'")
                except Exception:
                    project_id = 'unknown'
            else:
                logger.error("FIREBASE_CREDENTIALS_GUITA not found. Set it in backend_py/.env")
                logger.warning("Falling back to ApplicationDefault (may use wrong project)")
                cred = credentials.ApplicationDefault()
                project_id = 'ApplicationDefault (unknown)'
            
            firebase_admin.initialize_app(cred)
            FirebaseAuthService._initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {type(e).__name__}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify Firebase ID token and return user data
        
        Args:
            token: Firebase ID token
            
        Returns:
            Dict containing user data
            
        Raises:
            Exception: If token is invalid
        """
        try:
            if not token:
                raise Exception("Token is required")
            
            # Verify the ID token
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            email = decoded_token.get('email', '')
            
            if not uid:
                raise Exception("Invalid token: no UID found")
            
            # Get user record from Firebase Auth
            try:
                user_record = auth.get_user(uid)
            except Exception:
                # If user doesn't exist in Firebase Auth, create basic user data from token
                user_record = None
            
            # Get or create user profile in database
            user_profile = await self._get_or_create_user_profile(uid, email, user_record)
            
            return {
                "uid": uid,
                "email": email or user_profile.get("email", ""),
                "display_name": user_profile.get("display_name") or decoded_token.get('name') or "",
                "photo_url": user_profile.get("photo_url") or decoded_token.get('picture') or "",
                "email_verified": decoded_token.get('email_verified', False),
                "created_at": user_profile.get("created_at"),
                "last_sign_in": decoded_token.get('auth_time')
            }
            
        except ValueError as e:
            # ValueError is raised for invalid token format
            error_msg = str(e)
            if "expired" in error_msg.lower():
                logger.error(f"Token expired: {error_msg}")
                raise Exception(f"Token expired: {error_msg}")
            elif "revoked" in error_msg.lower():
                logger.error(f"Token revoked: {error_msg}")
                raise Exception(f"Token revoked: {error_msg}")
            else:
                logger.error(f"Invalid token format: {error_msg}")
                raise Exception(f"Invalid token format: {error_msg}")
        except Exception as e:
            logger.error(f"Token verification failed: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise Exception(f"Invalid token: {str(e)}")
    
    async def _get_or_create_user_profile(self, uid: str, email: str, user_record: Optional[Any]) -> Dict[str, Any]:
        """
        Get user profile from database or create if doesn't exist.
        
        Assumes schema with users.id as TEXT (Firebase UID).
        """
        from database.neon_client import get_neon
        
        neon = get_neon()
        
        # Try to get existing user by id (TEXT schema - Firebase UID)
        try:
            user = await neon.fetchrow(
                "SELECT id, email, created_at FROM users WHERE id = $1",
                uid
            )
            
            if user:
                return {
                    "id": str(user["id"]),
                    "email": user.get("email", email),
                    "created_at": user.get("created_at")
                }
        except Exception as e:
            logger.warning(f"Could not query users by id: {e}")
        
        # Create new user (schema with id as TEXT)
        try:
            await neon.execute(
                "INSERT INTO users (id, email, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO NOTHING",
                uid, email
            )
            
            # Fetch the newly created user
            new_user = await neon.fetchrow(
                "SELECT id, email, created_at FROM users WHERE id = $1",
                uid
            )
            
            if new_user:
                return {
                    "id": str(new_user["id"]),
                    "email": new_user.get("email", email),
                    "created_at": new_user.get("created_at")
                }
        except Exception as e:
            logger.error(f"Failed to create user profile: {e}")
        
        # Fallback: return basic user data even if DB operation failed
        return {
            "id": uid,
            "email": email,
            "created_at": None
        }
    
    async def create_user_profile(self, user_data: Dict[str, Any]) -> bool:
        """Create user profile in database"""
        from database.neon_client import get_neon
        
        try:
            neon = get_neon()
            await neon.execute(
                "INSERT INTO users (id, email, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO NOTHING",
                user_data["uid"], user_data.get("email", "")
            )
            return True
        except Exception as e:
            logger.error(f"Failed to create user profile: {str(e)}")
            return False
    
    async def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user profile in database"""
        from database.neon_client import get_neon
        
        try:
            neon = get_neon()
            # Note: The users table in the new schema only has id, email, created_at
            # Additional fields would need to be stored elsewhere or schema extended
            if "email" in updates:
                await neon.execute(
                    "UPDATE users SET email = $1 WHERE id = $2",
                    updates["email"], user_id
                )
            return True
        except Exception as e:
            logger.error(f"Failed to update user profile: {str(e)}")
            return False

# Global instance
firebase_auth_service = FirebaseAuthService()

# Dependency function for FastAPI
async def get_current_user_from_token(token: str):
    """Verify Firebase token and return user data"""
    from models.user import User
    user_data = await firebase_auth_service.verify_token(token)
    return User(**user_data)

