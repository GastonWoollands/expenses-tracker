/**
 * Custom hooks for dashboard data
 * Refactored to use a single shared state for expenses to prevent crashes
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService, type Expense } from '../services/api';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatDateForAPI } from '../utils/analytics';

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  categoryBreakdown: Record<string, { amount: number; count: number }>;
}

export interface MonthlyTotal {
  month: string;
  year: number;
  total: number;
  trend?: number; // percentage change from previous month
}

export function useExpenses(startDate?: Date, endDate?: Date) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching expenses...', { startDate, endDate });
      
      const startDateStr = startDate ? formatDateForAPI(startDate) : undefined;
      const endDateStr = endDate ? formatDateForAPI(endDate) : undefined;
      
      const data = await apiService.getExpenses(1000, 0, startDateStr, endDateStr);
      console.log('Expenses fetched:', data);
      
      // Ensure data is an array
      const safeData = Array.isArray(data) ? data : [];
      setExpenses(safeData);
      console.log('Expenses state updated with', safeData.length, 'items');
    } catch (err) {
      console.error('Error fetching expenses:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expenses';
      setError(errorMessage);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Initialize on first mount
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { 
    expenses, 
    loading, 
    error, 
    refetch: fetchExpenses 
  };
}

export function useCurrentMonthExpenses() {
  // Calculate current month date range
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    };
  }, []);
  
  // Fetch expenses for current month only (backend filtering)
  const { expenses, loading, error, refetch } = useExpenses(
    currentMonthRange.startDate,
    currentMonthRange.endDate
  );
  
  // Expenses are already filtered by backend, but keep as-is for compatibility
  const currentMonthExpenses = expenses;

  return { 
    expenses: currentMonthExpenses, 
    loading, 
    error,
    refetch
  };
}

export function useExpenseSummary() {
  const { expenses, loading, error } = useCurrentMonthExpenses();
  
  // Safety check: ensure expenses is an array
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  
  const summary: ExpenseSummary = useMemo(() => ({
    totalAmount: safeExpenses.reduce((sum, expense) => {
      const amount = typeof expense.amount === 'number' ? expense.amount : 0;
      return sum + amount;
    }, 0),
    totalCount: safeExpenses.length,
    averageAmount: safeExpenses.length > 0 
      ? safeExpenses.reduce((sum, expense) => {
          const amount = typeof expense.amount === 'number' ? expense.amount : 0;
          return sum + amount;
        }, 0) / safeExpenses.length 
      : 0,
    categoryBreakdown: safeExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      const amount = typeof expense.amount === 'number' ? expense.amount : 0;
      
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>)
  }), [safeExpenses]);

  console.log('Expense summary calculated:', summary);

  return { summary, loading, error };
}

export function useMonthlyTotals() {
  const { expenses, loading, error } = useExpenses();
  
  // Safety check: ensure expenses is an array
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  
  console.log('Processing expenses for monthly totals:', safeExpenses.length, 'expenses');
  
  const monthlyTotals: MonthlyTotal[] = useMemo(() => {
    // Group expenses by month and year, summing amounts
    const monthlyTotalsMap = new Map<string, { year: number; month: number; monthName: string; total: number }>();
    
    safeExpenses.forEach(expense => {
      try {
        if (!expense || !expense.date) return;
        
        const date = new Date(expense.date);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for expense:', expense);
          return;
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const amount = typeof expense.amount === 'number' ? expense.amount : 0;
        
        if (monthlyTotalsMap.has(monthKey)) {
          const existing = monthlyTotalsMap.get(monthKey)!;
          existing.total += amount;
        } else {
          monthlyTotalsMap.set(monthKey, {
            year,
            month,
            monthName,
            total: amount
          });
        }
      } catch (err) {
        console.warn('Error processing expense for monthly totals:', err, expense);
      }
    });

    // Convert to array and sort by year and month (descending - latest first)
    return Array.from(monthlyTotalsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month; // Sort by month number, not string
      })
      .map((item, index, array) => {
        // Calculate trend compared to previous month
        let trend: number | undefined;
        if (index < array.length - 1) {
          const prevItem = array[index + 1];
          if (prevItem.total > 0) {
            trend = ((item.total - prevItem.total) / prevItem.total) * 100;
          }
        }
        
        return {
          month: item.monthName,
          year: item.year,
          total: item.total,
          trend
        };
      });
  }, [safeExpenses]);

  console.log('Monthly totals calculated:', monthlyTotals);

  return { monthlyTotals, loading, error };
}
