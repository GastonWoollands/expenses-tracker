"""
Budget service for managing budgets
"""

from typing import List, Optional, Dict, Any
from database.neon_client import get_neon
from models.budget import Budget, BudgetCreate, BudgetUpdate
from config.categories import CATEGORIES
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class BudgetService:
    """Service for managing budgets"""
    
    def __init__(self):
        self.neon = get_neon()
    
    async def get_budgets(self, user_id: str) -> List[Budget]:
        """Get all budgets for a user"""
        query = """
            SELECT b.*, c.name as category_name
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC
        """
        
        results = await self.neon.fetch(query, user_id)
        budgets = []
        
        for row in results:
            # Map category_id/category_name to a stable category_key using config
            category_name = row.get("category_name", "other")
            # Try to find a matching key from backend category config by name
            category_key = next(
                (key for key, cat in CATEGORIES.items() if cat.name == category_name),
                # Fallback to a normalized version of the name to avoid crashes
                category_name.lower().replace(" ", "_")
            )
            
            budgets.append(Budget(
                id=str(row["id"]),
                user_id=row["user_id"],
                category_key=category_key,
                amount=float(row["amount"]),
                created_at=row["created_at"],
                updated_at=row.get("created_at")  # Schema doesn't have updated_at
            ))
        
        return budgets
    
    async def get_budgets_with_expenses(self, user_id: str, month: Optional[int] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get budgets with current expenses and percentages for the specified month/year"""
        # Build date filter for current month if not specified
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year
        
        query = """
            SELECT 
                b.id,
                b.user_id,
                b.amount as budget_amount,
                b.period,
                b.created_at,
                c.id as category_id,
                c.name as category_name,
                COALESCE(SUM(CASE 
                    WHEN t.type = 'expense' 
                    AND EXTRACT(MONTH FROM t.occurred_at) = $2
                    AND EXTRACT(YEAR FROM t.occurred_at) = $3
                    THEN t.amount 
                    ELSE 0 
                END), 0) as spent_amount
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN transactions t ON (
                t.user_id = b.user_id 
                AND t.category_id = b.category_id 
                AND t.type = 'expense'
            )
            WHERE b.user_id = $1
            GROUP BY b.id, b.user_id, b.amount, b.period, b.created_at, c.id, c.name
            ORDER BY b.created_at DESC
        """
        
        results = await self.neon.fetch(query, user_id, month, year)
        
        budgets_with_expenses = []
        for row in results:
            budget_amount = float(row["budget_amount"])
            spent_amount = float(row["spent_amount"])
            
            # Calculate percentage used
            percentage_used = (spent_amount / budget_amount * 100) if budget_amount > 0 else 0.0
            remaining = budget_amount - spent_amount
            is_over_budget = spent_amount > budget_amount
            
            category_name = row.get("category_name", "other")
            category_key = next(
                (key for key, cat in CATEGORIES.items() if cat.name == category_name),
                category_name.lower().replace(" ", "_")
            )
            
            budgets_with_expenses.append({
                "id": str(row["id"]),
                "user_id": row["user_id"],
                "category_id": str(row["category_id"]) if row["category_id"] else None,
                "category_key": category_key,
                "category_name": category_name,
                "budget_amount": budget_amount,
                "spent_amount": spent_amount,
                "remaining": remaining,
                "percentage_used": round(percentage_used, 2),
                "is_over_budget": is_over_budget,
                "period": row.get("period", "monthly"),
                "month": month,
                "year": year,
                "created_at": row["created_at"]
            })
        
        return budgets_with_expenses
    
    async def get_budget(self, budget_id: str, user_id: str) -> Optional[Budget]:
        """Get budget by ID"""
        query = """
            SELECT b.*, c.name as category_name
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = $1 AND b.user_id = $2
        """
        
        result = await self.neon.fetchrow(query, budget_id, user_id)
        if result:
            category_name = result.get("category_name", "other")
            category_key = category_name.lower().replace(" ", "_")
            
            return Budget(
                id=str(result["id"]),
                user_id=result["user_id"],
                category_key=category_key,
                amount=float(result["amount"]),
                created_at=result["created_at"],
                updated_at=result.get("created_at")
            )
        return None
    
    async def create_budget(self, budget_data: BudgetCreate, user_id: str) -> Budget:
        """Create a new budget"""
        # Get category by name/key
        category_id = await self._get_category_id_by_key(budget_data.category_key, user_id)
        
        if not category_id:
            raise Exception(f"Category not found: {budget_data.category_key}")
        
        # Check if budget already exists for this category and period (default monthly)
        existing = await self.neon.fetchrow(
            """
            SELECT id FROM budgets
            WHERE user_id = $1 AND category_id = $2 AND period = 'monthly'
            """,
            user_id,
            category_id
        )
        
        budget_id = str(uuid.uuid4())
        
        if existing:
            # Update existing budget
            query = """
                UPDATE budgets
                SET amount = $1
                WHERE id = $2
                RETURNING *
            """
            result = await self.neon.fetchrow(query, float(budget_data.amount), existing["id"])
        else:
            # Create new budget
            query = """
                INSERT INTO budgets (id, user_id, category_id, amount, period, created_at)
                VALUES ($1, $2, $3, $4, 'monthly', NOW())
                RETURNING *
            """
            result = await self.neon.fetchrow(
                query,
                budget_id,
                user_id,
                category_id,
                float(budget_data.amount)
            )
        
        if result:
            return Budget(
                id=str(result["id"]),
                user_id=result["user_id"],
                category_key=budget_data.category_key,
                amount=float(result["amount"]),
                created_at=result["created_at"],
                updated_at=result.get("created_at")
            )
        raise Exception("Failed to create budget")
    
    async def update_budget(self, budget_id: str, budget_data: BudgetUpdate, user_id: str) -> Optional[Budget]:
        """Update a budget"""
        if budget_data.amount is None:
            return await self.get_budget(budget_id, user_id)
        
        query = """
            UPDATE budgets
            SET amount = $1
            WHERE id = $2 AND user_id = $3
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, float(budget_data.amount), budget_id, user_id)
        if result:
            # Get category name
            cat = await self.neon.fetchrow(
                "SELECT name FROM categories WHERE id = $1",
                result["category_id"]
            )
            category_key = cat["name"].lower().replace(" ", "_") if cat else "other"
            
            return Budget(
                id=str(result["id"]),
                user_id=result["user_id"],
                category_key=category_key,
                amount=float(result["amount"]),
                created_at=result["created_at"],
                updated_at=result.get("created_at")
            )
        return None
    
    async def delete_budget(self, budget_id: str, user_id: str) -> bool:
        """Delete a budget"""
        query = """
            DELETE FROM budgets
            WHERE id = $1 AND user_id = $2
            RETURNING id
        """
        
        result = await self.neon.fetchrow(query, budget_id, user_id)
        return result is not None
    
    async def _get_category_id_by_key(self, category_key: str, user_id: str) -> Optional[str]:
        """Get category ID by stable key, falling back to name heuristics.

        This uses the shared backend category config so that keys like
        'bar_restaurant' reliably map to the DB category named
        'Bar and restaurant', instead of relying on fragile string
        transformations.
        """
        # First, try to resolve via the canonical config (for built‑in categories)
        category_info = CATEGORIES.get(category_key)
        if category_info:
            category = await self.neon.fetchrow(
                """
                SELECT id FROM categories
                WHERE name = $1 AND (user_id = $2 OR user_id IS NULL)
                LIMIT 1
                """,
                category_info.name,
                user_id,
            )
            if category:
                return str(category["id"])

        # Fallback: previous heuristic for any custom / user-defined categories
        category_name = category_key.replace("_", " ").title()

        category = await self.neon.fetchrow(
            """
            SELECT id FROM categories
            WHERE (name ILIKE $1 OR name ILIKE $2) AND (user_id = $3 OR user_id IS NULL)
            LIMIT 1
            """,
            category_key,
            category_name,
            user_id,
        )

        if category:
            return str(category["id"])

        return None
    
    async def get_user_income(self, user_id: str) -> Dict[str, Any]:
        """Get user income (stored target income or default 0)"""
        # Get stored income from user_income table
        query = """
            SELECT monthly_income, currency
            FROM user_income
            WHERE user_id = $1
        """
        
        result = await self.neon.fetchrow(query, user_id)
        
        if result:
            return {
                "user_id": user_id,
                "monthly_income": float(result["monthly_income"]),
                "currency": result.get("currency", "EUR")
            }
        else:
            # Return default if no income is set
            return {
                "user_id": user_id,
                "monthly_income": 0.0,
                "currency": "EUR"
            }
    
    async def update_user_income(self, user_id: str, income_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update or create user income - stores expected/target income"""
        monthly_income = income_data.get("monthly_income", 0.0)
        currency = income_data.get("currency", "EUR")
        
        # Check if income record exists
        existing = await self.neon.fetchrow(
            "SELECT user_id FROM user_income WHERE user_id = $1",
            user_id
        )
        
        if existing:
            # Update existing income
            query = """
                UPDATE user_income
                SET monthly_income = $1, currency = $2, updated_at = NOW()
                WHERE user_id = $3
                RETURNING monthly_income, currency
            """
            result = await self.neon.fetchrow(query, float(monthly_income), currency, user_id)
        else:
            # Create new income record
            query = """
                INSERT INTO user_income (user_id, monthly_income, currency, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING monthly_income, currency
            """
            result = await self.neon.fetchrow(query, user_id, float(monthly_income), currency)
        
        if result:
            return {
                "user_id": user_id,
                "monthly_income": float(result["monthly_income"]),
                "currency": result.get("currency", "EUR")
            }
        
        raise Exception("Failed to update user income")

