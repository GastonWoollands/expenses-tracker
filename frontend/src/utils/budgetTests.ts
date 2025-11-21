/**
 * Budget Test Utilities: Test budget calculations and data processing
 */

import { ALL_CATEGORIES } from '../config/categories';

// Mock expense data for testing
const MOCK_EXPENSES = [
  { id: '1', amount: 150, category: 'Food', date: '2025-10-01' },
  { id: '2', amount: 50, category: 'Transport', date: '2025-10-02' },
  { id: '3', amount: 200, category: 'Food', date: '2025-10-03' },
  { id: '4', amount: 100, category: 'Shopping', date: '2025-10-04' },
  { id: '5', amount: 75, category: 'Health', date: '2025-10-05' },
];

// Mock budget data
const MOCK_BUDGET_DATA = {
  income: 5000,
  categoryBudgets: {
    'food': 800,
    'transport': 300,
    'housing': 1500,
    'services': 200,
    'health': 150,
    'education': 100,
    'technology': 200,
    'shopping': 300,
    'travel': 500,
    'bar-restaurant': 400,
    'hobby': 200,
    'other': 150
  } as Record<string, number>
};

// Test budget calculations
function testBudgetCalculations() {
  console.log('Testing Budget Calculations:');
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter expenses for current month
  const currentMonthExpenses = MOCK_EXPENSES.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });

  console.log('Current month expenses:', currentMonthExpenses);

  // Calculate total expenses
  const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  console.log('Total expenses:', totalExpenses);

  // Calculate category spending
  const categorySpending: Record<string, number> = {};
  currentMonthExpenses.forEach(expense => {
    const categoryKey = expense.category.toLowerCase().replace(/\s+/g, '-');
    categorySpending[categoryKey] = (categorySpending[categoryKey] || 0) + expense.amount;
  });

  console.log('Category spending:', categorySpending);

  // Build category data
  const categories = ALL_CATEGORIES.map(category => {
    const categoryKey = category.key;
    const budget = MOCK_BUDGET_DATA.categoryBudgets[categoryKey] || 0;
    const spent = categorySpending[categoryKey] || 0;
    const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = spent > budget && budget > 0;

    return {
      id: categoryKey,
      name: category.label,
      budget,
      spent,
      percentageUsed,
      isOverBudget
    };
  }).filter(cat => cat.budget > 0 || cat.spent > 0); // Only show categories with budget or spending

  console.log('Category budget data:', categories);

  // Calculate totals
  const totalBudget = Object.values(MOCK_BUDGET_DATA.categoryBudgets).reduce((sum, budget) => sum + budget, 0);
  const budgetDifference = totalBudget - totalExpenses;
  const remainingBalance = MOCK_BUDGET_DATA.income - totalExpenses;

  console.log('Budget summary:', {
    income: MOCK_BUDGET_DATA.income,
    totalExpenses,
    remainingBalance,
    totalBudget,
    budgetDifference
  });

  // Test over-budget categories
  const overBudgetCategories = categories.filter(cat => cat.isOverBudget);
  console.log('Over-budget categories:', overBudgetCategories);

  // Test near-budget categories (80%+ used)
  const nearBudgetCategories = categories.filter(cat => cat.percentageUsed > 80 && !cat.isOverBudget);
  console.log('Near-budget categories:', nearBudgetCategories);

  return {
    income: MOCK_BUDGET_DATA.income,
    totalExpenses,
    remainingBalance,
    categories,
    totalBudget,
    budgetDifference,
    overBudgetCategories,
    nearBudgetCategories
  };
}

// Test budget status indicators
function testBudgetStatusIndicators() {
  console.log('Testing Budget Status Indicators:');
  
  const scenarios = [
    { income: 5000, expenses: 4500, description: 'Near budget limit (90% used)' },
    { income: 5000, expenses: 5200, description: 'Over budget' },
    { income: 5000, expenses: 3000, description: 'Well within budget' },
    { income: 5000, expenses: 5000, description: 'Exactly at budget' },
  ];

  scenarios.forEach((scenario, index) => {
    const remainingBalance = scenario.income - scenario.expenses;
    const isOverBudget = remainingBalance < 0;
    const isNearBudget = remainingBalance >= 0 && remainingBalance < (scenario.income * 0.1);

    console.log(`Scenario ${index + 1}: ${scenario.description}`);
    console.log(`  Income: $${scenario.income}, Expenses: $${scenario.expenses}`);
    console.log(`  Remaining: $${remainingBalance}`);
    console.log(`  Status: ${isOverBudget ? 'Over Budget' : isNearBudget ? 'Near Limit' : 'On Track'}`);
    console.log(`  Color: ${isOverBudget ? 'Red' : isNearBudget ? 'Yellow' : 'Green'}`);
    console.log('');
  });
}

// Test category progress bars
function testCategoryProgressBars() {
  console.log('Testing Category Progress Bars:');
  
  const testCategories = [
    { name: 'Food', budget: 800, spent: 600, expected: 75 },
    { name: 'Transport', budget: 300, spent: 350, expected: 116.7 },
    { name: 'Shopping', budget: 300, spent: 100, expected: 33.3 },
    { name: 'Health', budget: 150, spent: 75, expected: 50 },
  ];

  testCategories.forEach(category => {
    const percentageUsed = (category.spent / category.budget) * 100;
    const isOverBudget = category.spent > category.budget;
    
    console.log(`${category.name}:`);
    console.log(`  Budget: $${category.budget}, Spent: $${category.spent}`);
    console.log(`  Percentage: ${percentageUsed.toFixed(1)}%`);
    console.log(`  Status: ${isOverBudget ? 'Over Budget' : percentageUsed > 80 ? 'Near Limit' : 'On Track'}`);
    console.log(`  Bar Color: ${isOverBudget ? 'Red' : percentageUsed > 80 ? 'Yellow' : 'Green'}`);
    console.log('');
  });
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testBudgetCalculations = testBudgetCalculations;
  (window as any).testBudgetStatusIndicators = testBudgetStatusIndicators;
  (window as any).testCategoryProgressBars = testCategoryProgressBars;
}

export { testBudgetCalculations, testBudgetStatusIndicators, testCategoryProgressBars };
