import os
import re
import json
import logging
from typing import Any, Dict, Optional
from functools import lru_cache
from agno.agent import Agent
from agno.models.google import Gemini

logger = logging.getLogger(__name__)

#--------------------------------------------------------

def _get_env(var: str, default: Optional[str] = None) -> str:
    value = os.getenv(var, default)
    if value is None:
        logger.warning(f"Environment variable {var} is not set and no default provided.")
    return value

#--------------------------------------------------------

@lru_cache(maxsize=1)
def get_agent() -> Agent:
    """Create and cache the LLM agent."""
    try:
        return Agent(
            model=Gemini(id=os.getenv("GEMINI_MODEL_BOT_EXPENSES", "gemini-2.0-flash")),
            markdown=True,
        )
    except Exception as e:
        logger.error(f"Failed to initialize LLM agent: {e}")
        raise

#--------------------------------------------------------

def _get_prompt(text: str) -> str:
    """Builds the prompt for the LLM."""
    return f"""
        You are a helpful assistant that extracts structured information from a text.
        You will be given an expense text and you need to extract the following information:
        - Category (from the list below)
        - Amount (as a number, no currency symbol)
        - Datetime (ISO format if possible)
        - Description (short description of the expense)
        
        IMPORTANT: Classify the expense into a category, if the text does not contain an expense, you should return \"Uncategorized\".
        IMPORTANT: Most texts are from Apple Pay, some are from user plain text.
        IMPORTANT: If you cannot extract a value, use null for amount and datetime, and \"Uncategorized\" for category.
        The categories are:
        - Food
        - Subscription
        - Transport
        - Housing
        - Health
        - Personal
        - Education
        - Technology
        - Shopping
        - Travel
        - Bar and restaurant
        - Leisure
        - Other

        The expensetext to classify is:
        {text}

        Return ONLY a valid JSON object in the following format (no explanation):
        Example "Expent $45 in Lolo Bar 17/05/2025" return:
        {{
            "category": "Bar and restaurant",
            "amount": 45,
            "datetime": "2025-05-17",
            "description": "Lolo bar"
        }}
    """
#--------------------------------------------------------

def _extract_json(response: str) -> Dict[str, Any]:
    """Extracts and validates the JSON object from the LLM response."""
    match = re.search(r'\{[\s\S]*?\}', response)
    if not match:
        logger.warning("No JSON object found in LLM response.")
        return {"category": "Uncategorized", "amount": None, "datetime": None, "description": None}
    try:
        data = json.loads(match.group(0))
    except Exception as e:
        logger.warning(f"Failed to parse JSON from LLM response: {e}")
        return {"category": "Uncategorized", "amount": None, "datetime": None, "description": None}
    # Validate fields
    category = data.get("category", "Uncategorized")
    amount = data.get("amount")
    dt = data.get("datetime")
    description = data.get("description")
    if not isinstance(category, str):
        category = "Uncategorized"
    # Stricter type validation for amount
    if not (isinstance(amount, (int, float)) or (isinstance(amount, str) and amount.replace('.', '', 1).isdigit())):
        amount = None
    # Stricter type validation for datetime (basic ISO check)
    if not (isinstance(dt, str) and re.match(r"^\d{4}-\d{2}-\d{2}", dt)):
        dt = None
    if not isinstance(description, str):
        description = None
    return {"category": category, "amount": amount, "datetime": dt, "description": description}

#--------------------------------------------------------

def classify_expense(text: str) -> Dict[str, Any]:
    """Classifies an expense text using the LLM and returns a dict with category, amount, datetime, and description."""
    prompt = _get_prompt(text)
    try:
        agent = get_agent()
        response = agent.run(prompt)

        if response.content is None:
            return {"category": "Uncategorized", "amount": None, "datetime": None, "description": None}
        
        logger.info(f"LLM Response: {response.content}")
        
        return _extract_json(response.content.strip())
    
    except Exception as e:
        logger.error(f"LLM classification failed: {e}")
        return {"category": "Uncategorized", "amount": None, "datetime": None, "description": None}