"""
Natural language to SQL query generation using LLM.
"""

import logging
import os
from typing import Optional, List, Dict, Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from .config import SQL_GENERATION_PROMPT, get_schema_string, LLM_MODEL

logger = logging.getLogger(__name__)


class QueryGenerator:
    """Generates SQL queries from natural language using LLM."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            temperature=0,
        )
        self.prompt = ChatPromptTemplate.from_template(SQL_GENERATION_PROMPT)

    async def generate(
        self,
        question: str,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[str]:
        """
        Generate SQL query from natural language question.

        Args:
            question: User's natural language question
            history: Optional conversation history

        Returns:
            SQL query string or None if generation fails
        """
        if not question or not question.strip():
            logger.warning("Empty question provided")
            return None

        try:
            history_str = self._format_history(history)
            schema_str = get_schema_string()

            prompt_value = self.prompt.format(
                schema=schema_str,
                history=history_str,
                question=question.strip(),
            )

            logger.debug(f"Generating SQL for: {question[:50]}...")

            response = await self.llm.ainvoke(prompt_value)
            sql = self._extract_sql(response.content)

            if sql:
                sql = self._ensure_user_id_placeholder(sql)
                logger.info(f"Generated SQL: {sql}...")
            else:
                logger.warning("Failed to extract SQL from LLM response")

            return sql

        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
            return None

    def _format_history(self, history: Optional[List[Dict[str, Any]]]) -> str:
        """Format conversation history for prompt."""
        if not history:
            return "No previous conversation."

        lines = []
        for entry in history[-5:]:
            user_msg = entry.get("user", "")
            bot_msg = entry.get("bot", "")
            if user_msg:
                lines.append(f"User: {user_msg}")
            if bot_msg:
                lines.append(f"Assistant: {bot_msg}")

        return "\n".join(lines) if lines else "No previous conversation."

    def _extract_sql(self, text: str) -> Optional[str]:
        """Extract SQL query from LLM response."""
        if not text:
            return None

        text = text.strip()

        if "```sql" in text.lower():
            start = text.lower().find("```sql") + 6
            end = text.find("```", start)
            if end > start:
                text = text[start:end].strip()
        elif "```" in text:
            start = text.find("```") + 3
            end = text.find("```", start)
            if end > start:
                text = text[start:end].strip()

        lines = text.split("\n")
        sql_lines = []
        in_sql = False

        for line in lines:
            line_lower = line.strip().lower()
            if line_lower.startswith("select"):
                in_sql = True
            if in_sql:
                sql_lines.append(line)
                if ";" in line:
                    break

        if sql_lines:
            sql = "\n".join(sql_lines).strip()
            if not sql.endswith(";"):
                sql += ";"
            return sql

        if text.lower().startswith("select"):
            sql = text.strip()
            if not sql.endswith(";"):
                sql += ";"
            return sql

        return None

    def _ensure_user_id_placeholder(self, sql: str) -> str:
        """
        Ensure SQL contains the {{user_id}} placeholder.
        If missing, attempt to inject it into the WHERE clause.
        """
        if "{{user_id}}" in sql:
            return sql

        logger.warning("SQL missing {{user_id}} placeholder, attempting to inject")

        sql_lower = sql.lower()
        
        if " where " in sql_lower:
            where_idx = sql_lower.find(" where ")
            before_where = sql[:where_idx + 7]
            after_where = sql[where_idx + 7:]
            
            if "t.user_id" not in sql_lower and "user_id" not in sql_lower:
                sql = f"{before_where}t.user_id = '{{{{user_id}}}}' AND {after_where}"
                logger.info("Injected user_id filter after WHERE")
        else:
            from_idx = sql_lower.find(" from ")
            if from_idx > 0:
                table_end = sql_lower.find(" ", from_idx + 6)
                if table_end < 0:
                    table_end = len(sql) - 1
                
                rest_of_query = sql[table_end:]
                first_part = sql[:table_end]
                
                if rest_of_query.strip().endswith(";"):
                    rest_of_query = rest_of_query.rstrip(";").strip()
                    sql = f"{first_part} WHERE t.user_id = '{{{{user_id}}}}' {rest_of_query};"
                else:
                    sql = f"{first_part} WHERE t.user_id = '{{{{user_id}}}}' {rest_of_query}"
                
                logger.info("Injected WHERE clause with user_id filter")

        final_sql = sql.replace("{{{{user_id}}}}", "{{user_id}}")
        
        return final_sql
