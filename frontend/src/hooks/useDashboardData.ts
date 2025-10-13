/**
 * Custom hooks for dashboard data
 */

import { useState, useEffect } from 'react';
import { apiService, type Expense } from '../services/api';

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

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        console.log('Fetching expenses...');
        const data = await apiService.getExpenses(100, 0);
        console.log('Expenses fetched:', data);
        setExpenses(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  return { expenses, loading, error, refetch: () => window.location.reload() };
}

export function useCurrentMonthExpenses() {
  const { expenses, loading, error } = useExpenses();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  console.log('Current month expenses:', {
    currentMonth,
    currentYear,
    totalExpenses: expenses.length,
    currentMonthExpenses: currentMonthExpenses.length,
    currentMonthTotal: currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  });

  return { 
    expenses: currentMonthExpenses, 
    loading, 
    error 
  };
}

export function useExpenseSummary() {
  const { expenses, loading, error } = useCurrentMonthExpenses();
  
  const summary: ExpenseSummary = {
    totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalCount: expenses.length,
    averageAmount: expenses.length > 0 ? expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length : 0,
    categoryBreakdown: expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { amount: 0, count: 0 };
      }
      acc[expense.category].amount += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>)
  };

  console.log('Expense summary calculated:', summary);

  return { summary, loading, error };
}

export function useMonthlyTotals() {
  const { expenses, loading, error } = useExpenses();
  
  console.log('Processing expenses for monthly totals:', expenses.map(exp => ({
    id: exp.id,
    amount: exp.amount,
    date: exp.date,
    month: new Date(exp.date).getMonth() + 1,
    year: new Date(exp.date).getFullYear(),
    monthName: new Date(exp.date).toLocaleDateString('en-US', { month: 'short' })
  })));
  
  // Group expenses by month and year, summing amounts
  const monthlyTotalsMap = new Map<string, { year: number; month: number; monthName: string; total: number }>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    if (monthlyTotalsMap.has(monthKey)) {
      const existing = monthlyTotalsMap.get(monthKey)!;
      existing.total += expense.amount;
    } else {
      monthlyTotalsMap.set(monthKey, {
        year,
        month,
        monthName,
        total: expense.amount
      });
    }
  });

  // Convert to array and sort by year and month (descending - latest first)
  const monthlyTotals: MonthlyTotal[] = Array.from(monthlyTotalsMap.values())
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

  console.log('Monthly totals calculated:', monthlyTotals);
  console.log('Monthly totals details:', monthlyTotals.map(item => ({
    month: item.month,
    year: item.year,
    total: item.total,
    monthKey: `${item.year}-${String(new Date(item.year, new Date(`${item.month} 1, ${item.year}`).getMonth()).getMonth() + 1).padStart(2, '0')}`
  })));

  return { monthlyTotals, loading, error };
}
