"""
Expense service for managing expenses (mapped to transactions table)
"""

from typing import List, Optional, Dict, Any
from database.neon_client import get_neon
from models.expense import Expense, ExpenseCreate, ExpenseUpdate
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class ExpenseService:
    """Service for managing expenses"""
    
    def __init__(self):
        self.neon = get_neon()
    
    async def create_expense(self, expense_data: ExpenseCreate, user_id: str) -> Expense:
        """Create a new expense (stored as transaction)"""
        # First, get or create a default account for the user
        account_id = await self._get_or_create_default_account(user_id)
        
        # Get or create category
        category_id = await self._get_or_create_category(expense_data.category, user_id)
        
        # Create transaction
        transaction_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO transactions (
                id, user_id, account_id, category_id, type, amount, 
                currency, description, occurred_at, created_at
            )
            VALUES ($1, $2, $3, $4, 'expense', $5, $6, $7, $8, NOW())
            RETURNING *
        """
        
        result = await self.neon.fetchrow(
            query,
            transaction_id,
            user_id,
            account_id,
            category_id,
            float(expense_data.amount),
            expense_data.currency or "EUR",  # Use provided currency or default to EUR
            expense_data.description,
            expense_data.date
        )
        
        if result:
            return self._map_to_expense(dict(result), expense_data.category)
        raise Exception("Failed to create expense")
    
    async def get_expense(self, expense_id: str, user_id: str) -> Optional[Expense]:
        """Get expense by ID (excludes fixed expense templates)"""
        # Try with is_fixed column, fallback if it doesn't exist
        try:
            query = """
                SELECT t.*, c.name as category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = $1 AND t.user_id = $2 AND t.type = 'expense'
                AND (t.is_fixed = false OR t.is_fixed IS NULL)
            """
            result = await self.neon.fetchrow(query, expense_id, user_id)
        except Exception:
            # Fallback if is_fixed column doesn't exist
            query = """
                SELECT t.*, c.name as category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = $1 AND t.user_id = $2 AND t.type = 'expense'
            """
            result = await self.neon.fetchrow(query, expense_id, user_id)
        
        if result:
            row = dict(result)
            category_name = row.get("category_name", "Uncategorized")
            return self._map_to_expense(row, category_name)
        return None
    
    async def get_user_expenses(self, user_id: str, limit: int = 100, offset: int = 0) -> List[Expense]:
        """Get user expenses with pagination (excludes fixed expense templates)"""
        # Try with is_fixed column, fallback if it doesn't exist
        try:
            query = """
                SELECT t.*, c.name as category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1 AND t.type = 'expense'
                AND (t.is_fixed = false OR t.is_fixed IS NULL)
                ORDER BY t.occurred_at DESC
                LIMIT $2 OFFSET $3
            """
            results = await self.neon.fetch(query, user_id, limit, offset)
        except Exception:
            # Fallback if is_fixed column doesn't exist
            query = """
                SELECT t.*, c.name as category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1 AND t.type = 'expense'
                ORDER BY t.occurred_at DESC
                LIMIT $2 OFFSET $3
            """
            results = await self.neon.fetch(query, user_id, limit, offset)
        
        return [self._map_to_expense(dict(row), row.get("category_name", "Uncategorized")) for row in results]
    
    async def update_expense(self, expense_id: str, expense_data: ExpenseUpdate, user_id: str) -> Optional[Expense]:
        """Update an expense"""
        updates = []
        values = []
        param_index = 1
        
        if expense_data.amount is not None:
            updates.append(f"amount = ${param_index}")
            values.append(float(expense_data.amount))
            param_index += 1
        
        if expense_data.description is not None:
            updates.append(f"description = ${param_index}")
            values.append(expense_data.description)
            param_index += 1
        
        if expense_data.date is not None:
            updates.append(f"occurred_at = ${param_index}")
            values.append(expense_data.date)
            param_index += 1
        
        if expense_data.category is not None:
            category_id = await self._get_or_create_category(expense_data.category, user_id)
            updates.append(f"category_id = ${param_index}")
            values.append(category_id)
            param_index += 1
        
        if expense_data.currency is not None:
            updates.append(f"currency = ${param_index}")
            values.append(expense_data.currency)
            param_index += 1
        
        if not updates:
            return await self.get_expense(expense_id, user_id)
        
        # Add WHERE clause parameters
        where_param1 = param_index
        where_param2 = param_index + 1
        values.extend([expense_id, user_id])
        
        query = f"""
            UPDATE transactions
            SET {', '.join(updates)}
            WHERE id = ${where_param1} AND user_id = ${where_param2} AND type = 'expense'
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, *values)
        if result:
            row = dict(result)
            # Get category name
            category_name = expense_data.category if expense_data.category else "Uncategorized"
            if result.get("category_id"):
                cat = await self.neon.fetchrow("SELECT name FROM categories WHERE id = $1", result["category_id"])
                if cat:
                    category_name = cat["name"]
            return self._map_to_expense(row, category_name)
        return None
    
    async def delete_expense(self, expense_id: str, user_id: str) -> bool:
        """Delete an expense"""
        query = """
            DELETE FROM transactions
            WHERE id = $1 AND user_id = $2 AND type = 'expense'
            RETURNING id
        """
        
        result = await self.neon.fetchrow(query, expense_id, user_id)
        return result is not None
    
    async def get_expense_summary(self, user_id: str, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        """Get expense summary for analytics (includes applied fixed expenses, excludes templates)"""
        # Check if is_fixed column exists
        has_is_fixed = False
        try:
            check_query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'is_fixed'
            """
            result = await self.neon.fetchrow(check_query)
            has_is_fixed = result is not None
        except Exception:
            pass
        
        query_parts = [
            """
            SELECT 
                COUNT(*) as total_count,
                SUM(amount) as total_amount,
                AVG(amount) as average_amount
            FROM transactions
            WHERE user_id = $1 AND type = 'expense'
            """
        ]
        if has_is_fixed:
            query_parts[0] = query_parts[0].rstrip() + "\n            AND (is_fixed = false OR is_fixed IS NULL)"
        
        params = [user_id]
        param_index = 2
        
        if year:
            query_parts.append(f"AND EXTRACT(YEAR FROM occurred_at) = ${param_index}")
            params.append(year)
            param_index += 1
        
        if month:
            query_parts.append(f"AND EXTRACT(MONTH FROM occurred_at) = ${param_index}")
            params.append(month)
            param_index += 1
        
        query = " ".join(query_parts)
        result = await self.neon.fetchrow(query, *params)
        
        if result:
            return {
                "total_amount": float(result["total_amount"] or 0),
                "total_count": result["total_count"] or 0,
                "average_amount": float(result["average_amount"] or 0),
                "period": f"{year or 'all'}-{month or 'all'}" if year else "all"
            }
        
        return {
            "total_amount": 0.0,
            "total_count": 0,
            "average_amount": 0.0,
            "period": f"{year or 'all'}-{month or 'all'}" if year else "all"
        }
    
    async def get_category_breakdown(self, user_id: str, month: Optional[int] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get expense breakdown by category (includes applied fixed expenses, excludes templates)"""
        # Check if is_fixed column exists
        has_is_fixed = False
        try:
            check_query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'is_fixed'
            """
            result = await self.neon.fetchrow(check_query)
            has_is_fixed = result is not None
        except Exception:
            pass
        
        query_parts = [
            """
            SELECT 
                c.name as category,
                COUNT(*) as count,
                SUM(t.amount) as amount
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1 AND t.type = 'expense'
            """
        ]
        if has_is_fixed:
            query_parts[0] = query_parts[0].rstrip() + "\n            AND (t.is_fixed = false OR t.is_fixed IS NULL)"
        
        params = [user_id]
        param_index = 2
        
        if year:
            query_parts.append(f"AND EXTRACT(YEAR FROM t.occurred_at) = ${param_index}")
            params.append(year)
            param_index += 1
        
        if month:
            query_parts.append(f"AND EXTRACT(MONTH FROM t.occurred_at) = ${param_index}")
            params.append(month)
            param_index += 1
        
        query_parts.append("GROUP BY c.name ORDER BY amount DESC")
        query = " ".join(query_parts)
        
        results = await self.neon.fetch(query, *params)
        
        # Calculate total for percentage
        total = sum(float(row["amount"] or 0) for row in results)
        
        breakdown = []
        for row in results:
            amount = float(row["amount"] or 0)
            breakdown.append({
                "category": row["category"] or "Uncategorized",
                "amount": amount,
                "count": row["count"] or 0,
                "percentage": (amount / total * 100) if total > 0 else 0.0
            })
        
        return breakdown
    
    async def get_fixed_expenses(self, user_id: str) -> List[Dict[str, Any]]:
        """Get fixed expenses (not fully implemented in schema, returning empty for now)"""
        # The schema doesn't have a fixed_expenses table, so we return empty
        # This can be extended later if needed
        return []
    
    async def create_fixed_expense(self, fixed_expense_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Create a fixed expense (not fully implemented)"""
        # Placeholder implementation
        return {"id": str(uuid.uuid4()), "user_id": user_id, **fixed_expense_data}
    
    async def _get_or_create_default_account(self, user_id: str) -> str:
        """Get or create a default account for the user"""
        # Check if user has an account
        account = await self.neon.fetchrow(
            "SELECT id FROM accounts WHERE user_id = $1 LIMIT 1",
            user_id
        )
        
        if account:
            return str(account["id"])
        
        # Create default account
        account_id = str(uuid.uuid4())
        await self.neon.execute(
            """
            INSERT INTO accounts (id, user_id, name, type, currency, created_at)
            VALUES ($1, $2, 'Default', 'cash', 'EUR', NOW())
            """,
            account_id,
            user_id
        )
        
        return account_id
    
    async def _get_or_create_category(self, category_name: str, user_id: str) -> Optional[str]:
        """Get or create a category by name"""
        # First try to find existing category
        category = await self.neon.fetchrow(
            """
            SELECT id FROM categories
            WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)
            LIMIT 1
            """,
            category_name,
            user_id
        )
        
        if category:
            return str(category["id"])
        
        # Create new category
        category_id = str(uuid.uuid4())
        await self.neon.execute(
            """
            INSERT INTO categories (id, user_id, name, type, created_at)
            VALUES ($1, $2, $3, 'expense', NOW())
            """,
            category_id,
            user_id,
            category_name
        )
        
        return category_id
    
    def _map_to_expense(self, data: Dict[str, Any], category_name: str) -> Expense:
        """Map database record to Expense model"""
        return Expense(
            id=str(data["id"]),
            user_id=data["user_id"],
            category=category_name,
            category_id=str(data.get("category_id", "")),
            amount=float(data["amount"]),
            description=data.get("description", ""),
            date=data.get("occurred_at") or data.get("created_at"),
            currency=data.get("currency", "EUR"),  # Default to EUR if not specified
            is_fixed=False,  # Not in current schema
            created_at=data.get("created_at"),
            updated_at=data.get("created_at")
        )

