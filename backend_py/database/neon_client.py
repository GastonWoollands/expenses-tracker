"""
Neon PostgreSQL database client and configuration
"""

import os
import asyncpg
from typing import Optional
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

class NeonConfig:
    """Neon PostgreSQL configuration management"""
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        
        if not self.database_url:
            raise ValueError("DATABASE_URL must be set in environment variables")
    
    async def get_connection(self) -> asyncpg.Connection:
        """Get a new database connection"""
        try:
            conn = await asyncpg.connect(self.database_url)
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    async def execute(self, query: str, *args) -> str:
        """Execute a query and return the result"""
        conn = await self.get_connection()
        try:
            result = await conn.execute(query, *args)
            return result
        finally:
            await conn.close()
    
    async def fetch(self, query: str, *args) -> list:
        """Fetch multiple rows"""
        conn = await self.get_connection()
        try:
            result = await conn.fetch(query, *args)
            return result
        finally:
            await conn.close()
    
    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Fetch a single row"""
        conn = await self.get_connection()
        try:
            result = await conn.fetchrow(query, *args)
            return result
        finally:
            await conn.close()
    
    async def fetchval(self, query: str, *args) -> Optional[any]:
        """Fetch a single value"""
        conn = await self.get_connection()
        try:
            result = await conn.fetchval(query, *args)
            return result
        finally:
            await conn.close()

# Global configuration instance
@lru_cache()
def get_neon_config() -> NeonConfig:
    """Get cached Neon configuration"""
    return NeonConfig()

# Convenience function
def get_neon() -> NeonConfig:
    """Get Neon database client"""
    return get_neon_config()

