"""
Security validation for SQL queries and user input.
"""

import re
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class SecurityValidator:
    """Validates SQL queries and user input for security."""

    DANGEROUS_KEYWORDS = [
        "drop",
        "delete",
        "update",
        "insert",
        "alter",
        "truncate",
        "exec",
        "execute",
        "into outfile",
        "load_file",
        "create",
        "grant",
        "revoke",
        "commit",
        "rollback",
        "savepoint",
        "set ",
        "call ",
        "copy ",
        "do ",
        "lock ",
        "vacuum",
        "reindex",
        "cluster",
        "comment on",
        "security definer",
        "pg_",
        "information_schema",
    ]

    DANGEROUS_INPUT_PATTERNS = [
        r";\s*(?:drop|delete|update|insert|alter|truncate)",
        r"--",
        r"/\*",
        r"\*/",
        r"union\s+(?:all\s+)?select",
        r"'\s*or\s+'?\d*'?\s*=\s*'?\d*",
        r"'\s*;\s*--",
    ]

    MAX_QUERY_LENGTH = 2000

    def __init__(self):
        self._dangerous_pattern = re.compile(
            "|".join(self.DANGEROUS_INPUT_PATTERNS), re.IGNORECASE
        )

    def validate_input(self, text: str) -> Tuple[bool, str]:
        """
        Validate user input for dangerous patterns.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not text or not text.strip():
            return False, "Empty input"

        text_lower = text.lower()

        for keyword in self.DANGEROUS_KEYWORDS:
            if keyword in text_lower:
                logger.warning(f"Dangerous keyword detected in input: {keyword}")
                return False, "Invalid input detected"

        if self._dangerous_pattern.search(text):
            logger.warning(f"Dangerous pattern detected in input")
            return False, "Invalid input detected"

        return True, ""

    def validate_sql(self, sql: str, user_id: str) -> Tuple[bool, str]:
        """
        Validate generated SQL for security.

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not sql or not sql.strip():
            return False, "Empty SQL query"

        sql_clean = sql.strip()
        sql_lower = sql_clean.lower()

        if len(sql_clean) > self.MAX_QUERY_LENGTH:
            logger.warning(f"SQL query too long: {len(sql_clean)} chars")
            return False, "Query too complex"

        if not sql_lower.lstrip().startswith("select"):
            logger.warning(f"SQL does not start with SELECT: {sql_clean[:50]}")
            return False, "Only SELECT queries are allowed"

        for keyword in self.DANGEROUS_KEYWORDS:
            pattern = r"\b" + re.escape(keyword) + r"\b"
            if re.search(pattern, sql_lower):
                logger.warning(f"Dangerous keyword in SQL: {keyword}")
                return False, "Invalid query detected"

        if self._dangerous_pattern.search(sql_clean):
            logger.warning(f"Dangerous pattern in SQL")
            return False, "Invalid query detected"

        if re.search(r";\s*select", sql_lower):
            logger.warning("Multiple statements detected")
            return False, "Multiple statements not allowed"

        if "{{user_id}}" not in sql_clean:
            logger.warning("SQL missing {{user_id}} placeholder - query will be rejected")
            return False, "Query must include user filter"

        logger.info("SQL validation passed")
        return True, ""

    def sanitize_for_logging(self, text: str, max_length: int = 100) -> str:
        """Sanitize text for safe logging."""
        if not text:
            return ""
        sanitized = text.replace("\n", " ").replace("\r", "")
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length] + "..."
        return sanitized
