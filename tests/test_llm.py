import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.expenses_bot.llm import classify_expense

def test_classify_expense_apple_pay():
    text = "Apple Pay: Starbucks $4.50 2024-06-01"
    result = classify_expense(text)
    assert isinstance(result, dict)
    assert "category" in result and "amount" in result and "datetime" in result
    assert result["category"] != ""
    print("Apple Pay result:", result)

def test_classify_expense_plain_text():
    text = "Bought groceries for 25.30 on 2024-06-02"
    result = classify_expense(text)
    assert isinstance(result, dict)
    assert "category" in result and "amount" in result and "datetime" in result
    assert result["category"] != ""
    print("Plain text result:", result)

def test_classify_expense_non_expense():
    text = "Hello, how are you?"
    result = classify_expense(text)
    assert isinstance(result, dict)
    assert result["category"] == "Uncategorized"
    print("Non-expense result:", result)

def main():
    test_classify_expense_apple_pay()
    test_classify_expense_plain_text()
    test_classify_expense_non_expense()

if __name__ == "__main__":
    main()