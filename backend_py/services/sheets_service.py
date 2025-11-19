"""
Google Sheets service (optional integration)
"""

import logging

logger = logging.getLogger(__name__)

class SheetsService:
    """Service for Google Sheets integration"""
    
    def __init__(self):
        self.enabled = False  # Disabled by default
    
    async def add_expense(self, expense, user_id: str):
        """Add expense to Google Sheets"""
        if not self.enabled:
            return
        # Placeholder for Google Sheets integration
        pass
    
    async def update_expense(self, expense, user_id: str):
        """Update expense in Google Sheets"""
        if not self.enabled:
            return
        # Placeholder for Google Sheets integration
        pass
    
    async def delete_expense(self, expense_id: str, user_id: str):
        """Delete expense from Google Sheets"""
        if not self.enabled:
            return
        # Placeholder for Google Sheets integration
        pass

