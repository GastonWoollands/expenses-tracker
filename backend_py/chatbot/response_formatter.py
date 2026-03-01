"""
Format query results into natural language responses.
"""

import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from decimal import Decimal

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from .config import RESPONSE_FORMAT_PROMPT, LLM_MODEL

logger = logging.getLogger(__name__)


class ResponseFormatter:
    """Formats query results into natural language."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            temperature=0.3,
        )
        self.prompt = ChatPromptTemplate.from_template(RESPONSE_FORMAT_PROMPT)

    async def format(
        self,
        results: List[Dict[str, Any]],
        question: str,
    ) -> str:
        """
        Format query results into natural language.

        Args:
            results: Query results
            question: Original user question

        Returns:
            Natural language response
        """
        if not results:
            return self._empty_response(question)

        if len(results) == 1 and len(results[0]) == 1:
            return self._format_single_value(results[0], question)

        try:
            serializable_results = self._make_serializable(results[:20])
            results_json = json.dumps(serializable_results, indent=2, ensure_ascii=False)

            prompt_value = self.prompt.format(
                question=question,
                results=results_json,
            )

            response = await self.llm.ainvoke(prompt_value)
            formatted = response.content.strip()

            if len(results) > 20:
                formatted += f"\n\n(Showing first 20 of {len(results)} results)"

            return formatted

        except Exception as e:
            logger.error(f"Error formatting response with LLM: {e}")
            return self._fallback_format(results, question)

    def _empty_response(self, question: str) -> str:
        """Generate response for empty results."""
        question_lower = question.lower()

        if any(word in question_lower for word in ["how much", "cuánto", "total"]):
            return "You haven't recorded any expenses matching that criteria yet."

        if any(word in question_lower for word in ["show", "list", "muestra"]):
            return "No expenses found matching your request."

        return "I couldn't find any data matching your question."

    def _format_single_value(self, result: Dict[str, Any], question: str) -> str:
        """Format a single aggregated value."""
        key = list(result.keys())[0]
        value = result[key]

        if value is None:
            return "No data found for your query."

        if isinstance(value, (int, float, Decimal)):
            if any(word in key.lower() for word in ["amount", "total", "sum", "spent"]):
                return f"€{float(value):.2f}"
            if any(word in key.lower() for word in ["count", "number"]):
                return f"{int(value)} transactions"
            if any(word in key.lower() for word in ["average", "avg"]):
                return f"€{float(value):.2f} on average"
            return str(value)

        return str(value)

    def _fallback_format(self, results: List[Dict[str, Any]], question: str) -> str:
        """Simple fallback formatting without LLM."""
        if len(results) == 1:
            items = []
            for key, value in results[0].items():
                if value is not None:
                    formatted_value = self._format_value(value)
                    items.append(f"**{key}**: {formatted_value}")
            return "\n".join(items)

        lines = []
        for i, row in enumerate(results[:10], 1):
            parts = []
            for key, value in row.items():
                if value is not None and key not in ["id", "user_id", "account_id", "category_id"]:
                    parts.append(f"{self._format_value(value)}")
            if parts:
                lines.append(f"{i}. {' | '.join(parts)}")

        if len(results) > 10:
            lines.append(f"\n... and {len(results) - 10} more")

        return "\n".join(lines) if lines else "No data to display."

    def _format_value(self, value: Any) -> str:
        """Format a single value for display."""
        if isinstance(value, (datetime, date)):
            return value.strftime("%Y-%m-%d")
        if isinstance(value, Decimal):
            return f"€{float(value):.2f}"
        if isinstance(value, float):
            if value == int(value):
                return str(int(value))
            return f"{value:.2f}"
        return str(value)

    def _make_serializable(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert results to JSON-serializable format."""
        serializable = []
        for row in results:
            new_row = {}
            for key, value in row.items():
                if key in ["id", "user_id", "account_id", "category_id"]:
                    continue
                if isinstance(value, (datetime, date)):
                    new_row[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    new_row[key] = float(value)
                else:
                    new_row[key] = value
            serializable.append(new_row)
        return serializable
