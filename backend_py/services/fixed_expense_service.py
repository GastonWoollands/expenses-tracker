"""
Fixed expense service for managing recurring monthly expenses
"""

from typing import List, Optional, Dict, Any
from database.neon_client import get_neon
from datetime import datetime, date
import uuid
import logging
import calendar

logger = logging.getLogger(__name__)

class FixedExpenseService:
    """Service for managing fixed/recurring expenses"""
    
    def __init__(self):
        self.neon = get_neon()
    
    async def _has_is_fixed_column(self) -> bool:
        """Check if is_fixed column exists in transactions table"""
        try:
            check_query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'is_fixed'
            """
            result = await self.neon.fetchrow(check_query)
            return result is not None
        except Exception:
            return False
    
    async def get_fixed_expenses(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all fixed expenses for a user"""
        has_is_fixed = await self._has_is_fixed_column()
        
        if not has_is_fixed:
            # Column doesn't exist, return empty list
            logger.warning("is_fixed column does not exist in transactions table. Please run database migration.")
            return []
        
        query = """
            SELECT 
                t.id,
                t.user_id,
                t.amount,
                t.description,
                t.is_fixed,
                t.fixed_interval,
                t.fixed_day_of_month,
                t.is_active,
                COALESCE(t.currency, 'EUR') as currency,
                t.created_at,
                COALESCE(t.updated_at, t.created_at) as updated_at,
                c.id as category_id,
                c.name as category_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1 
            AND t.is_fixed = true
            AND t.type = 'expense'
            ORDER BY t.fixed_day_of_month ASC, t.created_at DESC
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
                "day_of_month": row.get("fixed_day_of_month"),
                "is_active": row.get("is_active", True),
                "currency": row.get("currency", "EUR"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at")
            })
        
        return fixed_expenses
    
    async def get_fixed_expense(self, fixed_expense_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific fixed expense by ID"""
        has_is_fixed = await self._has_is_fixed_column()
        
        if not has_is_fixed:
            return None
        
        query = """
            SELECT 
                t.id,
                t.user_id,
                t.amount,
                t.description,
                t.is_fixed,
                t.fixed_interval,
                t.fixed_day_of_month,
                t.is_active,
                COALESCE(t.currency, 'EUR') as currency,
                t.created_at,
                COALESCE(t.updated_at, t.created_at) as updated_at,
                c.id as category_id,
                c.name as category_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1 
            AND t.user_id = $2
            AND t.is_fixed = true
            AND t.type = 'expense'
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
                "day_of_month": result.get("fixed_day_of_month"),
                "is_active": result.get("is_active", True),
                "currency": result.get("currency", "EUR"),
                "created_at": result.get("created_at"),
                "updated_at": result.get("updated_at")
            }
        return None
    
    async def create_fixed_expense(self, fixed_expense_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Create a new fixed expense"""
        # Check if required columns exist
        has_is_fixed = await self._has_is_fixed_column()
        if not has_is_fixed:
            raise ValueError(
                "The 'is_fixed' column does not exist in the transactions table. "
                "Please run a database migration to add the required columns: "
                "is_fixed, fixed_interval, fixed_day_of_month"
            )
        
        # Get or create default account (following expense_service pattern)
        account_id = await self._get_or_create_default_account(user_id)
        
        # Get or create category
        category_id = await self._get_or_create_category(
            fixed_expense_data.get("category") or fixed_expense_data.get("category_name"),
            user_id
        )
        
        # Get currency (default to EUR)
        currency_code = fixed_expense_data.get("currency", "EUR")
        
        # Validate day of month
        day_of_month = fixed_expense_data.get("day_of_month")
        if not day_of_month or day_of_month < 1 or day_of_month > 31:
            raise ValueError("day_of_month must be between 1 and 31")
        
        # Create transaction with is_fixed=true
        transaction_id = str(uuid.uuid4())
        
        # Use current date as occurred_at (will be updated when applied)
        occurred_at = datetime.now()
        
        # Use the same pattern as expense_service
        query = """
            INSERT INTO transactions (
                id, user_id, account_id, category_id, type, amount, 
                currency, description, occurred_at,
                is_fixed, fixed_interval, fixed_day_of_month, is_active,
                created_at
            )
            VALUES ($1, $2, $3, $4, 'expense', $5, $6, $7, $8, true, 'monthly', $9, $10, NOW())
            RETURNING *
        """
        
        result = await self.neon.fetchrow(
            query,
            transaction_id,
            user_id,
            account_id,
            category_id,
            float(fixed_expense_data["amount"]),
            currency_code,
            fixed_expense_data.get("description", ""),
            occurred_at,
            day_of_month,
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
                "day_of_month": result.get("fixed_day_of_month"),
                "is_active": result.get("is_active", True),
                "currency": currency_code,
                "created_at": result.get("created_at"),
                "updated_at": result.get("updated_at")
            }
        raise Exception("Failed to create fixed expense")
    
    async def update_fixed_expense(self, fixed_expense_id: str, fixed_expense_data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        """Update an existing fixed expense"""
        # Check if required columns exist
        has_is_fixed = await self._has_is_fixed_column()
        if not has_is_fixed:
            raise ValueError(
                "The 'is_fixed' column does not exist in the transactions table. "
                "Please run a database migration to add the required columns."
            )
        
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
        
        if "day_of_month" in fixed_expense_data:
            day_of_month = fixed_expense_data["day_of_month"]
            if day_of_month < 1 or day_of_month > 31:
                raise ValueError("day_of_month must be between 1 and 31")
            updates.append(f"fixed_day_of_month = ${param_index}")
            values.append(day_of_month)
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
        
        # Add updated_at if column exists, otherwise skip
        # Check if updated_at column exists
        has_updated_at = False
        try:
            check_query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'updated_at'
            """
            result = await self.neon.fetchrow(check_query)
            has_updated_at = result is not None
        except Exception:
            pass
        
        if has_updated_at:
            updates.append(f"updated_at = NOW()")
        
        where_param1 = param_index
        where_param2 = param_index + 1
        values.extend([fixed_expense_id, user_id])
        
        query = f"""
            UPDATE transactions
            SET {', '.join(updates)}
            WHERE id = ${where_param1} AND user_id = ${where_param2} 
            AND is_fixed = true AND type = 'expense'
            RETURNING *
        """
        
        result = await self.neon.fetchrow(query, *values)
        if result:
            return await self.get_fixed_expense(fixed_expense_id, user_id)
        return None
    
    async def delete_fixed_expense(self, fixed_expense_id: str, user_id: str) -> bool:
        """Soft delete a fixed expense (set is_active=false)"""
        # Check if required columns exist
        has_is_fixed = await self._has_is_fixed_column()
        if not has_is_fixed:
            raise ValueError(
                "The 'is_fixed' column does not exist in the transactions table. "
                "Please run a database migration to add the required columns."
            )
        
        # Check if updated_at exists
        has_updated_at = False
        try:
            check_query = """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'updated_at'
            """
            result = await self.neon.fetchrow(check_query)
            has_updated_at = result is not None
        except Exception:
            pass
        
        if has_updated_at:
            query = """
                UPDATE transactions
                SET is_active = false, updated_at = NOW()
                WHERE id = $1 AND user_id = $2 
                AND is_fixed = true AND type = 'expense'
                RETURNING id
            """
        else:
            query = """
                UPDATE transactions
                SET is_active = false
                WHERE id = $1 AND user_id = $2 
                AND is_fixed = true AND type = 'expense'
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
        
        # Get the last day of the month to handle edge cases (e.g., Feb 30)
        last_day_of_month = calendar.monthrange(year, month)[1]
        
        created_count = 0
        
        for fixed_expense in active_fixed_expenses:
            try:
                # Determine the actual day to use
                day_of_month = fixed_expense.get("day_of_month", 1)
                actual_day = min(day_of_month, last_day_of_month)
                
                transaction_date = date(year, month, actual_day)
                
                # Check if a transaction already exists for this fixed expense in this month
                existing = await self.neon.fetchrow(
                    """
                    SELECT id FROM transactions
                    WHERE user_id = $1
                    AND category_id = $2
                    AND amount = $3
                    AND description = $4
                    AND EXTRACT(YEAR FROM occurred_at) = $5
                    AND EXTRACT(MONTH FROM occurred_at) = $6
                    AND type = 'expense'
                    LIMIT 1
                    """,
                    user_id,
                    fixed_expense["category_id"],
                    fixed_expense["amount"],
                    fixed_expense["description"],
                    year,
                    month
                )
                
                if existing:
                    logger.info(f"Transaction already exists for fixed expense {fixed_expense['id']} in {year}-{month}")
                    continue
                
                # Get currency code
                currency_code = fixed_expense.get("currency", "EUR")
                
                # Get or create default account
                account_id = await self._get_or_create_default_account(user_id)
                
                # Create the expense transaction (following expense_service pattern)
                transaction_id = str(uuid.uuid4())
                
                query = """
                    INSERT INTO transactions (
                        id, user_id, account_id, category_id, type, amount, 
                        currency, description, occurred_at, created_at
                    )
                    VALUES ($1, $2, $3, $4, 'expense', $5, $6, $7, $8, NOW())
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
                    logger.info(f"Created transaction from fixed expense {fixed_expense['id']} for {year}-{month}")
                
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
    

