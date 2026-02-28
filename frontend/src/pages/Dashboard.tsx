/**
 * Dashboard:
 * Mobile-first design with elegant interactions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, Heading, DataTable, CategoryBar, EditExpenseModal, Toast } from '../components';
import ExpenseChat from '../components/ui/ExpenseChat';
import type { Column, SortDirection } from '../components/ui/DataTable';
import { useCurrentMonthExpenses, useExpenseSummary, useMonthlyTotals, useExpenses } from '../hooks/useDashboardData';
import { formatCurrency, formatDateShort, getCurrentMonthName, getCurrentYear, calculatePercentage, sortByKey, getPreviousMonth, calculateTrendPercentage } from '../utils/formatters';
import { TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import type { Expense, ExpenseUpdate } from '../services/api';
import { apiService } from '../services/api';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatDateForAPI } from '../utils/analytics';

const Dashboard: React.FC = () => {
  // Use hooks - refetch the one that actually provides the displayed data
  const { expenses: currentMonthExpenses, loading: expensesLoading, error: expensesError, refetch: refetchCurrentMonth } = useCurrentMonthExpenses();
  const { summary, loading: summaryLoading } = useExpenseSummary();
  const { monthlyTotals, loading: totalsLoading } = useMonthlyTotals();
  // Get refetch for all expenses (used by monthly totals)
  const { refetch: refetchAllExpenses } = useExpenses();
  
  const [sortKey, setSortKey] = useState<keyof Expense | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Fixed vs Variable data for current month
  const [fixedVsVariable, setFixedVsVariable] = useState<{
    fixed: { amount: number; count: number; percentage: number };
    variable: { amount: number; count: number; percentage: number };
  } | null>(null);
  const [fixedVsVariableLoading, setFixedVsVariableLoading] = useState(true);
  
  // Calculate current month date range
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    };
  }, []);
  
  // Fetch fixed vs variable comparison for current month
  useEffect(() => {
    const fetchFixedVsVariable = async () => {
      try {
        setFixedVsVariableLoading(true);
        const data = await apiService.getFixedVsVariableComparison(
          formatDateForAPI(currentMonthRange.startDate),
          formatDateForAPI(currentMonthRange.endDate)
        );
        setFixedVsVariable(data);
      } catch (error) {
        console.error('Error fetching fixed vs variable data:', error);
        setFixedVsVariable(null);
      } finally {
        setFixedVsVariableLoading(false);
      }
    };
    
    fetchFixedVsVariable();
  }, [currentMonthRange]);

  // Debug logging
  console.log('Dashboard state:', {
    currentMonthExpenses: currentMonthExpenses.length,
    summary,
    monthlyTotals: monthlyTotals.length,
    monthlyTotalsData: monthlyTotals,
    expensesError
  });

  const handleSort = (key: keyof Expense, direction: SortDirection) => {
    setSortKey(direction ? key : undefined);
    setSortDirection(direction);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = async (expense: Expense) => {
    // Confirmación simple del navegador
    if (!window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      return;
    }

    try {
      // Delete the expense directly
      await apiService.deleteExpense(expense.id);
      
      // Refetch expenses to update the dashboard (same as edit)
      await Promise.all([
        refetchCurrentMonth().catch(() => {}),
        refetchAllExpenses().catch(() => {})
      ]);
      
      setToast({ message: 'Expense deleted successfully', type: 'success' });
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      setToast({ 
        message: error?.message || 'Failed to delete expense. Please try again.', 
        type: 'error' 
      });
    }
  };

  const handleSaveEdit = async (id: string, updates: ExpenseUpdate) => {
    try {
      // Update the expense
      await apiService.updateExpense(id, updates);
      
      // Refetch expenses to update the dashboard
      await Promise.all([
        refetchCurrentMonth().catch(() => {}),
        refetchAllExpenses().catch(() => {})
      ]);
      
      setEditingExpense(null);
      setToast({ message: 'Expense updated successfully', type: 'success' });
    } catch (error: any) {
      console.error('Error updating expense:', error);
      setToast({ 
        message: error?.message || 'Failed to update expense. Please try again.', 
        type: 'error' 
      });
      throw error; // Re-throw to let the modal handle it
    }
  };

  const sortedExpenses = sortKey && sortDirection 
    ? sortByKey(currentMonthExpenses, sortKey, sortDirection)
    : currentMonthExpenses;

  // Calculate trend for current month vs previous month
  const currentMonthTotal = summary.totalAmount;
  const previousMonthInfo = getPreviousMonth();
  
  // Find the previous month's total from monthlyTotals
  const previousMonthData = monthlyTotals.find(item => 
    item.year === previousMonthInfo.year && 
    item.month === previousMonthInfo.monthName
  );
  
  // If previous month doesn't exist, try to find the most recent month before current
  let comparisonData = previousMonthData;
  let comparisonLabel = `${previousMonthInfo.monthName} ${previousMonthInfo.year}`;
  
  if (!previousMonthData && monthlyTotals.length > 0) {
    // Find the most recent month that's not the current month
    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
    const currentYear = new Date().getFullYear();
    
    comparisonData = monthlyTotals.find(item => 
      !(item.month === currentMonthName && item.year === currentYear)
    );
    
    if (comparisonData) {
      comparisonLabel = `vs ${comparisonData.month} ${comparisonData.year}`;
    }
  }
  
  const previousMonthTotal = comparisonData?.total || 0;
  const trendPercentage = calculateTrendPercentage(currentMonthTotal, previousMonthTotal);

  console.log('Trend calculation:', {
    currentMonthTotal,
    previousMonthTotal,
    trendPercentage,
    currentMonth: `${getCurrentYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    previousMonth: `${previousMonthInfo.year}-${String(previousMonthInfo.month).padStart(2, '0')}`,
    previousMonthData,
    comparisonData,
    comparisonLabel,
    monthlyTotalsData: monthlyTotals,
    trendData: previousMonthTotal > 0 ? {
      value: trendPercentage,
      isPositive: trendPercentage > 0
    } : undefined
  });

  // Expense table columns
  const expenseColumns: Column<Expense>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: any) => formatDateShort(String(value)),
      className: 'w-20 sm:w-24'
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      className: 'min-w-0 flex-1'
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: any) => (
        <span className="text-xs font-light text-slate-600 dark:text-slate-400">
          {String(value)}
        </span>
      ),
      className: 'w-24 sm:w-28',
      mobileHidden: true
    },
    {
      key: 'is_fixed' as keyof Expense,
      label: 'Type',
      sortable: true,
      render: (_value: any, item: Expense) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-light ${
          item.is_fixed 
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        }`}>
          {item.is_fixed ? 'Fixed' : 'Variable'}
        </span>
      ),
      className: 'w-20 sm:w-24',
      mobileHidden: true
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: any) => (
        <span className="font-light text-slate-900 dark:text-slate-100">
          {formatCurrency(Number(value))}
        </span>
      ),
      className: 'text-right w-20 sm:w-24'
    },
    {
      key: 'id' as keyof Expense,
      label: 'Actions',
      sortable: false,
      render: (_value: any, item: Expense) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
            className="p-1.5 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Edit expense"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await handleDelete(item);
            }}
            className="p-1.5 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Delete expense"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-24 text-right'
    }
  ];

  // Category breakdown data
  const categoryData = Object.entries(summary.categoryBreakdown)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: calculatePercentage(data.amount, summary.totalAmount)
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly totals columns
  const monthlyColumns: Column<typeof monthlyTotals[0]>[] = [
    {
      key: 'month',
      label: 'Month',
      render: (value: any, item: any) => (
        <div>
          <div className="font-light text-slate-900 dark:text-slate-100">
            {String(value)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-light">
            {item.year}
          </div>
        </div>
      ),
      className: 'w-20 sm:w-24'
    },
    {
      key: 'total',
      label: 'Total',
      render: (value: any) => formatCurrency(Number(value)),
      className: 'text-right font-light'
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (value: any) => {
        const trend = Number(value);
        if (trend === undefined || isNaN(trend)) return '-';
        
        const isPositive = trend > 0;
        return (
          <span className={`inline-flex items-center text-sm font-light ${
            isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        );
      },
      className: 'text-right w-20',
      mobileHidden: true
    }
  ];

  const isLoading = expensesLoading || summaryLoading || totalsLoading || fixedVsVariableLoading;

  if (isLoading) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="min-h-screen py-8">
          <div className="text-center py-16">
            <div className="w-8 h-8 mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Loading dashboard...</p>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  if (expensesError) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="min-h-screen py-8">
          <div className="text-center py-16">
            <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error Loading Dashboard
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{expensesError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-12">
        {/* Header */}
        <div>
          <Heading level={2}>Dashboard</Heading>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-light">
            Overview of your expenses and spending patterns
          </p>
          {currentMonthExpenses.length === 0 && (
            <div className="mt-6 max-w-md p-4 bg-blue-50/50 dark:bg-blue-900/10 border-l-2 border-blue-400 dark:border-blue-500 rounded">
              <p className="text-blue-700 dark:text-blue-300 text-sm font-light">
                No expenses found. <a href="/expenses" className="underline hover:no-underline font-medium">Add your first expense</a> to see your dashboard.
              </p>
            </div>
          )}
        </div>

        {/* Current Month Total and Fixed vs Variable Split */}
        <div>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
            {getCurrentMonthName()} {getCurrentYear()}
          </h3>
          
          {/* Total Amount - Calculate from Fixed + Variable to match Analytics */}
          <div className="mb-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-normal text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                  Total Spent This Month
                </h4>
                {previousMonthTotal > 0 && (
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${
                    trendPercentage > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    <span className="mr-1 text-xs">
                      {trendPercentage > 0 ? '↗' : '↘'}
                    </span>
                    {Math.abs(trendPercentage).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-4xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(
                  fixedVsVariable 
                    ? fixedVsVariable.fixed.amount + fixedVsVariable.variable.amount
                    : summary.totalAmount
                )}
              </div>
            </div>
          </div>
          
          {/* Fixed vs Variable Split */}
          {fixedVsVariable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-normal text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                    Fixed Expenses
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-light">
                    {fixedVsVariable.fixed.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatCurrency(fixedVsVariable.fixed.amount)}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light">
                  {fixedVsVariable.fixed.count} {fixedVsVariable.fixed.count === 1 ? 'expense' : 'expenses'}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-normal text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                    Variable Expenses
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-light">
                    {fixedVsVariable.variable.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-2xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatCurrency(fixedVsVariable.variable.amount)}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light">
                  {fixedVsVariable.variable.count} {fixedVsVariable.variable.count === 1 ? 'expense' : 'expenses'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expenses by Category & Monthly Totals */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Expenses by Category */}
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
              Spending by Category
            </h3>
            <CategoryBar
              data={categoryData}
              expenses={currentMonthExpenses}
              subtitle={`Breakdown for ${getCurrentMonthName()}`}
            />
          </div>

          {/* Monthly Totals */}
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
              Monthly Totals
            </h3>
            <DataTable
              data={monthlyTotals}
              columns={monthlyColumns}
              subtitle="Spending trends over time"
              emptyMessage="No monthly data available"
            />
          </div>
        </div>

        {/* Current Month Expenses Table */}
        <div>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
            Recent Transactions
          </h3>
          <DataTable
            data={sortedExpenses}
            columns={expenseColumns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            subtitle={`All expenses from ${getCurrentMonthName()} ${getCurrentYear()}`}
            emptyMessage="No expenses recorded this month"
            renderMobileActions={(item) => (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-1.5"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDelete(item);
                  }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          />
        </div>
      </div>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleSaveEdit}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Expense Chat Assistant */}
      <ExpenseChat />
    </ResponsiveContainer>
  );
};

export default Dashboard;