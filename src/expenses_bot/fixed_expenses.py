import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from datetime import datetime
from typing import List, Dict
from expenses_bot.config import get_logger
from expenses_bot.sheets import add_expense_if_missing

logger = get_logger(__name__)

#--------------------------------------------------------

def load_fixed_expenses() -> List[Dict]:
    """Load fixed expenses from env var FIXED_EXPENSES_JSON.

    Expected JSON array of objects: [{"category":"Subscription","amount":12.99,"description":"Netflix"}, ...]
    Amount is number, description optional but recommended. Category is required.
    """
    raw = os.getenv("FIXED_EXPENSES_JSON", "[]")
    try:
        data = json.loads(raw)
        if not isinstance(data, list):
            logger.warning("FIXED_EXPENSES_JSON is not a list; ignoring.")
            return []
        normalized = []
        for item in data:
            if not isinstance(item, dict):
                continue
            category = item.get("category")
            amount = item.get("amount")
            description = item.get("description", "")
            if not category or amount is None:
                continue
            normalized.append({
                "category": str(category),
                "amount": float(amount),
                "description": str(description) if description is not None else ""
            })
        return normalized
    except Exception as e:
        logger.error(f"Failed to parse FIXED_EXPENSES_JSON: {e}")
        return []

#--------------------------------------------------------

def apply_fixed_expenses_for_month(year: int, month: int) -> int:
    """Append this month's fixed expenses if not already present.

    Returns number of rows appended.
    """
    items = load_fixed_expenses()
    if not items:
        return 0
    dt = datetime(year, month, 1).strftime("%Y-%m-%d")
    appended = 0
    for it in items:
        ok = add_expense_if_missing(it["category"], it["amount"], dt, it.get("description", ""))
        if ok:
            appended += 1
    logger.info(f"Fixed expenses processed for {year}-{month:02d}: appended {appended} rows")
    return appended


