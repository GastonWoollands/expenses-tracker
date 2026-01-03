/**
 * Analytics utility functions for data transformation and filtering
 */

import type { Expense } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subDays, startOfYear, endOfYear } from 'date-fns';

export interface FilterOptions {
  search?: string;
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  expenseType?: 'all' | 'fixed' | 'variable';
}

export interface DateRangePreset {
  label: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Apply filters to expenses
 */
export function filterExpenses(expenses: Expense[], filters: FilterOptions): Expense[] {
  return expenses.filter(expense => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesDescription = expense.description.toLowerCase().includes(searchLower);
      const matchesCategory = expense.category.toLowerCase().includes(searchLower);
      if (!matchesDescription && !matchesCategory) {
        return false;
      }
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(expense.category)) {
        return false;
      }
    }

    // Amount range filter
    if (filters.minAmount !== undefined && expense.amount < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== undefined && expense.amount > filters.maxAmount) {
      return false;
    }

    // Date range filter
    if (filters.startDate) {
      const expenseDate = new Date(expense.date);
      if (expenseDate < filters.startDate) {
        return false;
      }
    }
    if (filters.endDate) {
      const expenseDate = new Date(expense.date);
      if (expenseDate > filters.endDate) {
        return false;
      }
    }

    // Expense type filter
    if (filters.expenseType && filters.expenseType !== 'all') {
      if (filters.expenseType === 'fixed' && !expense.is_fixed) {
        return false;
      }
      if (filters.expenseType === 'variable' && expense.is_fixed) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Group expenses by month for trends
 */
export function groupExpensesByMonth(expenses: Expense[]): Map<string, Expense[]> {
  const grouped = new Map<string, Expense[]>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(expense);
  });
  
  return grouped;
}

/**
 * Group expenses by category
 */
export function groupExpensesByCategory(expenses: Expense[]): Map<string, Expense[]> {
  const grouped = new Map<string, Expense[]>();
  
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(expense);
  });
  
  return grouped;
}

/**
 * Calculate totals by month
 */
export function calculateMonthlyTotals(expenses: Expense[]): Array<{ month: string; total: number; count: number }> {
  const grouped = groupExpensesByMonth(expenses);
  const totals: Array<{ month: string; total: number; count: number }> = [];
  
  grouped.forEach((monthExpenses, month) => {
    const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    totals.push({
      month,
      total,
      count: monthExpenses.length
    });
  });
  
  // Sort by month
  totals.sort((a, b) => a.month.localeCompare(b.month));
  
  return totals;
}

/**
 * Calculate category breakdown
 */
export function calculateCategoryBreakdown(expenses: Expense[], topN: number = 10): Array<{
  category: string;
  amount: number;
  count: number;
  percentage: number;
}> {
  const grouped = groupExpensesByCategory(expenses);
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const breakdown: Array<{ category: string; amount: number; count: number; percentage: number }> = [];
  
  grouped.forEach((categoryExpenses, category) => {
    const amount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    breakdown.push({
      category,
      amount,
      count: categoryExpenses.length,
      percentage: total > 0 ? (amount / total) * 100 : 0
    });
  });
  
  // Sort by amount descending
  breakdown.sort((a, b) => b.amount - a.amount);
  
  // Take top N and group the rest as "Other"
  if (breakdown.length > topN) {
    const topCategories = breakdown.slice(0, topN);
    const otherAmount = breakdown.slice(topN).reduce((sum, item) => sum + item.amount, 0);
    const otherCount = breakdown.slice(topN).reduce((sum, item) => sum + item.count, 0);
    
    if (otherAmount > 0) {
      topCategories.push({
        category: 'Other',
        amount: otherAmount,
        count: otherCount,
        percentage: total > 0 ? (otherAmount / total) * 100 : 0
      });
    }
    
    return topCategories;
  }
  
  return breakdown;
}

/**
 * Calculate spending by day of week
 */
export function calculateDayOfWeekSpending(expenses: Expense[]): Array<{
  day: string;
  dayIndex: number;
  total: number;
  count: number;
  average: number;
}> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayTotals = Array(7).fill(0).map((_, i) => ({
    day: dayNames[i],
    dayIndex: i,
    total: 0,
    count: 0,
    average: 0
  }));
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const dayIndex = date.getDay();
    dayTotals[dayIndex].total += expense.amount;
    dayTotals[dayIndex].count += 1;
  });
  
  dayTotals.forEach(day => {
    day.average = day.count > 0 ? day.total / day.count : 0;
  });
  
  return dayTotals;
}

/**
 * Calculate spending by time of month
 */
export function calculateTimeOfMonthSpending(expenses: Expense[]): Array<{
  period: string;
  total: number;
  count: number;
  average: number;
}> {
  const periods = [
    { period: 'beginning', total: 0, count: 0, average: 0 },
    { period: 'middle', total: 0, count: 0, average: 0 },
    { period: 'end', total: 0, count: 0, average: 0 }
  ];
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const day = date.getDate();
    
    let periodIndex: number;
    if (day <= 10) {
      periodIndex = 0; // beginning
    } else if (day <= 20) {
      periodIndex = 1; // middle
    } else {
      periodIndex = 2; // end
    }
    
    periods[periodIndex].total += expense.amount;
    periods[periodIndex].count += 1;
  });
  
  periods.forEach(period => {
    period.average = period.count > 0 ? period.total / period.count : 0;
  });
  
  return periods;
}

/**
 * Date range presets
 */
export function getDateRangePresets(): DateRangePreset[] {
  const now = new Date();
  
  return [
    {
      label: 'This Week',
      startDate: startOfWeek(now, { weekStartsOn: 1 }), // Monday
      endDate: endOfWeek(now, { weekStartsOn: 1 })
    },
    {
      label: 'Last Month',
      startDate: startOfMonth(subMonths(now, 1)),
      endDate: endOfMonth(subMonths(now, 1))
    },
    {
      label: 'This Month',
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    },
    {
      label: 'Last 30 Days',
      startDate: subDays(now, 30),
      endDate: now
    },
    {
      label: 'This Year',
      startDate: startOfYear(now),
      endDate: endOfYear(now)
    },
    {
      label: 'All Time',
      startDate: new Date(2000, 0, 1), // Arbitrary old date
      endDate: now
    }
  ];
}

/**
 * Format date for API (ISO string)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date from API string
 */
export function parseDateFromAPI(dateString: string): Date {
  return new Date(dateString);
}

