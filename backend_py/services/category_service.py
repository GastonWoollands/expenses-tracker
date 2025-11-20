"""
Category service for managing expense categories
"""

from typing import List, Optional, Dict, Any
from database.base_service import BaseService
from database.neon_client import get_neon
from config.categories import CATEGORIES, get_category_by_key
import uuid
import logging

logger = logging.getLogger(__name__)

class Category:
    """Category model"""
    def __init__(self, data: Dict[str, Any]):
        self.id = str(data.get("id", ""))
        self.key = data.get("key", "")
        self.name = data.get("name", "")
        self.description = data.get("description", "")
        self.user_id = data.get("user_id")
        self.type = data.get("type", "expense")
        self.icon = data.get("icon", "")
        self.created_at = data.get("created_at")

class CategoryService:
    """Service for managing categories"""
    
    def __init__(self):
        self.neon = get_neon()
    
    async def get_all_categories(self, active_only: bool = True, user_id: Optional[str] = None) -> List[Category]:
        """Get all categories, optionally filtered by user"""
        if user_id:
            query = """
                SELECT * FROM categories
                WHERE user_id = $1 OR user_id IS NULL
                ORDER BY created_at ASC
            """
            results = await self.neon.fetch(query, user_id)
        else:
            query = """
                SELECT * FROM categories
                WHERE user_id IS NULL
                ORDER BY created_at ASC
            """
            results = await self.neon.fetch(query)
        
        return [Category(dict(row)) for row in results]
    
    async def get_category_by_id(self, category_id: str) -> Optional[Category]:
        """Get category by ID"""
        query = "SELECT * FROM categories WHERE id = $1"
        result = await self.neon.fetchrow(query, category_id)
        if result:
            return Category(dict(result))
        return None
    
    async def get_category_by_name(self, name: str, user_id: Optional[str] = None) -> Optional[Category]:
        """Get category by name"""
        if user_id:
            query = "SELECT * FROM categories WHERE name = $1 AND (user_id = $2 OR user_id IS NULL) LIMIT 1"
            result = await self.neon.fetchrow(query, name, user_id)
        else:
            query = "SELECT * FROM categories WHERE name = $1 AND user_id IS NULL LIMIT 1"
            result = await self.neon.fetchrow(query, name)
        
        if result:
            return Category(dict(result))
        return None
    
    async def create_category(self, category_data: Dict[str, Any]) -> Category:
        """Create a new category"""
        category_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO categories (id, user_id, name, type, icon, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *
        """
        
        result = await self.neon.fetchrow(
            query,
            category_id,
            category_data.get("user_id"),
            category_data["name"],
            category_data.get("type", "expense"),
            category_data.get("icon", "")
        )
        
        if result:
            return Category(dict(result))
        raise Exception("Failed to create category")
    
    async def update_category(self, category_id: str, category_data: Dict[str, Any]) -> Optional[Category]:
        """Update a category"""
        updates = []
        values = []
        param_index = 1
        
        if "name" in category_data:
            updates.append(f"name = ${param_index}")
            values.append(category_data["name"])
            param_index += 1
        
        if "icon" in category_data:
            updates.append(f"icon = ${param_index}")
            values.append(category_data["icon"])
            param_index += 1
        
        if not updates:
            return await self.get_category_by_id(category_id)
        
        values.append(category_id)
        query = f"""
            UPDATE categories
            SET {', '.join(updates)}
            WHERE id = ${param_index}
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, *values)
        if result:
            return Category(dict(result))
        return None
    
    async def initialize_default_categories(self):
        """Initialize default categories from config"""
        try:
            # Check if categories already exist
            existing = await self.neon.fetch("SELECT COUNT(*) FROM categories WHERE user_id IS NULL")
            if existing and existing[0]["count"] > 0:
                logger.info("Default categories already initialized")
                return
            
            # Insert default categories
            for key, cat_info in CATEGORIES.items():
                try:
                    category_id = str(uuid.uuid4())
                    await self.neon.execute(
                        """
                        INSERT INTO categories (id, user_id, name, type, created_at)
                        VALUES ($1, NULL, $2, 'expense', NOW())
                        ON CONFLICT DO NOTHING
                        """,
                        category_id,
                        cat_info.name
                    )
                except Exception as e:
                    logger.warning(f"Failed to insert category {key}: {e}")
            
            logger.info("Default categories initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize default categories: {e}")

# Global instance
category_service = CategoryService()

