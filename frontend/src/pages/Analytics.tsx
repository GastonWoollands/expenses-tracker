/**
 * Analytics: spending insights — dot plots + tables, aligned with app theme
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heading, MetricCard, Card, ResponsiveContainer } from '../components';
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
import { LayoutDashboard } from 'lucide-react';

const Analytics: React.FC = () => {
  const now = new Date();
  const [filters, setFilters] = useState<FilterOptions>({
    expenseType: 'all',
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  });

  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useAnalyticsData(filters);
  const { expenses: allExpenses, loading: expensesLoading } = useExpenses();

  const filteredExpenses = useMemo(() => {
    if (!allExpenses || allExpenses.length === 0) return [];
    return filterExpenses(allExpenses, filters);
  }, [allExpenses, filters]);

  const summaryMetrics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;
    const previousTotal = 0;
    const trend = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;
    return { total, count, average, trend };
  }, [filteredExpenses]);

  const loading = analyticsLoading || expensesLoading;

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-10 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={2}>Analytics</Heading>
            <p className="mt-2 max-w-xl text-sm font-light text-fg-muted">
              See how spending is distributed, how fixed compares to variable, and how top categories move vs the last period.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-[var(--radius-control)] border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg shadow-[var(--shadow-card)] transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
            Dashboard
          </Link>
        </div>

        {!analyticsLoading && (
          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-fg">Spending trend</h3>
              <p className="mt-1 text-sm font-light text-fg-muted">Last six months (not affected by filters below).</p>
            </div>
            <Card>
              <SpendingTrendChart data={analyticsData.trends} />
            </Card>
          </section>
        )}

        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {analyticsError && (
          <div className="rounded-[var(--radius-card)] border border-red-200 bg-red-50/80 px-4 py-3 dark:border-red-800/60 dark:bg-red-950/30">
            <p className="text-sm text-red-800 dark:text-red-200">{analyticsError}</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total spending" value={formatCurrency(summaryMetrics.total)} />
            <MetricCard title="Transactions" value={summaryMetrics.count.toString()} />
            <MetricCard title="Average amount" value={formatCurrency(summaryMetrics.average)} />
            <MetricCard
              title="Largest category"
              value={
                analyticsData.categoryBreakdown.length > 0 ? analyticsData.categoryBreakdown[0].category : '—'
              }
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-[var(--radius-card)] border border-border p-4">
                <div className="mb-4 h-5 w-40 rounded bg-surface-muted" />
                <div className="h-4 w-full max-w-md rounded bg-surface-muted" />
                <div className="mt-6 h-48 rounded bg-surface-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-fg">Category breakdown</h3>
                <p className="mt-1 text-sm font-light text-fg-muted">
                  Ranked by amount in your filtered date range. Table matches the chart.
                </p>
              </div>
              <Card>
                <CategoryChart data={analyticsData.categoryBreakdown} />
              </Card>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-fg">Fixed vs variable</h3>
                <p className="mt-1 text-sm font-light text-fg-muted">
                  Scheduled vs flexible spending for the same filters.
                </p>
              </div>
              <Card>
                <FixedVsVariableChart data={analyticsData.fixedVsVariable} />
              </Card>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-fg">Top categories and trends</h3>
                <p className="mt-1 text-sm font-light text-fg-muted">
                  Compared to the previous period of the same length.
                </p>
              </div>
              <Card>
                <TopCategoriesChart data={analyticsData.topCategories} />
              </Card>
            </section>
          </div>
        )}

        {!loading && filteredExpenses.length === 0 && (
          <div className="rounded-[var(--radius-card)] border border-border bg-surface-raised py-14 text-center shadow-[var(--shadow-card)]">
            <p className="text-base font-light text-fg">No expenses in this range</p>
            <p className="mt-2 text-sm font-light text-fg-muted">
              Widen the dates or clear filters, or add expenses to see analytics.
            </p>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
};

export default Analytics;
