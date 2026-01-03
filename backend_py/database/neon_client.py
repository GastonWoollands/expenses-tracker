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
    """Neon PostgreSQL configuration management with connection pooling"""
    
    _pool: Optional[asyncpg.Pool] = None
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")
        
        if not self.database_url:
            raise ValueError("DATABASE_URL must be set in environment variables")
    
    async def get_pool(self) -> asyncpg.Pool:
        """Get or create connection pool"""
        if self._pool is None:
            try:
                self._pool = await asyncpg.create_pool(
                    self.database_url,
                    min_size=5,
                    max_size=20,
                    command_timeout=60,
                    max_queries=50000,
                    max_inactive_connection_lifetime=300.0
                )
                logger.info("Database connection pool created")
            except Exception as e:
                logger.error(f"Failed to create connection pool: {e}")
                raise
        return self._pool
    
    async def close_pool(self):
        """Close connection pool"""
        if self._pool:
            try:
                await self._pool.close()
                logger.info("Database connection pool closed")
            except Exception as e:
                logger.error(f"Error closing connection pool: {e}")
            finally:
                self._pool = None
    
    async def get_connection(self) -> asyncpg.Connection:
        """Get a new database connection (deprecated - use pool instead)"""
        try:
            conn = await asyncpg.connect(self.database_url)
            return conn
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    async def execute(self, query: str, *args) -> str:
        """Execute a query and return the result using connection pool"""
        pool = await self.get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute(query, *args)
            return result
    
    async def fetch(self, query: str, *args) -> list:
        """Fetch multiple rows using connection pool"""
        pool = await self.get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetch(query, *args)
            return result
    
    async def fetchrow(self, query: str, *args) -> Optional[asyncpg.Record]:
        """Fetch a single row using connection pool"""
        pool = await self.get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetchrow(query, *args)
            return result
    
    async def fetchval(self, query: str, *args) -> Optional[any]:
        """Fetch a single value using connection pool"""
        pool = await self.get_pool()
        async with pool.acquire() as conn:
            result = await conn.fetchval(query, *args)
            return result

# Global configuration instance
@lru_cache()
def get_neon_config() -> NeonConfig:
    """Get cached Neon configuration"""
    return NeonConfig()

# Convenience function
def get_neon() -> NeonConfig:
    """Get Neon database client"""
    return get_neon_config()

