import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from src.expenses_bot.sheets import add_expense

def test_add_expense():
    # Use mock/test values
    category = "TestCategory"
    amount = 123.45
    dt = "2024-06-01 12:00:00"
    description = "Test expense entry"
    try:
        add_expense(category, amount, dt, description)
        print("add_expense executed successfully.")
    except Exception as e:
        pytest.fail(f"add_expense raised an exception: {e}") 