"""
Google Sheets service (optional integration)
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class SheetsService:
    """Service for Google Sheets integration"""
    
    def __init__(self):
        # Check if Google Sheets credentials are available
        self.enabled = bool(os.getenv("GSHEETS_CREDENTIALS"))
        if not self.enabled:
            logger.info("Google Sheets integration disabled (GSHEETS_CREDENTIALS not set)")
        else:
            logger.info("Google Sheets integration enabled")
    
    def _get_sheets_module(self):
        """Get the sheets module from expenses_bot"""
        try:
            import sys
            from pathlib import Path
            
            # Add expenses_bot to path if needed
            expenses_bot_path = Path(__file__).parent.parent.parent / "src" / "expenses_bot"
            if str(expenses_bot_path) not in sys.path:
                sys.path.insert(0, str(expenses_bot_path))
            
            from expenses_bot.sheets import add_expense_if_missing  # type: ignore
            return add_expense_if_missing
        except Exception as e:
            logger.error(f"Failed to import sheets module: {e}")
            return None
    
    async def add_expense(self, expense, user_id: str):
        """Add expense to Google Sheets"""
        if not self.enabled:
            return
        
        try:
            add_expense_func = self._get_sheets_module()
            if not add_expense_func:
                return
            
            # Extract expense data
            category = getattr(expense, 'category', None) or expense.get('category', '')
            amount = getattr(expense, 'amount', None) or expense.get('amount', 0)
            date_str = getattr(expense, 'date', None) or expense.get('date', '')
            description = getattr(expense, 'description', None) or expense.get('description', '')
            
            # Call the synchronous function (run in executor if needed)
            import asyncio
            await asyncio.get_event_loop().run_in_executor(
                None,
                add_expense_func,
                category,
                float(amount),
                str(date_str),
                description
            )
            logger.info(f"Expense added to Google Sheets for user {user_id}")
        except Exception as e:
            logger.warning(f"Error adding expense to Google Sheets (non-critical): {e}")
    
    async def update_expense(self, expense, user_id: str):
        """Update expense in Google Sheets"""
        # Google Sheets integration doesn't support updates easily
        # For simplicity, we'll skip updates
        logger.debug("Google Sheets update not implemented (add-only mode)")
        pass
    
    async def delete_expense(self, expense_id: str, user_id: str):
        """Delete expense from Google Sheets"""
        # Google Sheets integration doesn't support deletes easily
        # For simplicity, we'll skip deletes
        logger.debug("Google Sheets delete not implemented (add-only mode)")
        pass

