"""
Base service class for Supabase operations
"""

from typing import List, Optional, Dict, Any, TypeVar, Generic
from abc import ABC, abstractmethod
from supabase import Client
from database.supabase_client import get_supabase

T = TypeVar('T')

class BaseService(ABC, Generic[T]):
    """Base service class for all database operations"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get Supabase client (lazy loading)"""
        if self._client is None:
            self._client = get_supabase()
        return self._client
    
    async def create(self, data: Dict[str, Any]) -> T:
        """Create a new record"""
        result = self.client.table(self.table_name).insert(data).execute()
        if result.data:
            return self._map_to_model(result.data[0])
        raise Exception("Failed to create record")
    
    async def get_by_id(self, record_id: str) -> Optional[T]:
        """Get record by ID"""
        result = self.client.table(self.table_name).select("*").eq("id", record_id).execute()
        if result.data:
            return self._map_to_model(result.data[0])
        return None
    
    async def get_by_user(self, user_id: str, limit: int = 100, offset: int = 0) -> List[T]:
        """Get records by user ID with pagination"""
        result = (self.client.table(self.table_name)
                 .select("*")
                 .eq("user_id", user_id)
                 .range(offset, offset + limit - 1)
                 .execute())
        return [self._map_to_model(item) for item in result.data]
    
    async def update(self, record_id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update record by ID"""
        result = (self.client.table(self.table_name)
                 .update(data)
                 .eq("id", record_id)
                 .execute())
        if result.data:
            return self._map_to_model(result.data[0])
        return None
    
    async def delete(self, record_id: str) -> bool:
        """Delete record by ID"""
        result = self.client.table(self.table_name).delete().eq("id", record_id).execute()
        return len(result.data) > 0
    
    async def query(self, filters: Dict[str, Any] = None, order_by: str = None) -> List[T]:
        """Generic query with filters"""
        query = self.client.table(self.table_name).select("*")
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if order_by:
            query = query.order(order_by)
        
        result = query.execute()
        return [self._map_to_model(item) for item in result.data]
    
    @abstractmethod
    def _map_to_model(self, data: Dict[str, Any]) -> T:
        """Map database record to model"""
        pass
