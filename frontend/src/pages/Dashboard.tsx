/**
 * Dashboard: Minimalist, responsive expense overview
 * Mobile-first design with elegant interactions
 */

import React, { useState } from 'react';
import { ResponsiveContainer, Heading, MetricCard, DataTable, CategoryBar } from '../components';
import type { Column, SortDirection } from '../components/ui/DataTable';
import { useCurrentMonthExpenses, useExpenseSummary, useMonthlyTotals } from '../hooks/useDashboardData';
import { formatCurrency, formatDateShort, getCurrentMonthName, getCurrentYear, calculatePercentage, sortByKey, getPreviousMonth, calculateTrendPercentage } from '../utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Expense } from '../services/api';

const Dashboard: React.FC = () => {
  const { expenses: currentMonthExpenses, loading: expensesLoading, error: expensesError } = useCurrentMonthExpenses();
  const { summary, loading: summaryLoading } = useExpenseSummary();
  const { monthlyTotals, loading: totalsLoading } = useMonthlyTotals();
  
  const [sortKey, setSortKey] = useState<keyof Expense | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          {String(value)}
        </span>
      ),
      className: 'w-24 sm:w-28',
      mobileHidden: true
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value: any) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(Number(value))}
        </span>
      ),
      className: 'text-right w-20 sm:w-24'
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
          <div className="font-medium text-gray-900 dark:text-white">
            {String(value)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
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
      className: 'text-right font-semibold'
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (value: any) => {
        const trend = Number(value);
        if (trend === undefined || isNaN(trend)) return '-';
        
        const isPositive = trend > 0;
        return (
          <span className={`inline-flex items-center text-sm font-medium ${
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

  const isLoading = expensesLoading || summaryLoading || totalsLoading;

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
      <div className="min-h-screen py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center">
            <Heading level={1} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Overview of your expenses and spending patterns
            </p>
            {currentMonthExpenses.length === 0 && (
              <div className="mt-6 max-w-md mx-auto p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  No expenses found. <a href="/expenses" className="underline hover:no-underline font-medium">Add your first expense</a> to see your dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Current Month Total Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <MetricCard
                title="Total Spent This Month"
                value={formatCurrency(summary.totalAmount)}
                subtitle={`${getCurrentMonthName()} ${getCurrentYear()}`}
                trend={previousMonthTotal > 0 ? {
                  value: trendPercentage,
                  isPositive: trendPercentage > 0
                } : monthlyTotals.length === 0 ? {
                  value: 0,
                  isPositive: true,
                  isFirstMonth: true
                } : undefined}
                className="h-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <MetricCard
                title="Transactions"
                value={summary.totalCount}
                subtitle="This month"
              />
              <MetricCard
                title="Average"
                value={formatCurrency(summary.averageAmount)}
                subtitle="Per transaction"
              />
            </div>
          </div>

          {/* Current Month Expenses Table */}
          <DataTable
            data={sortedExpenses}
            columns={expenseColumns}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            title="Recent Transactions"
            subtitle={`All expenses from ${getCurrentMonthName()} ${getCurrentYear()}`}
            emptyMessage="No expenses recorded this month"
          />

          {/* Expenses by Category & Monthly Totals */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {/* Expenses by Category */}
            <CategoryBar
              data={categoryData}
              title="Spending by Category"
              subtitle={`Breakdown for ${getCurrentMonthName()}`}
            />

            {/* Monthly Totals */}
            <DataTable
              data={monthlyTotals}
              columns={monthlyColumns}
              title="Monthly Totals"
              subtitle="Spending trends over time"
              emptyMessage="No monthly data available"
            />
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default Dashboard;