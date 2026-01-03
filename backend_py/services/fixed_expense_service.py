"""
Fixed expense service for managing recurring expenses
"""

from typing import List, Optional, Dict, Any
from database.neon_client import get_neon
from datetime import datetime, date, timedelta
import uuid
import logging
import calendar

logger = logging.getLogger(__name__)

class FixedExpenseService:
    """Service for managing fixed/recurring expenses"""
    
    def __init__(self):
        self.neon = get_neon()
    
    async def get_fixed_expenses(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all fixed expenses for a user"""
        query = """
            SELECT 
                fe.id,
                fe.user_id,
                fe.amount,
                fe.description,
                fe.fixed_interval,
                fe.fixed_day_of_month,
                fe.fixed_day_of_week,
                fe.is_active,
                fe.currency,
                fe.created_at,
                fe.updated_at,
                c.id as category_id,
                c.name as category_name
            FROM fixed_expenses fe
            LEFT JOIN categories c ON fe.category_id = c.id
            WHERE fe.user_id = $1
            ORDER BY 
                CASE fe.fixed_interval
                    WHEN 'daily' THEN 1
                    WHEN 'weekly' THEN 2
                    WHEN 'monthly' THEN 3
                    WHEN 'yearly' THEN 4
                END,
                fe.fixed_day_of_month ASC NULLS LAST,
                fe.created_at DESC
        """
        
        results = await self.neon.fetch(query, user_id)
        fixed_expenses = []
        
        for row in results:
            fixed_expenses.append({
                "id": str(row["id"]),
                "user_id": str(row["user_id"]),
                "category_id": str(row["category_id"]) if row["category_id"] else None,
                "category_name": row.get("category_name", "Uncategorized"),
                "amount": float(row["amount"]),
                "description": row.get("description", ""),
                "fixed_interval": row.get("fixed_interval", "monthly"),
                "day_of_month": row.get("fixed_day_of_month"),
                "day_of_week": row.get("fixed_day_of_week"),
                "is_active": row.get("is_active", True),
                "currency": row.get("currency", "EUR"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at")
            })
        
        return fixed_expenses
    
    async def get_fixed_expense(self, fixed_expense_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific fixed expense by ID"""
        query = """
            SELECT 
                fe.id,
                fe.user_id,
                fe.amount,
                fe.description,
                fe.fixed_interval,
                fe.fixed_day_of_month,
                fe.fixed_day_of_week,
                fe.is_active,
                fe.currency,
                fe.created_at,
                fe.updated_at,
                c.id as category_id,
                c.name as category_name
            FROM fixed_expenses fe
            LEFT JOIN categories c ON fe.category_id = c.id
            WHERE fe.id = $1 
            AND fe.user_id = $2
        """
        
        result = await self.neon.fetchrow(query, fixed_expense_id, user_id)
        if result:
            return {
                "id": str(result["id"]),
                "user_id": str(result["user_id"]),
                "category_id": str(result["category_id"]) if result["category_id"] else None,
                "category_name": result.get("category_name", "Uncategorized"),
                "amount": float(result["amount"]),
                "description": result.get("description", ""),
                "fixed_interval": result.get("fixed_interval", "monthly"),
                "day_of_month": result.get("fixed_day_of_month"),
                "day_of_week": result.get("fixed_day_of_week"),
                "is_active": result.get("is_active", True),
                "currency": result.get("currency", "EUR"),
                "created_at": result.get("created_at"),
                "updated_at": result.get("updated_at")
            }
        return None
    
    async def create_fixed_expense(self, fixed_expense_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Create a new fixed expense"""
        # Get or create category
        category_id = await self._get_or_create_category(
            fixed_expense_data.get("category") or fixed_expense_data.get("category_name"),
            user_id
        )
        
        # Get currency (default to EUR)
        currency_code = fixed_expense_data.get("currency", "EUR")
        
        # Get fixed_interval (default to monthly)
        fixed_interval = fixed_expense_data.get("fixed_interval", "monthly")
        if fixed_interval not in ['daily', 'weekly', 'monthly', 'yearly']:
            raise ValueError("fixed_interval must be one of: daily, weekly, monthly, yearly")
        
        # Validate and get day_of_month (required for monthly/yearly)
        day_of_month = fixed_expense_data.get("day_of_month")
        if fixed_interval in ['monthly', 'yearly']:
            if not day_of_month or day_of_month < 1 or day_of_month > 31:
                raise ValueError("day_of_month must be between 1 and 31 for monthly/yearly intervals")
        
        # Validate and get day_of_week (required for weekly)
        day_of_week = fixed_expense_data.get("day_of_week")
        if fixed_interval == 'weekly':
            if day_of_week is None or day_of_week < 0 or day_of_week > 6:
                raise ValueError("day_of_week must be between 0 (Sunday) and 6 (Saturday) for weekly interval")
        
        # Create fixed expense template
        fixed_expense_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO fixed_expenses (
                id, user_id, category_id, amount, currency, description,
                fixed_interval, fixed_day_of_month, fixed_day_of_week, is_active,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
        """
        
        result = await self.neon.fetchrow(
            query,
            fixed_expense_id,
            user_id,
            category_id,
            float(fixed_expense_data["amount"]),
            currency_code,
            fixed_expense_data.get("description", ""),
            fixed_interval,
            day_of_month if fixed_interval in ['monthly', 'yearly'] else None,
            day_of_week if fixed_interval == 'weekly' else None,
            fixed_expense_data.get("is_active", True)
        )
        
        if result:
            # Get category name
            cat = await self.neon.fetchrow("SELECT name FROM categories WHERE id = $1", category_id)
            category_name = cat["name"] if cat else "Uncategorized"
            
            return {
                "id": str(result["id"]),
                "user_id": str(result["user_id"]),
                "category_id": str(category_id),
                "category_name": category_name,
                "amount": float(result["amount"]),
                "description": result.get("description", ""),
                "fixed_interval": result.get("fixed_interval", "monthly"),
                "day_of_month": result.get("fixed_day_of_month"),
                "day_of_week": result.get("fixed_day_of_week"),
                "is_active": result.get("is_active", True),
                "currency": currency_code,
                "created_at": result.get("created_at"),
                "updated_at": result.get("updated_at")
            }
        raise Exception("Failed to create fixed expense")
    
    async def update_fixed_expense(self, fixed_expense_id: str, fixed_expense_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """Update an existing fixed expense"""
        updates = []
        values = []
        param_index = 1
        
        if "amount" in fixed_expense_data:
            updates.append(f"amount = ${param_index}")
            values.append(float(fixed_expense_data["amount"]))
            param_index += 1
        
        if "description" in fixed_expense_data:
            updates.append(f"description = ${param_index}")
            values.append(fixed_expense_data["description"])
            param_index += 1
        
        if "fixed_interval" in fixed_expense_data:
            fixed_interval = fixed_expense_data["fixed_interval"]
            if fixed_interval not in ['daily', 'weekly', 'monthly', 'yearly']:
                raise ValueError("fixed_interval must be one of: daily, weekly, monthly, yearly")
            updates.append(f"fixed_interval = ${param_index}")
            values.append(fixed_interval)
            param_index += 1
        
        if "day_of_month" in fixed_expense_data:
            day_of_month = fixed_expense_data["day_of_month"]
            if day_of_month is not None and (day_of_month < 1 or day_of_month > 31):
                raise ValueError("day_of_month must be between 1 and 31")
            updates.append(f"fixed_day_of_month = ${param_index}")
            values.append(day_of_month)
            param_index += 1
        
        if "day_of_week" in fixed_expense_data:
            day_of_week = fixed_expense_data["day_of_week"]
            if day_of_week is not None and (day_of_week < 0 or day_of_week > 6):
                raise ValueError("day_of_week must be between 0 (Sunday) and 6 (Saturday)")
            updates.append(f"fixed_day_of_week = ${param_index}")
            values.append(day_of_week)
            param_index += 1
        
        if "is_active" in fixed_expense_data:
            updates.append(f"is_active = ${param_index}")
            values.append(fixed_expense_data["is_active"])
            param_index += 1
        
        if "category" in fixed_expense_data or "category_name" in fixed_expense_data:
            category_name = fixed_expense_data.get("category") or fixed_expense_data.get("category_name")
            category_id = await self._get_or_create_category(category_name, user_id)
            updates.append(f"category_id = ${param_index}")
            values.append(category_id)
            param_index += 1
        
        if "currency" in fixed_expense_data:
            currency_code = fixed_expense_data["currency"]
            updates.append(f"currency = ${param_index}")
            values.append(currency_code)
            param_index += 1
        
        if not updates:
            return await self.get_fixed_expense(fixed_expense_id, user_id)
        
        updates.append("updated_at = NOW()")
        
        where_param1 = param_index
        where_param2 = param_index + 1
        values.extend([fixed_expense_id, user_id])
        
        query = f"""
            UPDATE fixed_expenses
            SET {', '.join(updates)}
            WHERE id = ${where_param1} AND user_id = ${where_param2}
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, *values)
        if result:
            return await self.get_fixed_expense(fixed_expense_id, user_id)
        return None
    
    async def delete_fixed_expense(self, fixed_expense_id: str, user_id: str) -> bool:
        """Soft delete a fixed expense (set is_active=false)"""
        query = """
            UPDATE fixed_expenses
            SET is_active = false, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING id
        """
        
        result = await self.neon.fetchrow(query, fixed_expense_id, user_id)
        return result is not None
    
    async def apply_fixed_expenses_for_month(self, user_id: str, year: int, month: int) -> int:
        """Apply fixed expenses for a given month/year. Returns count of transactions created."""
        # Get all active fixed expenses for the user
        fixed_expenses = await self.get_fixed_expenses(user_id)
        active_fixed_expenses = [fe for fe in fixed_expenses if fe.get("is_active", True)]
        
        if not active_fixed_expenses:
            return 0
        
        created_count = 0
        
        for fixed_expense in active_fixed_expenses:
            try:
                fixed_interval = fixed_expense.get("fixed_interval", "monthly")
                
                # Determine dates to apply based on interval
                dates_to_apply = []
                
                if fixed_interval == "daily":
                    # Apply every day of the month
                    last_day = calendar.monthrange(year, month)[1]
                    dates_to_apply = [date(year, month, day) for day in range(1, last_day + 1)]
                
                elif fixed_interval == "weekly":
                    # Apply on specified day of week
                    day_of_week = fixed_expense.get("day_of_week")
                    if day_of_week is None:
                        logger.warning(f"Fixed expense {fixed_expense['id']} has weekly interval but no day_of_week")
                        continue
                    
                    # Find all occurrences of this day of week in the month
                    first_day = date(year, month, 1)
                    last_day = calendar.monthrange(year, month)[1]
                    
                    # Find first occurrence of the day
                    days_ahead = (day_of_week - first_day.weekday()) % 7
                    first_occurrence = first_day + timedelta(days=days_ahead)
                    
                    current = first_occurrence
                    while current.month == month:
                        dates_to_apply.append(current)
                        current += timedelta(days=7)
                
                elif fixed_interval == "monthly":
                    # Apply on specified day of month
                    day_of_month = fixed_expense.get("day_of_month", 1)
                    last_day_of_month = calendar.monthrange(year, month)[1]
                    actual_day = min(day_of_month, last_day_of_month)
                    dates_to_apply = [date(year, month, actual_day)]
                
                elif fixed_interval == "yearly":
                    # Apply on specified month/day (only if this is the correct month)
                    day_of_month = fixed_expense.get("day_of_month", 1)
                    # For yearly, we'd need to store the month as well
                    # For now, assume it applies in the current month if day matches
                    # This is a simplification - ideally we'd store the month in the template
                    last_day_of_month = calendar.monthrange(year, month)[1]
                    actual_day = min(day_of_month, last_day_of_month)
                    dates_to_apply = [date(year, month, actual_day)]
                
                if not dates_to_apply:
                    continue
                
                # Get or create default account
                account_id = await self._get_or_create_default_account(user_id)
                currency_code = fixed_expense.get("currency", "EUR")
                
                # Create transactions for each date
                for transaction_date in dates_to_apply:
                    # Check if transaction already exists
                    existing = await self.neon.fetchrow(
                        """
                        SELECT id FROM transactions
                        WHERE user_id = $1
                        AND category_id = $2
                        AND amount = $3
                        AND description = $4
                        AND DATE(occurred_at) = $5
                        AND type = 'expense'
                        LIMIT 1
                        """,
                        user_id,
                        fixed_expense["category_id"],
                        fixed_expense["amount"],
                        fixed_expense["description"],
                        transaction_date
                    )
                    
                    if existing:
                        logger.debug(f"Transaction already exists for fixed expense {fixed_expense['id']} on {transaction_date}")
                        continue
                    
                    # Create the expense transaction
                    # Mark as fixed expense since it comes from a fixed expense template
                    transaction_id = str(uuid.uuid4())
                    
                    query = """
                        INSERT INTO transactions (
                            id, user_id, account_id, category_id, type, amount, 
                            currency, description, occurred_at, is_fixed, created_at
                        )
                        VALUES ($1, $2, $3, $4, 'expense', $5, $6, $7, $8, true, NOW())
                        RETURNING id
                    """
                    
                    occurred_at = datetime.combine(transaction_date, datetime.min.time())
                    result = await self.neon.fetchrow(
                        query,
                        transaction_id,
                        user_id,
                        account_id,
                        fixed_expense["category_id"],
                        fixed_expense["amount"],
                        currency_code,
                        fixed_expense["description"],
                        occurred_at
                    )
                    
                    if result:
                        created_count += 1
                        logger.info(f"Created transaction from fixed expense {fixed_expense['id']} for {transaction_date}")
                
            except Exception as e:
                logger.error(f"Error applying fixed expense {fixed_expense.get('id')}: {e}")
                continue
        
        return created_count
    
    async def _get_or_create_category(self, category_name: str, user_id: str) -> str:
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
    
    async def _get_or_create_default_account(self, user_id: str) -> str:
        """Get or create a default account for the user (following expense_service pattern)"""
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
