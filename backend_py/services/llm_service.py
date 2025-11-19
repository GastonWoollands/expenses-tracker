"""
LLM service for AI-powered expense classification (optional)
"""

import logging

logger = logging.getLogger(__name__)

class LLMService:
    """Service for LLM-based expense classification"""
    
    def __init__(self):
        self.enabled = False  # Disabled by default
    
    async def classify_expense(self, description: str) -> dict:
        """Classify expense using LLM"""
        if not self.enabled:
            return {"category": "Uncategorized"}
        
        # Placeholder for LLM classification
        # This would integrate with an LLM service (e.g., OpenAI, Google Gemini)
        return {"category": "Uncategorized"}

