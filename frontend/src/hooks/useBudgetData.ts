/**
 * Custom hook for budget management with optimistic updates
 */

import { useState, useEffect, useCallback } from 'react';
import { budgetApiService, type Budget } from '../services/budgetApi';
import { useExpenses } from './useDashboardData';
import { ALL_CATEGORIES, CORE_CATEGORIES } from '../config/categories';

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface BudgetData {
  income: number;
  totalExpenses: number;
  remainingBalance: number;
  categories: BudgetCategory[];
  totalBudget: number;
  budgetDifference: number;
}

export interface SaveStatus {
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export function useBudgetData() {
  const { expenses, loading: expensesLoading, error: expensesError } = useExpenses();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [income, setIncome] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    saving: false,
    saved: false,
    error: null
  });

  // Load initial data
  useEffect(() => {
    loadBudgetData();
  }, []);

  // Monitor budgets state changes
  useEffect(() => {
    console.log('Budgets state changed:', budgets);
  }, [budgets]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [budgetsData, incomeData] = await Promise.all([
        budgetApiService.getBudgets(),
        budgetApiService.getIncome()
      ]);
      
      setBudgets(budgetsData);
      setIncome(incomeData.income);
    } catch (err) {
      console.error('Error loading budget data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate budget data from real expenses and budgets
  const budgetData = useCallback((): BudgetData => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Filter expenses for current month
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    // Calculate total expenses
    const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate category spending
    const categorySpending: Record<string, number> = {};
    currentMonthExpenses.forEach(expense => {
      const categoryKey = expense.category.toLowerCase().replace(/\s+/g, '-');
      categorySpending[categoryKey] = (categorySpending[categoryKey] || 0) + expense.amount;
    });

    // Create budget map for quick lookup
    const budgetMap: Record<string, number> = {};
    budgets.forEach(budget => {
      budgetMap[budget.category_key] = budget.amount;
    });

    // Build category data - show all categories but only include those with budget or spending
    const categories = ALL_CATEGORIES.map(category => {
      const categoryKey = category.key;
      const budget = budgetMap[categoryKey] || 0;
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
    }); // Show all categories for budget setup

    // Sort by percentage used (descending)
    categories.sort((a, b) => b.percentageUsed - a.percentageUsed);

    // Calculate totals
    const totalBudget = Object.values(budgetMap).reduce((sum, budget) => sum + budget, 0);
    const budgetDifference = totalBudget - totalExpenses;
    const remainingBalance = income - totalExpenses;

    console.log('Budget data calculated from real expenses:', {
      income,
      totalExpenses,
      remainingBalance,
      totalBudget,
      budgetDifference,
      currentMonthExpenses: currentMonthExpenses.length,
      categoriesCount: categories.length,
      categorySpending,
      currentMonth: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
      note: 'Total Budget = Sum of Category Budgets'
    });

    return {
      income,
      totalExpenses,
      remainingBalance,
      categories,
      totalBudget,
      budgetDifference
    };
  }, [expenses, budgets, income]);

  // Update income with optimistic UI
  const updateIncome = useCallback(async (newIncome: number) => {
    if (newIncome < 0) {
      setSaveStatus({ saving: false, saved: false, error: 'Income cannot be negative' });
      return;
    }

    setSaveStatus({ saving: true, saved: false, error: null });
    
    // Optimistic update
    const previousIncome = income;
    setIncome(newIncome);

    try {
      await budgetApiService.updateIncome(newIncome);
      setSaveStatus({ saving: false, saved: true, error: null });
      
      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, saved: false }));
      }, 2000);
      
      console.log('Income updated successfully:', newIncome);
    } catch (err) {
      // Revert optimistic update on error
      setIncome(previousIncome);
      setSaveStatus({ 
        saving: false, 
        saved: false, 
        error: err instanceof Error ? err.message : 'Failed to update income' 
      });
      console.error('Error updating income:', err);
    }
  }, [income]);

  // Update category budget with optimistic UI
  const updateCategoryBudget = useCallback(async (categoryKey: string, newBudget: number) => {
    console.log('updateCategoryBudget called with:', { categoryKey, newBudget });
    
    if (newBudget < 0) {
      setSaveStatus({ saving: false, saved: false, error: 'Budget cannot be negative' });
      return;
    }

    setSaveStatus({ saving: true, saved: false, error: null });
    
    // Optimistic update
    const previousBudgets = [...budgets];
    const existingBudgetIndex = budgets.findIndex(b => b.category_key === categoryKey);
    
    console.log('Budget update details:', { 
      existingBudgetIndex, 
      categoryKey, 
      newBudget,
      currentBudgets: budgets.length 
    });
    
    if (existingBudgetIndex >= 0) {
      // Update existing budget
      const updatedBudgets = [...budgets];
      updatedBudgets[existingBudgetIndex] = {
        ...updatedBudgets[existingBudgetIndex],
        amount: newBudget
      };
      console.log('Updating existing budget:', updatedBudgets[existingBudgetIndex]);
      setBudgets(updatedBudgets);
    } else {
      // Add new budget
      const newBudgetObj: Budget = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        user_id: 'current-user',
        category_key: categoryKey,
        amount: newBudget,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('Adding new budget:', newBudgetObj);
      setBudgets([...budgets, newBudgetObj]);
    }

    try {
      console.log('Making API call to update budget:', categoryKey, newBudget);
      await budgetApiService.updateBudgetByCategory(categoryKey, newBudget);
      console.log('API call successful');
      console.log('Current budgets state after API call:', budgets);
      setSaveStatus({ saving: false, saved: true, error: null });
      
      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, saved: false }));
      }, 2000);
      
      console.log('Category budget updated successfully:', categoryKey, newBudget);
    } catch (err) {
      console.error('API call failed:', err);
      // Revert optimistic update on error
      setBudgets(previousBudgets);
      setSaveStatus({ 
        saving: false, 
        saved: false, 
        error: err instanceof Error ? err.message : 'Failed to update budget' 
      });
      console.error('Error updating category budget:', err);
    }
  }, [budgets]);

  return {
    budgetData: budgetData(),
    loading: loading || expensesLoading,
    error: error || expensesError,
    saveStatus,
    updateIncome,
    updateCategoryBudget,
    refreshData: loadBudgetData
  };
}