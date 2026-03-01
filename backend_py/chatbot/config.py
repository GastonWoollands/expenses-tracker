"""
Chatbot configuration and database schema definition.
"""

import os
import json

LLM_MODEL = os.getenv("GEMINI_MODEL_CHATBOT", "gemini-2.0-flash")

EXPENSE_SCHEMA = {
    "transactions": {
        "description": "User expenses and income transactions",
        "columns": {
            "id": "UUID primary key",
            "user_id": "User identifier (ALWAYS filter by this)",
            "account_id": "Account reference",
            "category_id": "Category reference (join with categories table)",
            "type": "Transaction type: 'expense' or 'income'",
            "amount": "Transaction amount (NUMERIC, always positive)",
            "currency": "Currency code (EUR, USD, etc.)",
            "description": "Transaction description text",
            "occurred_at": "When the transaction happened (TIMESTAMP)",
            "created_at": "Record creation timestamp",
            "is_fixed": "Whether this is a fixed/recurring expense (BOOLEAN)",
        },
        "user_filter": "user_id",
    },
    "categories": {
        "description": "Expense and income categories",
        "columns": {
            "id": "UUID primary key",
            "name": "Category name (e.g., 'Food', 'Transport', 'Shopping')",
            "type": "Category type: 'expense' or 'income'",
            "key": "Category key identifier",
        },
    },
    "fixed_expenses": {
        "description": "Recurring fixed expense templates",
        "columns": {
            "id": "UUID primary key",
            "user_id": "User identifier (ALWAYS filter by this)",
            "category_id": "Category reference",
            "amount": "Fixed amount",
            "currency": "Currency code",
            "description": "Description text",
            "fixed_interval": "Interval: 'daily', 'weekly', 'monthly', 'yearly'",
            "fixed_day_of_month": "Day of month for monthly expenses (1-31)",
            "is_active": "Whether the fixed expense is active",
        },
        "user_filter": "user_id",
    },
}

SQL_GENERATION_PROMPT = """You are an expert SQL assistant that generates secure PostgreSQL queries for an expense tracking application.

DATABASE SCHEMA:
{schema}

CRITICAL REQUIREMENTS:
1. Generate ONLY SELECT queries. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, or any other data-modifying statements.
2. **MANDATORY**: Every query MUST include the filter: t.user_id = '{{{{user_id}}}}' (with the literal text {{{{user_id}}}} as shown)
3. The placeholder {{{{user_id}}}} will be replaced with the actual user ID programmatically. You MUST include it exactly as shown.
4. Always filter transactions by type='expense' unless specifically asked about income.
5. For date filtering, use occurred_at column. Common patterns:
   - Current month: DATE_TRUNC('month', occurred_at) = DATE_TRUNC('month', CURRENT_DATE)
   - Last N days: occurred_at >= CURRENT_DATE - INTERVAL 'N days'
6. Join with categories table to get category names: LEFT JOIN categories c ON t.category_id = c.id
7. For aggregations, always include meaningful aliases.
8. Limit results to 100 rows maximum.
9. Return ONLY the SQL query, no explanations, no markdown code blocks.
10. When the user refers to "this", "those", "the same category", "related to this", etc., use the CONVERSATION HISTORY below to resolve the reference (e.g. if the previous Q&A was about "travel", interpret "expenses related to this" as travel category) and generate the appropriate SQL.
11. Always reponse in the same language as the user's question.

EXAMPLES (notice the {{{{user_id}}}} placeholder in every query):

User: "How much did I spend this month?"
SQL: SELECT SUM(t.amount) as total_spent FROM transactions t WHERE t.user_id = '{{{{user_id}}}}' AND t.type = 'expense' AND DATE_TRUNC('month', t.occurred_at) = DATE_TRUNC('month', CURRENT_DATE);

User: "What are my top categories?"
SQL: SELECT c.name as category, SUM(t.amount) as total, COUNT(*) as count FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = '{{{{user_id}}}}' AND t.type = 'expense' AND DATE_TRUNC('month', t.occurred_at) = DATE_TRUNC('month', CURRENT_DATE) GROUP BY c.name ORDER BY total DESC LIMIT 10;

User: "Show me my food expenses"
SQL: SELECT t.amount, t.description, t.occurred_at, c.name as category FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = '{{{{user_id}}}}' AND t.type = 'expense' AND LOWER(c.name) LIKE '%food%' ORDER BY t.occurred_at DESC LIMIT 50;

User: "Compare this month to last month"
SQL: SELECT DATE_TRUNC('month', t.occurred_at) as month, SUM(t.amount) as total FROM transactions t WHERE t.user_id = '{{{{user_id}}}}' AND t.type = 'expense' AND t.occurred_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' GROUP BY DATE_TRUNC('month', t.occurred_at) ORDER BY month;

User: "What did I spend on transport last week?"
SQL: SELECT t.amount, t.description, t.occurred_at FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = '{{{{user_id}}}}' AND t.type = 'expense' AND LOWER(c.name) LIKE '%transport%' AND t.occurred_at >= CURRENT_DATE - INTERVAL '7 days' ORDER BY t.occurred_at DESC;

CONVERSATION HISTORY:
{history}

USER QUESTION: {question}

Generate the SQL query (MUST include t.user_id = '{{{{user_id}}}}' filter):"""

RESPONSE_FORMAT_PROMPT = """You are a helpful assistant that formats expense query results into natural, conversational responses.

USER QUESTION: {question}

QUERY RESULTS (JSON):
{results}

INSTRUCTIONS:
1. Respond in a natural, friendly tone
2. Format currency amounts with € symbol and 2 decimal places
3. Use bullet points or numbered lists for multiple items
4. Include percentages where relevant
5. Keep the response concise but informative
6. If results are empty, say so politely
7. Do not mention SQL, databases, or technical details
8. Respond in the same language as the user's question

Generate the response:"""


def get_schema_string() -> str:
    """Get formatted schema string for LLM prompt."""
    return json.dumps(EXPENSE_SCHEMA, indent=2, ensure_ascii=False)
