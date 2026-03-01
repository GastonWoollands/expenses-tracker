"""
Chatbot configuration and database schema definition.
"""

import os
import json

LLM_MODEL = os.getenv("GEMINI_MODEL_CHATBOT", "gemini-2.0-flash")

# database/schema.sql
EXPENSE_SCHEMA = {
    "transactions": {
        "description": "User expenses and income transactions",
        "columns": {
            "id": "UUID primary key",
            "user_id": "User identifier TEXT (ALWAYS filter by this; Firebase UID)",
            "account_id": "UUID reference to accounts(id)",
            "category_id": "UUID reference to categories(id)",
            "type": "Transaction type: 'expense', 'income', or 'transfer'",
            "amount": "NUMERIC(12,2), always positive",
            "currency": "TEXT (e.g. EUR, USD)",
            "description": "TEXT",
            "occurred_at": "TIMESTAMP when the transaction happened",
            "created_at": "TIMESTAMP",
        },
        "user_filter": "user_id",
    },
    "categories": {
        "description": "Income and expense categories (user_id NULL = global category)",
        "columns": {
            "id": "UUID primary key",
            "user_id": "TEXT reference to users(id), nullable for global categories",
            "name": "Category name (e.g. Food, Transport, Shopping)",
            "type": "Category type: 'expense' or 'income'",
            "icon": "TEXT",
            "created_at": "TIMESTAMP",
        },
    },
    "accounts": {
        "description": "User accounts (cash, bank, credit card, wallet)",
        "columns": {
            "id": "UUID primary key",
            "user_id": "TEXT reference to users(id)",
            "name": "Account name",
            "type": "TEXT: 'cash', 'bank', 'credit_card', 'wallet', 'other'",
            "currency": "TEXT",
            "created_at": "TIMESTAMP",
        },
        "user_filter": "user_id",
    },
    "budgets": {
        "description": "Budgets by category and period per user",
        "columns": {
            "id": "UUID primary key",
            "user_id": "TEXT reference to users(id)",
            "category_id": "UUID reference to categories(id)",
            "amount": "NUMERIC(12,2)",
            "period": "TEXT: 'daily', 'weekly', 'monthly', 'yearly'",
            "created_at": "TIMESTAMP",
        },
        "user_filter": "user_id",
    },
    "user_income": {
        "description": "Target/expected monthly income per user",
        "columns": {
            "user_id": "TEXT primary key reference to users(id)",
            "monthly_income": "NUMERIC(12,2)",
            "currency": "TEXT",
            "created_at": "TIMESTAMP",
            "updated_at": "TIMESTAMP",
        },
        "user_filter": "user_id",
    },
}

SQL_GENERATION_PROMPT = """You are an expert SQL assistant that generates secure PostgreSQL queries for an expense tracking application.

DATABASE SCHEMA:
{schema}

CRITICAL REQUIREMENTS:
1. Generate ONLY SELECT queries. No INSERT, UPDATE, DELETE, DROP, or other modifications.
2. **MANDATORY**: Every query MUST include: t.user_id = '{{{{user_id}}}}' (keep the literal {{{{user_id}}}} — it is replaced programmatically).
3. Filter by type='expense' unless the user asks about income.
4. For dates use the occurred_at column. Join categories with: LEFT JOIN categories c ON t.category_id = c.id.
5. Use meaningful aliases for aggregations. Limit to 100 rows. Return ONLY the SQL, no markdown or explanation.
6. For "this/those/same category/related to this", use CONVERSATION HISTORY to resolve (e.g. previous "travel" → filter by travel category).
7. For budget questions use the budgets table (filter by b.user_id = '{{{{user_id}}}}'). For monthly/expected income use user_income (filter by user_id).
8. For category filters, use a short stem (e.g. 'other' for 'others', 'transport' for 'transports') so that the LIKE matches the actual category name in the database.”

MAP USER EXPRESSIONS TO SQL (use these patterns):

Time (use t.occurred_at):
- "this month" / "este mes" / "current month"  -> DATE_TRUNC('month', t.occurred_at) = DATE_TRUNC('month', CURRENT_DATE)
- "last month" / "mes pasado"  -> DATE_TRUNC('month', t.occurred_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
- "this week" / "esta semana"  -> DATE_TRUNC('week', t.occurred_at) = DATE_TRUNC('week', CURRENT_DATE)
- "last week" / "semana pasada"  -> t.occurred_at >= CURRENT_DATE - INTERVAL '7 days' AND t.occurred_at < DATE_TRUNC('week', CURRENT_DATE)
- Named month (e.g. "February"/"febrero"/"mes de febrero"): use EXTRACT(MONTH FROM t.occurred_at) = <1-12> AND EXTRACT(YEAR FROM t.occurred_at) = EXTRACT(YEAR FROM CURRENT_DATE). Months: January=1, February=2, March=3, April=4, May=5, June=6, July=7, August=8, September=9, October=10, November=11, December=12.

Category (always join categories c; filter by c.name):
- For any place or category the user names (supermarket, food, transport, supermercado, comida, etc.), use LOWER(c.name) LIKE '%<keyword>%' with the stem or obvious translation (e.g. supermercado/supermarket/grocer, comida/food, transporte/transport).
- For "description" / "details" / "detalles" / "what did I buy" -> select t.description (and optionally t.amount, t.occurred_at, c.name).

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

User: "¿Cuánto gasté en supermercado el mes de febrero?"
SQL: SELECT SUM(t.amount) as total_spent FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = '{{{{user_id}}}}' AND t.type = 'expense' AND (LOWER(c.name) LIKE '%supermercado%' OR LOWER(c.name) LIKE '%supermarket%' OR LOWER(c.name) LIKE '%grocer%') AND EXTRACT(MONTH FROM t.occurred_at) = 2 AND EXTRACT(YEAR FROM t.occurred_at) = EXTRACT(YEAR FROM CURRENT_DATE);

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
