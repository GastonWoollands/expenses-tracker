"""
Base service class for Neon PostgreSQL operations
"""

from typing import List, Optional, Dict, Any, TypeVar, Generic
from abc import ABC, abstractmethod
from database.neon_client import get_neon
import asyncpg

T = TypeVar('T')

class BaseService(ABC, Generic[T]):
    """Base service class for all database operations"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self._neon = None
    
    @property
    def neon(self):
        """Get Neon client (lazy loading)"""
        if self._neon is None:
            self._neon = get_neon()
        return self._neon
    
    async def create(self, data: Dict[str, Any]) -> T:
        """Create a new record"""
        # Build INSERT query dynamically
        columns = list(data.keys())
        placeholders = [f"${i+1}" for i in range(len(columns))]
        values = list(data.values())
        
        query = f"""
            INSERT INTO {self.table_name} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, *values)
        if result:
            return self._map_to_model(dict(result))
        raise Exception("Failed to create record")
    
    async def get_by_id(self, record_id: str) -> Optional[T]:
        """Get record by ID"""
        query = f"SELECT * FROM {self.table_name} WHERE id = $1"
        result = await self.neon.fetchrow(query, record_id)
        if result:
            return self._map_to_model(dict(result))
        return None
    
    async def get_by_user(self, user_id: str, limit: int = 100, offset: int = 0) -> List[T]:
        """Get records by user ID with pagination"""
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """
        results = await self.neon.fetch(query, user_id, limit, offset)
        return [self._map_to_model(dict(row)) for row in results]
    
    async def update(self, record_id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update record by ID"""
        if not data:
            return await self.get_by_id(record_id)
        
        # Build UPDATE query dynamically
        set_clauses = [f"{key} = ${i+1}" for i, key in enumerate(data.keys())]
        values = list(data.values())
        where_param = len(values) + 1
        
        query = f"""
            UPDATE {self.table_name}
            SET {', '.join(set_clauses)}
            WHERE id = ${where_param}
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, *(values + [record_id]))
        if result:
            return self._map_to_model(dict(result))
        return None
    
    async def delete(self, record_id: str) -> bool:
        """Delete record by ID"""
        query = f"DELETE FROM {self.table_name} WHERE id = $1 RETURNING id"
        result = await self.neon.fetchrow(query, record_id)
        return result is not None
    
    async def query(self, filters: Dict[str, Any] = None, order_by: str = None) -> List[T]:
        """Generic query with filters"""
        query_parts = [f"SELECT * FROM {self.table_name}"]
        params = []
        param_index = 1
        
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(f"{key} = ${param_index}")
                params.append(value)
                param_index += 1
            query_parts.append("WHERE " + " AND ".join(conditions))
        
        if order_by:
            query_parts.append(f"ORDER BY {order_by}")
        
        query = " ".join(query_parts)
        results = await self.neon.fetch(query, *params)
        return [self._map_to_model(dict(row)) for row in results]
    
    @abstractmethod
    def _map_to_model(self, data: Dict[str, Any]) -> T:
        """Map database record to model"""
        pass
