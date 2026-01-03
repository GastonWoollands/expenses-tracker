/**
 * Analytics page: Comprehensive analytics dashboard with visual insights and filtering
 */

import React, { useState, useMemo } from 'react';
import { Heading, MetricCard } from '../components';
import FilterBar from '../components/ui/FilterBar';
import SpendingTrendChart from '../components/ui/SpendingTrendChart';
import CategoryChart from '../components/ui/CategoryChart';
import TopCategoriesChart from '../components/ui/TopCategoriesChart';
import FixedVsVariableChart from '../components/ui/FixedVsVariableChart';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useExpenses } from '../hooks/useDashboardData';
import { filterExpenses, type FilterOptions } from '../utils/analytics';
import { formatCurrency } from '../utils/formatters';
import { startOfMonth, endOfMonth } from 'date-fns';

const Analytics: React.FC = () => {
  // Set default to "This Month"
  const now = new Date();
  const [filters, setFilters] = useState<FilterOptions>({
    expenseType: 'all',
    startDate: startOfMonth(now),
    endDate: endOfMonth(now)
  });

  // Fetch analytics data
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useAnalyticsData(filters);
  
  // Fetch all expenses for client-side filtering and summary
  const { expenses: allExpenses, loading: expensesLoading } = useExpenses();

  // Apply filters to expenses
  const filteredExpenses = useMemo(() => {
    if (!allExpenses || allExpenses.length === 0) return [];
    return filterExpenses(allExpenses, filters);
  }, [allExpenses, filters]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;

    // Calculate trend (compare to previous period)
    // For simplicity, we'll compare to the same period last month
    // This could be enhanced to use actual previous period data
    const previousTotal = 0; // Placeholder - would need to fetch previous period
    const trend = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return {
      total,
      count,
      average,
      trend
    };
  }, [filteredExpenses]);

  const loading = analyticsLoading || expensesLoading;

  return (
    <div className="space-y-12">
      <div>
        <Heading level={2}>Analytics</Heading>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-light">
          Analyze your spending patterns and trends with visual insights
        </p>
      </div>

      {/* Spending Trends Chart - Always visible at top, independent of date filters */}
      {!analyticsLoading && (
        <div>
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
            Spending Trends (Last 6 Months)
          </h3>
          <SpendingTrendChart data={analyticsData.trends} />
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Error State */}
      {analyticsError && (
        <div className="bg-red-50/50 dark:bg-red-900/10 border-l-2 border-red-400 dark:border-red-500 rounded p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{analyticsError}</p>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Spending"
            value={formatCurrency(summaryMetrics.total)}
            trend={
              summaryMetrics.trend !== 0
                ? {
                    value: Math.abs(summaryMetrics.trend),
                    isPositive: summaryMetrics.trend < 0
                  }
                : undefined
            }
          />
          <MetricCard
            title="Transactions"
            value={summaryMetrics.count.toString()}
          />
          <MetricCard
            title="Average Amount"
            value={formatCurrency(summaryMetrics.average)}
          />
          <MetricCard
            title="Top Category"
            value={
              analyticsData.categoryBreakdown.length > 0
                ? analyticsData.categoryBreakdown[0].category
                : 'N/A'
            }
          />
        </div>
      )}

      {/* Charts Section */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse"
            >
              <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded mb-6" />
              <div className="h-80 bg-slate-50 dark:bg-slate-900/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Category Breakdown Chart */}
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
              Category Breakdown
            </h3>
            <CategoryChart
              data={analyticsData.categoryBreakdown}
              type="bar"
            />
          </div>

          {/* Fixed vs Variable Chart */}
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
              Fixed vs Variable Expenses
            </h3>
            <FixedVsVariableChart
              data={analyticsData.fixedVsVariable}
              type="bar"
            />
          </div>

          {/* Top Categories with Trends */}
          <div>
            <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-8 tracking-wide">
              Top Categories with Trends
            </h3>
            <TopCategoriesChart data={analyticsData.topCategories} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredExpenses.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-base mb-1 font-light">
            No expenses found
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-light">
            Try adjusting your filters or add some expenses to see analytics.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
