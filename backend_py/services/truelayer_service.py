"""
TrueLayer service for bank account integration
Handles OAuth flow, token management, and transaction fetching
"""

import os
import time
import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from database.neon_client import get_neon

logger = logging.getLogger(__name__)

class TrueLayerService:
    """Service for TrueLayer bank account integration"""
    
    def __init__(self):
        self.neon = get_neon()
        self.client_id = os.environ.get("TRUELAYER_CLIENT_ID")
        self.client_secret = os.environ.get("TRUELAYER_CLIENT_SECRET")
        self.redirect_uri = os.environ.get("TRUELAYER_REDIRECT_URI")
        
        # Use sandbox by default, can be overridden with TRUELAYER_ENVIRONMENT=production
        environment = os.environ.get("TRUELAYER_ENVIRONMENT", "sandbox").lower()
        
        if environment == "production" or environment == "live":
            self.auth_url = "https://auth.truelayer.com"
            self.api_url = "https://api.truelayer.com/data/v1"
            logger.warning("⚠️  TrueLayer: Using PRODUCTION environment")
            logger.warning("⚠️  PRODUCTION URLs: auth.truelayer.com, api.truelayer.com")
        else:
            # Default to sandbox for safety
            self.auth_url = "https://auth.truelayer-sandbox.com"
            self.api_url = "https://api.truelayer-sandbox.com/data/v1"
            logger.info("✅ TrueLayer: Using SANDBOX environment")
            logger.info(f"✅ SANDBOX Auth URL: {self.auth_url}")
            logger.info(f"✅ SANDBOX API URL: {self.api_url}")
        
        if not all([self.client_id, self.client_secret, self.redirect_uri]):
            logger.warning("TrueLayer credentials not configured")
        else:
            # Validate that sandbox credentials are being used
            if environment != "production" and environment != "live":
                if not self.client_id.startswith("sandbox-"):
                    logger.warning(
                        f"TrueLayer: Client ID '{self.client_id[:20]}...' doesn't start with 'sandbox-'. "
                        "Make sure you're using sandbox credentials!"
                    )
    
    def get_auth_url(self, state: Optional[str] = None) -> str:
        """
        Generate TrueLayer OAuth authorization URL
        
        This URL will redirect the user to TrueLayer where they will:
        1. Log in to TrueLayer
        2. Select their bank (sandbox or live) - handled by TrueLayer
        3. Authorize our app
        
        After authorization, TrueLayer redirects to our callback with code and state.
        
        IMPORTANT: 
        - The state parameter contains the user_id (Firebase UID)
        - Bank selection happens on TrueLayer's page, NOT in our frontend
        - We NEVER call login-api.truelayer-sandbox.com/providers from our code
        - TrueLayer handles all bank/provider selection internally
        """
        # Validate we're using sandbox
        if "truelayer-sandbox.com" not in self.auth_url:
            logger.warning(f"⚠️  WARNING: Auth URL is NOT sandbox: {self.auth_url}")
        
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "info accounts balance transactions",
        }
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        auth_url = f"{self.auth_url}/?{query_string}"
        
        # Log the auth URL being generated (first 100 chars to avoid logging full URL with secrets)
        logger.info(f"TrueLayer: Generated auth URL (sandbox): {auth_url[:100]}...")
        
        return auth_url
    
    async def exchange_code_for_tokens(self, code: str, user_id: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""
        data = {
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "code": code,
        }
        
        try:
            resp = requests.post(f"{self.auth_url}/connect/token", data=data, timeout=10)
            resp.raise_for_status()
            token_data = resp.json()
            
            # Calculate expiration time
            expires_in = token_data.get("expires_in", 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
            
            # Save tokens to database
            await self._save_tokens(
                user_id=user_id,
                access_token=token_data["access_token"],
                refresh_token=token_data["refresh_token"],
                expires_at=expires_at,
                provider_user_id=token_data.get("provider_user_id")
            )
            
            return {
                "success": True,
                "message": "Tokens saved successfully"
            }
        except requests.RequestException as e:
            logger.error(f"Error exchanging code for tokens: {e}")
            raise Exception(f"Failed to exchange code for tokens: {str(e)}")
    
    async def _save_tokens(
        self,
        user_id: str,
        access_token: str,
        refresh_token: str,
        expires_at: datetime,
        provider_user_id: Optional[str] = None
    ):
        """Save or update tokens in database"""
        query = """
            INSERT INTO truelayer_tokens (user_id, access_token, refresh_token, expires_at, provider_user_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                expires_at = EXCLUDED.expires_at,
                provider_user_id = EXCLUDED.provider_user_id,
                updated_at = NOW()
        """
        await self.neon.execute(query, user_id, access_token, refresh_token, expires_at, provider_user_id)
    
    async def _get_tokens(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get tokens from database"""
        query = """
            SELECT access_token, refresh_token, expires_at
            FROM truelayer_tokens
            WHERE user_id = $1
        """
        row = await self.neon.fetchrow(query, user_id)
        if row:
            return {
                "access_token": row["access_token"],
                "refresh_token": row["refresh_token"],
                "expires_at": row["expires_at"]
            }
        return None
    
    async def _refresh_access_token(self, user_id: str) -> str:
        """Refresh access token if expired"""
        tokens = await self._get_tokens(user_id)
        if not tokens:
            raise Exception("No tokens found for user")
        
        # Check if token is still valid (with 60 second buffer)
        expires_at = tokens["expires_at"]
        if isinstance(expires_at, datetime):
            time_until_expiry = (expires_at - datetime.utcnow()).total_seconds()
        else:
            time_until_expiry = expires_at - time.time()
        
        if time_until_expiry > 60:
            return tokens["access_token"]
        
        # Refresh token
        data = {
            "grant_type": "refresh_token",
            "refresh_token": tokens["refresh_token"],
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        
        try:
            resp = requests.post(f"{self.auth_url}/connect/token", data=data, timeout=10)
            resp.raise_for_status()
            token_data = resp.json()
            
            expires_in = token_data.get("expires_in", 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
            
            await self._save_tokens(
                user_id=user_id,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token", tokens["refresh_token"]),
                expires_at=expires_at
            )
            
            return token_data["access_token"]
        except requests.RequestException as e:
            logger.error(f"Error refreshing token: {e}")
            raise Exception(f"Failed to refresh token: {str(e)}")
    
    async def get_accounts(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's bank accounts from TrueLayer"""
        access_token = await self._refresh_access_token(user_id)
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            resp = requests.get(f"{self.api_url}/accounts", headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [])
        except requests.RequestException as e:
            logger.error(f"Error fetching accounts: {e}")
            raise Exception(f"Failed to fetch accounts: {str(e)}")
    
    async def get_transactions(
        self,
        user_id: str,
        account_id: str,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get transactions for a specific account"""
        access_token = await self._refresh_access_token(user_id)
        headers = {"Authorization": f"Bearer {access_token}"}
        
        params = {}
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        try:
            url = f"{self.api_url}/accounts/{account_id}/transactions"
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [])
        except requests.RequestException as e:
            logger.error(f"Error fetching transactions: {e}")
            raise Exception(f"Failed to fetch transactions: {str(e)}")
    
    async def is_connected(self, user_id: str) -> bool:
        """Check if user has connected TrueLayer"""
        tokens = await self._get_tokens(user_id)
        return tokens is not None
    
    async def disconnect(self, user_id: str):
        """Remove TrueLayer connection for user"""
        query = "DELETE FROM truelayer_tokens WHERE user_id = $1"
        await self.neon.execute(query, user_id)

