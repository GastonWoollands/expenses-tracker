"""
Secure query execution with read-only connection and user filtering.
"""

import asyncio
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

MAX_RESULTS = 100
QUERY_TIMEOUT = 10


class QueryExecutor:
    """Executes SQL queries securely with user isolation."""

    def __init__(self, neon_client):
        self.neon = neon_client

    async def execute(self, sql: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Execute SQL query with security measures.

        Args:
            sql: SQL query with {{user_id}} placeholder
            user_id: User ID to inject into query

        Returns:
            List of result dictionaries
        """
        if not sql or not user_id:
            logger.warning("Missing SQL or user_id")
            return []

        safe_sql = self._inject_user_id(sql, user_id)

        safe_sql = self._ensure_limit(safe_sql)

        logger.debug(f"Executing query for user {user_id[:8]}...")

        try:
            async with asyncio.timeout(QUERY_TIMEOUT):
                pool = await self.neon.get_read_only_pool()
                async with pool.acquire() as conn:
                    rows = await conn.fetch(safe_sql)

                    results = [dict(row) for row in rows[:MAX_RESULTS]]
                    logger.info(f"Query returned {len(results)} results")
                    return results

        except asyncio.TimeoutError:
            logger.error(f"Query timeout after {QUERY_TIMEOUT}s")
            raise TimeoutError("Query took too long to execute")
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            raise

    def _inject_user_id(self, sql: str, user_id: str) -> str:
        """Replace user_id placeholder with actual value."""
        safe_user_id = user_id.replace("'", "''")
        return sql.replace("{{user_id}}", safe_user_id)

    def _ensure_limit(self, sql: str) -> str:
        """Ensure query has a LIMIT clause."""
        sql_lower = sql.lower()

        if "limit" in sql_lower:
            return sql

        sql = sql.rstrip(";").strip()
        sql = f"{sql} LIMIT {MAX_RESULTS};"

        return sql

    async def execute_simple(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute a simple parameterized query."""
        try:
            pool = await self.neon.get_read_only_pool()
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *args)
                return [dict(row) for row in rows[:MAX_RESULTS]]
        except Exception as e:
            logger.error(f"Simple query error: {e}")
            raise
