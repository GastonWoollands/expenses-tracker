"""
Expense service for managing expenses (mapped to transactions table)
"""

from typing import List, Optional, Dict, Any
from database.neon_client import get_neon
from models.expense import Expense, ExpenseCreate, ExpenseUpdate
from datetime import datetime, timedelta, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

class ExpenseService:
    """Service for managing expenses"""
    
    def __init__(self):
        self.neon = get_neon()
    
    def _ensure_naive_utc(self, dt: Optional[datetime]) -> Optional[datetime]:
        """Convert timezone-aware datetime to naive UTC datetime for PostgreSQL"""
        if dt is None:
            return None
        if dt.tzinfo is not None:
            # Convert to UTC and remove timezone info
            dt = dt.astimezone(timezone.utc)
            return dt.replace(tzinfo=None)
        return dt
    
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
        """Get expense by ID"""
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
    
    async def get_user_expenses(
        self, 
        user_id: str, 
        limit: int = 100, 
        offset: int = 0,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Expense]:
        """Get user expenses with pagination"""
        # Build query with optional date filtering
        params = [user_id]
        param_index = 2
        
        query_parts = [
            """
            SELECT t.*, c.name as category_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1 AND t.type = 'expense'
            """
        ]
        
        # Add date filtering if provided
        if start_date:
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            start_date = self._ensure_naive_utc(start_date)
            query_parts.append(f"AND t.occurred_at >= ${param_index}")
            params.append(start_date)
            param_index += 1
        
        if end_date:
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            end_date = self._ensure_naive_utc(end_date)
            query_parts.append(f"AND t.occurred_at <= ${param_index}")
            params.append(end_date)
            param_index += 1
        
        query_parts.append("ORDER BY t.occurred_at DESC")
        query_parts.append(f"LIMIT ${param_index} OFFSET ${param_index + 1}")
        params.extend([limit, offset])
        
        query = " ".join(query_parts)
        results = await self.neon.fetch(query, *params)
        
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
        """Get expense summary for analytics"""
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
    
    async def get_category_breakdown(
        self, 
        user_id: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        expense_type: Optional[str] = None,
        categories: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Get expense breakdown by category"""
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
        
        params = [user_id]
        param_index = 2
        
        # Note: expense_type filtering removed - templates no longer in transactions table
        # Fixed vs variable distinction now determined by matching against fixed_expenses table
        
        # Date range filter
        if start_date:
            start_date = self._ensure_naive_utc(start_date)
            query_parts.append(f"AND t.occurred_at >= ${param_index}")
            params.append(start_date)
            param_index += 1
        
        if end_date:
            end_date = self._ensure_naive_utc(end_date)
            query_parts.append(f"AND t.occurred_at <= ${param_index}")
            params.append(end_date)
            param_index += 1
        
        # Category filter
        if categories and len(categories) > 0:
            placeholders = ','.join([f"${i}" for i in range(param_index, param_index + len(categories))])
            query_parts.append(f"AND c.name IN ({placeholders})")
            params.extend(categories)
            param_index += len(categories)
        
        # Amount range filter
        if min_amount is not None:
            query_parts.append(f"AND t.amount >= ${param_index}")
            params.append(min_amount)
            param_index += 1
        
        if max_amount is not None:
            query_parts.append(f"AND t.amount <= ${param_index}")
            params.append(max_amount)
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
    
    async def get_expense_trends(
        self, 
        user_id: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        expense_type: Optional[str] = None,  # 'fixed', 'variable', or None for all
        categories: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Get monthly spending trends over time (defaults to last 6 months if no date range)"""
        # If no date range provided, default to last 6 months
        if not start_date or not end_date:
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=180)  # ~6 months
        
        # Determine if we need category join
        needs_category_join = categories and len(categories) > 0
        
        query_parts = [
            """
            SELECT 
                DATE_TRUNC('month', occurred_at) as month,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions"""
        ]
        
        if needs_category_join:
            query_parts[0] += " t LEFT JOIN categories c ON t.category_id = c.id"
            query_parts[0] += "\n            WHERE t.user_id = $1 AND t.type = 'expense'"
        else:
            query_parts[0] += "\n            WHERE user_id = $1 AND type = 'expense'"
        
        params = [user_id]
        param_index = 2
        
        table_prefix = "t." if needs_category_join else ""
        
        # Note: expense_type filtering removed - templates no longer in transactions table
        # Fixed vs variable distinction now determined by matching against fixed_expenses table
        
        if start_date:
            # Ensure timezone-aware datetime, then convert to naive UTC
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            start_date = self._ensure_naive_utc(start_date)
            query_parts.append(f"AND {table_prefix}occurred_at >= ${param_index}")
            params.append(start_date)
            param_index += 1
        
        if end_date:
            # Ensure timezone-aware datetime, then convert to naive UTC
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            end_date = self._ensure_naive_utc(end_date)
            query_parts.append(f"AND {table_prefix}occurred_at <= ${param_index}")
            params.append(end_date)
            param_index += 1
        
        # Category filter
        if categories and len(categories) > 0:
            placeholders = ','.join([f"${i}" for i in range(param_index, param_index + len(categories))])
            query_parts.append(f"AND c.name IN ({placeholders})")
            params.extend(categories)
            param_index += len(categories)
        
        # Amount range filter
        if min_amount is not None:
            query_parts.append(f"AND {table_prefix}amount >= ${param_index}")
            params.append(min_amount)
            param_index += 1
        
        if max_amount is not None:
            query_parts.append(f"AND {table_prefix}amount <= ${param_index}")
            params.append(max_amount)
            param_index += 1
        
        query_parts.append(f"GROUP BY DATE_TRUNC('month', {table_prefix}occurred_at) ORDER BY month ASC")
        query = " ".join(query_parts)
        
        results = await self.neon.fetch(query, *params)
        
        trends = []
        for row in results:
            trends.append({
                "month": row["month"].strftime("%Y-%m") if row["month"] else None,
                "total_amount": float(row["total_amount"] or 0),
                "count": row["count"] or 0
            })
        
        return trends
    
    async def get_spending_patterns(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        expense_type: Optional[str] = None,  # 'fixed', 'variable', or None for all
        categories: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None
    ) -> Dict[str, Any]:
        """Get spending patterns by day of week and time of month"""
        # Determine if we need category join
        needs_category_join = categories and len(categories) > 0
        
        query_parts = [
            """
            SELECT 
                EXTRACT(DOW FROM occurred_at) as day_of_week,
                CASE 
                    WHEN EXTRACT(DAY FROM occurred_at) <= 10 THEN 'beginning'
                    WHEN EXTRACT(DAY FROM occurred_at) <= 20 THEN 'middle'
                    ELSE 'end'
                END as time_of_month,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM transactions"""
        ]
        
        if needs_category_join:
            query_parts[0] += " t LEFT JOIN categories c ON t.category_id = c.id"
            query_parts[0] += "\n            WHERE t.user_id = $1 AND t.type = 'expense'"
        else:
            query_parts[0] += "\n            WHERE user_id = $1 AND type = 'expense'"
        
        params = [user_id]
        param_index = 2
        
        table_prefix = "t." if needs_category_join else ""
        
        # Note: expense_type filtering removed - templates no longer in transactions table
        
        if start_date:
            # Ensure timezone-aware datetime, then convert to naive UTC
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            start_date = self._ensure_naive_utc(start_date)
            query_parts.append(f"AND {table_prefix}occurred_at >= ${param_index}")
            params.append(start_date)
            param_index += 1
        
        if end_date:
            # Ensure timezone-aware datetime, then convert to naive UTC
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            end_date = self._ensure_naive_utc(end_date)
            query_parts.append(f"AND {table_prefix}occurred_at <= ${param_index}")
            params.append(end_date)
            param_index += 1
        
        # Category filter
        if categories and len(categories) > 0:
            placeholders = ','.join([f"${i}" for i in range(param_index, param_index + len(categories))])
            query_parts.append(f"AND c.name IN ({placeholders})")
            params.extend(categories)
            param_index += len(categories)
        
        # Amount range filter
        if min_amount is not None:
            query_parts.append(f"AND {table_prefix}amount >= ${param_index}")
            params.append(min_amount)
            param_index += 1
        
        if max_amount is not None:
            query_parts.append(f"AND {table_prefix}amount <= ${param_index}")
            params.append(max_amount)
            param_index += 1
        
        query_parts.append("GROUP BY day_of_week, time_of_month")
        query = " ".join(query_parts)
        
        results = await self.neon.fetch(query, *params)
        
        # Organize by day of week (0=Sunday, 6=Saturday)
        day_of_week_data = {i: {"total_amount": 0.0, "count": 0} for i in range(7)}
        day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        # Organize by time of month
        time_of_month_data = {
            "beginning": {"total_amount": 0.0, "count": 0},
            "middle": {"total_amount": 0.0, "count": 0},
            "end": {"total_amount": 0.0, "count": 0}
        }
        
        for row in results:
            dow = int(row["day_of_week"])
            if dow in day_of_week_data:
                day_of_week_data[dow]["total_amount"] += float(row["total_amount"] or 0)
                day_of_week_data[dow]["count"] += row["count"] or 0
            
            tom = row["time_of_month"]
            if tom in time_of_month_data:
                time_of_month_data[tom]["total_amount"] += float(row["total_amount"] or 0)
                time_of_month_data[tom]["count"] += row["count"] or 0
        
        # Format day of week data
        day_of_week_formatted = [
            {
                "day": day_names[i],
                "day_index": i,
                "total_amount": day_of_week_data[i]["total_amount"],
                "count": day_of_week_data[i]["count"],
                "average": day_of_week_data[i]["total_amount"] / max(day_of_week_data[i]["count"], 1)
            }
            for i in range(7)
        ]
        
        # Format time of month data
        time_of_month_formatted = [
            {
                "period": key,
                "total_amount": value["total_amount"],
                "count": value["count"],
                "average": value["total_amount"] / max(value["count"], 1)
            }
            for key, value in time_of_month_data.items()
        ]
        
        return {
            "day_of_week": day_of_week_formatted,
            "time_of_month": time_of_month_formatted
        }
    
    async def get_top_categories_with_trends(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        expense_type: Optional[str] = None,  # 'fixed', 'variable', or None for all
        categories: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top categories with trend indicators (comparing current period to previous)"""
        # Calculate previous period dates
        # Ensure all datetimes are timezone-aware (UTC), then convert to naive for PostgreSQL
        if start_date and end_date:
            # Make sure dates are timezone-aware
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            
            period_days = (end_date - start_date).days
            prev_end_date = start_date
            prev_start_date = start_date - timedelta(days=period_days)
            
            # Convert to naive UTC for PostgreSQL
            start_date_naive = self._ensure_naive_utc(start_date)
            end_date_naive = self._ensure_naive_utc(end_date)
            prev_end_date_naive = self._ensure_naive_utc(prev_end_date)
            prev_start_date_naive = self._ensure_naive_utc(prev_start_date)
        else:
            # Default to last 30 days vs previous 30 days
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=30)
            prev_end_date = start_date
            prev_start_date = prev_end_date - timedelta(days=30)
            
            # Convert to naive UTC for PostgreSQL
            start_date_naive = self._ensure_naive_utc(start_date)
            end_date_naive = self._ensure_naive_utc(end_date)
            prev_end_date_naive = self._ensure_naive_utc(prev_end_date)
            prev_start_date_naive = self._ensure_naive_utc(prev_start_date)
        
        # Current period query
        query_parts = [
            """
            SELECT 
                c.name as category,
                SUM(t.amount) as total_amount,
                COUNT(*) as count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1 AND t.type = 'expense'
            """
        ]
        
        params = [user_id]
        param_index = 2
        
        # Note: expense_type filtering removed - templates no longer in transactions table
        
        query_parts.append(f"AND t.occurred_at >= ${param_index}")
        params.append(start_date_naive)
        param_index += 1
        
        query_parts.append(f"AND t.occurred_at <= ${param_index}")
        params.append(end_date_naive)
        param_index += 1
        
        # Category filter
        if categories and len(categories) > 0:
            placeholders = ','.join([f"${i}" for i in range(param_index, param_index + len(categories))])
            query_parts.append(f"AND c.name IN ({placeholders})")
            params.extend(categories)
            param_index += len(categories)
        
        # Amount range filter
        if min_amount is not None:
            query_parts.append(f"AND t.amount >= ${param_index}")
            params.append(min_amount)
            param_index += 1
        
        if max_amount is not None:
            query_parts.append(f"AND t.amount <= ${param_index}")
            params.append(max_amount)
            param_index += 1
        
        query_parts.append("GROUP BY c.name ORDER BY total_amount DESC LIMIT $%d" % param_index)
        params.append(limit)
        
        query = " ".join(query_parts)
        current_results = await self.neon.fetch(query, *params)
        
        # Previous period query (same structure)
        prev_params = [user_id]
        prev_param_index = 2
        
        prev_query_parts = [
            """
            SELECT 
                c.name as category,
                SUM(t.amount) as total_amount
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1 AND t.type = 'expense'
            """
        ]
        
        # Note: expense_type filtering removed - templates no longer in transactions table
        
        prev_query_parts.append(f"AND t.occurred_at >= ${prev_param_index}")
        prev_params.append(prev_start_date_naive)
        prev_param_index += 1
        
        prev_query_parts.append(f"AND t.occurred_at < ${prev_param_index}")
        prev_params.append(prev_end_date_naive)
        prev_param_index += 1
        
        # Category filter (same for previous period)
        if categories and len(categories) > 0:
            placeholders = ','.join([f"${i}" for i in range(prev_param_index, prev_param_index + len(categories))])
            prev_query_parts.append(f"AND c.name IN ({placeholders})")
            prev_params.extend(categories)
            prev_param_index += len(categories)
        
        # Amount range filter (same for previous period)
        if min_amount is not None:
            prev_query_parts.append(f"AND t.amount >= ${prev_param_index}")
            prev_params.append(min_amount)
            prev_param_index += 1
        
        if max_amount is not None:
            prev_query_parts.append(f"AND t.amount <= ${prev_param_index}")
            prev_params.append(max_amount)
            prev_param_index += 1
        
        prev_query_parts.append("GROUP BY c.name")
        prev_query = " ".join(prev_query_parts)
        prev_results = await self.neon.fetch(prev_query, *prev_params)
        
        # Create a map of previous period data
        prev_map = {row["category"] or "Uncategorized": float(row["total_amount"] or 0) for row in prev_results}
        
        # Combine current and previous data
        top_categories = []
        for row in current_results:
            category = row["category"] or "Uncategorized"
            current_amount = float(row["total_amount"] or 0)
            prev_amount = prev_map.get(category, 0.0)
            
            # Calculate trend
            if prev_amount > 0:
                trend_percentage = ((current_amount - prev_amount) / prev_amount) * 100
            elif current_amount > 0:
                trend_percentage = 100.0  # New category
            else:
                trend_percentage = 0.0
            
            top_categories.append({
                "category": category,
                "current_amount": current_amount,
                "previous_amount": prev_amount,
                "count": row["count"] or 0,
                "trend_percentage": round(trend_percentage, 2),
                "trend_direction": "up" if trend_percentage > 0 else "down" if trend_percentage < 0 else "stable"
            })
        
        return top_categories
    
    async def get_fixed_vs_variable_comparison(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        categories: Optional[List[str]] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None
    ) -> Dict[str, Any]:
        """Get comparison of fixed vs variable expenses
        
        Uses is_fixed flag directly from transactions table for simple and reliable differentiation.
        """
        # Determine if we need category join
        needs_category_join = categories and len(categories) > 0
        
        table_prefix = "t." if needs_category_join else ""
        
        # Query transactions grouped by is_fixed flag
        query_parts = [
            f"""
            SELECT 
                COALESCE({table_prefix}is_fixed, false) as is_fixed,
                SUM({table_prefix}amount) as total_amount,
                COUNT(*) as count
            FROM transactions"""
        ]
        
        if needs_category_join:
            query_parts[0] += " t LEFT JOIN categories c ON t.category_id = c.id"
            query_parts[0] += "\n            WHERE t.user_id = $1 AND t.type = 'expense'"
        else:
            query_parts[0] += "\n            WHERE user_id = $1 AND type = 'expense'"
        
        params = [user_id]
        param_index = 2
        
        # Date range filter
        if start_date:
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            start_date = self._ensure_naive_utc(start_date)
            query_parts.append(f"AND {table_prefix}occurred_at >= ${param_index}")
            params.append(start_date)
            param_index += 1
        
        if end_date:
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            end_date = self._ensure_naive_utc(end_date)
            query_parts.append(f"AND {table_prefix}occurred_at <= ${param_index}")
            params.append(end_date)
            param_index += 1
        
        # Category filter
        if categories and len(categories) > 0:
            placeholders = ','.join([f"${i}" for i in range(param_index, param_index + len(categories))])
            query_parts.append(f"AND c.name IN ({placeholders})")
            params.extend(categories)
            param_index += len(categories)
        
        # Amount range filter
        if min_amount is not None:
            query_parts.append(f"AND {table_prefix}amount >= ${param_index}")
            params.append(min_amount)
            param_index += 1
        
        if max_amount is not None:
            query_parts.append(f"AND {table_prefix}amount <= ${param_index}")
            params.append(max_amount)
            param_index += 1
        
        query_parts.append(f"GROUP BY COALESCE({table_prefix}is_fixed, false)")
        query = " ".join(query_parts)
        results = await self.neon.fetch(query, *params)
        
        # Initialize defaults
        fixed_data = {"amount": 0.0, "count": 0}
        variable_data = {"amount": 0.0, "count": 0}
        
        # Process results
        for row in results:
            is_fixed = bool(row.get("is_fixed", False))
            amount = float(row.get("total_amount", 0) or 0)
            count = int(row.get("count", 0) or 0)
            
            if is_fixed:
                fixed_data["amount"] = amount
                fixed_data["count"] = count
            else:
                variable_data["amount"] = amount
                variable_data["count"] = count
        
        total_amount = fixed_data["amount"] + variable_data["amount"]
        
        return {
            "fixed": {
                "amount": fixed_data["amount"],
                "count": fixed_data["count"],
                "percentage": (fixed_data["amount"] / total_amount * 100) if total_amount > 0 else 0.0
            },
            "variable": {
                "amount": variable_data["amount"],
                "count": variable_data["count"],
                "percentage": (variable_data["amount"] / total_amount * 100) if total_amount > 0 else 0.0
            }
        }
    
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
            is_fixed=bool(data.get("is_fixed", False)),  # Get from database, default to False
            created_at=data.get("created_at"),
            updated_at=data.get("created_at")
        )

