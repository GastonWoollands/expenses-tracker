"""
Intent detection for categorizing messages as queries or expense logging.
"""

import re
import logging
from typing import Literal, List, Dict, Any, Optional

logger = logging.getLogger(__name__)

IntentType = Literal["query", "expense", "greeting", "unknown"]


class IntentDetector:
    """Detects user intent from message text."""

    QUERY_PATTERNS = [
        r"(?:how much|cuánto|cuanto)",
        r"(?:how much|cuánto|cuanto gaste|cuánto gasté|cuánto gastó)",
        r"(?:show me|muéstrame|muestra)",
        r"(?:show me|muéstrame|muestra|mostrame detalles|mostrame los detalles)",
        r"(?:what|qué|que).+(?:spend|spent|gast[oé])",
        r"(?:compare|comparar|comparison|comparame)",
        r"(?:total|sum|suma)",
        r"(?:average|promedio|avg)",
        r"(?:which|cuál|cual).+(?:category|categoría)",
        r"(?:list|listar|lista).+(?:expense|gasto)",
        r"(?:trend|tendencia)",
        r"(?:pattern|patrón)",
        r"(?:top|mayor|highest|lowest)",
        r"(?:breakdown|desglose)",
        r"(?:analysis|análisis)",
        r"(?:summary|resumen)",
        r"(?:last|últim[oa]s?).+(?:month|week|day|mes|semana|día)",
        r"(?:this|est[ea]).+(?:month|week|mes|semana)",
        r"\?$",
    ]

    EXPENSE_PATTERNS = [
        r"(?:spent|gasté|gaste)\s+\d+",
        r"\d+(?:\.\d{1,2})?\s*(?:€|eur|euros?|dollars?|\$|usd)",
        r"(?:€|\$)\s*\d+(?:\.\d{1,2})?",
        r"(?:paid|pagué|pague)\s+\d+",
        r"(?:bought|compré|compre)\s+",
        r"(?:cost|costó|costo)\s+\d+",
    ]

    GREETING_PATTERNS = [
        r"^(?:hi|hello|hey|hola|buenos?\s*(?:días?|tardes?|noches?))[\s!.,]*$",
        r"^(?:good\s+(?:morning|afternoon|evening))[\s!.,]*$",
    ]

    def __init__(self):
        self._query_compiled = [re.compile(p, re.IGNORECASE) for p in self.QUERY_PATTERNS]
        self._expense_compiled = [re.compile(p, re.IGNORECASE) for p in self.EXPENSE_PATTERNS]
        self._greeting_compiled = [re.compile(p, re.IGNORECASE) for p in self.GREETING_PATTERNS]

    def detect(
        self,
        text: str,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> IntentType:
        """
        Detect intent from message text.

        When intent would be "unknown", if conversation history is provided and
        the last exchange was a query (bot answered about expenses), treat the
        current message as a follow-up query (e.g. "give me the description of
        each expense related to this").

        Returns:
            - "query": User is asking a question about their expenses
            - "expense": User is logging a new expense
            - "greeting": User is greeting
            - "unknown": Intent could not be determined
        """
        if not text or not text.strip():
            return "unknown"

        text = text.strip()
        logger.debug(f"Detecting intent for: {text[:50]}...")

        for pattern in self._greeting_compiled:
            if pattern.search(text):
                logger.info(f"Intent detected: greeting")
                return "greeting"

        expense_score = sum(1 for p in self._expense_compiled if p.search(text))
        query_score = sum(1 for p in self._query_compiled if p.search(text))

        logger.debug(f"Intent scores - query: {query_score}, expense: {expense_score}")

        if expense_score > 0 and expense_score >= query_score:
            logger.info(f"Intent detected: expense (score: {expense_score})")
            return "expense"

        if query_score > 0:
            logger.info(f"Intent detected: query (score: {query_score})")
            return "query"

        if text.endswith("?"):
            logger.info("Intent detected: query (ends with ?)")
            return "query"

        if self._has_amount_pattern(text):
            logger.info("Intent detected: expense (has amount)")
            return "expense"

        # Follow-up: unknown but we have recent query context → treat as query
        if history and len(history) > 0:
            logger.info("Intent detected: query (follow-up from conversation history)")
            return "query"

        logger.info("Intent detected: unknown")
        return "query"

    def _has_amount_pattern(self, text: str) -> bool:
        """Check if text contains an amount pattern that suggests expense logging."""
        amount_pattern = r"\d+(?:[.,]\d{1,2})?\s*(?:€|eur|usd|\$|dollars?|euros?)?|\b(?:€|\$)\s*\d+"
        return bool(re.search(amount_pattern, text, re.IGNORECASE))
