"""
Supabase database client and configuration
"""

import os
from supabase import create_client, Client
from typing import Optional
from functools import lru_cache

class SupabaseConfig:
    """Supabase configuration management"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
    
    @property
    def client(self) -> Client:
        """Get Supabase client with anon key"""
        return create_client(self.url, self.key)
    
    @property
    def admin_client(self) -> Client:
        """Get Supabase client with service key for admin operations"""
        if not self.service_key:
            raise ValueError("SUPABASE_SERVICE_KEY must be set for admin operations")
        return create_client(self.url, self.service_key)

# Global configuration instance
@lru_cache()
def get_supabase_config() -> SupabaseConfig:
    """Get cached Supabase configuration"""
    return SupabaseConfig()

# Convenience functions
def get_supabase() -> Client:
    """Get Supabase client for regular operations"""
    return get_supabase_config().client

def get_supabase_admin() -> Client:
    """Get Supabase admin client for admin operations"""
    return get_supabase_config().admin_client
