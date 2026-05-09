/**
 * Dashboard:
 * Mobile-first design with progressive disclosure and theme tokens
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, Heading, DataTable, CategoryBar, EditExpenseModal, Toast, Button } from '../components';
import ExpenseChat from '../components/ui/ExpenseChat';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';
import type { Column, SortDirection } from '../components/ui/DataTable';
import { useCurrentMonthExpenses, useExpenseSummary, useMonthlyTotals, useExpenses } from '../hooks/useDashboardData';
import { formatCurrency, formatDateShort, getCurrentMonthName, getCurrentYear, calculatePercentage, sortByKey, getPreviousMonth, calculateTrendPercentage } from '../utils/formatters';
import { TrendingUp, TrendingDown, Edit2, Trash2, Plus } from 'lucide-react';
import type { Expense, ExpenseUpdate } from '../services/api';
import { apiService } from '../services/api';
import { startOfMonth, endOfMonth } from 'date-fns';
import { formatDateForAPI } from '../utils/analytics';

/** Same scroll viewport for Spending by category vs Monthly totals (aligned UI). */
const DASHBOARD_COMPARE_PANEL_OUTER =
  'flex h-[max(10rem,min(28rem,50svh))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-raised shadow-[var(--shadow-card)]';
const DASHBOARD_COMPARE_PANEL_INNER =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3';

const Dashboard: React.FC = () => {
  const { expenses: currentMonthExpenses, loading: expensesLoading, error: expensesError, refetch: refetchCurrentMonth } = useCurrentMonthExpenses();
  const { summary, loading: summaryLoading } = useExpenseSummary();
  const { monthlyTotals, loading: totalsLoading } = useMonthlyTotals();
  const { refetch: refetchAllExpenses } = useExpenses();

  const [sortKey, setSortKey] = useState<keyof Expense | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const [fixedVsVariable, setFixedVsVariable] = useState<{
    fixed: { amount: number; count: number; percentage: number };
    variable: { amount: number; count: number; percentage: number };
  } | null>(null);
  const [fixedVsVariableLoading, setFixedVsVariableLoading] = useState(true);

  const currentMonthRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
    };
  }, []);

  useEffect(() => {
    const fetchFixedVsVariable = async () => {
      try {
        setFixedVsVariableLoading(true);
        const data = await apiService.getFixedVsVariableComparison(
          formatDateForAPI(currentMonthRange.startDate),
          formatDateForAPI(currentMonthRange.endDate),
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

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPendingDelete(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingDelete]);

  const handleSort = (key: keyof Expense, direction: SortDirection) => {
    setSortKey(direction ? key : undefined);
    setSortDirection(direction);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const executePendingDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const expense = pendingDelete;
    try {
      await apiService.deleteExpense(expense.id);
      await Promise.all([refetchCurrentMonth().catch(() => {}), refetchAllExpenses().catch(() => {})]);
      setPendingDelete(null);
      setToast({ message: 'Expense deleted successfully', type: 'success' });
    } catch (error: unknown) {
      console.error('Error deleting expense:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete expense. Please try again.';
      setToast({ message, type: 'error' });
    }
  }, [pendingDelete, refetchCurrentMonth, refetchAllExpenses]);

  const handleDeleteRequest = (expense: Expense) => {
    setPendingDelete(expense);
  };

  const handleSaveEdit = async (id: string, updates: ExpenseUpdate) => {
    try {
      await apiService.updateExpense(id, updates);
      await Promise.all([refetchCurrentMonth().catch(() => {}), refetchAllExpenses().catch(() => {})]);
      setEditingExpense(null);
      setToast({ message: 'Expense updated successfully', type: 'success' });
    } catch (error: unknown) {
      console.error('Error updating expense:', error);
      const message = error instanceof Error ? error.message : 'Failed to update expense. Please try again.';
      setToast({ message, type: 'error' });
      throw error;
    }
  };

  const sortedExpenses = sortKey && sortDirection ? sortByKey(currentMonthExpenses, sortKey, sortDirection) : currentMonthExpenses;

  const currentMonthTotal = summary.totalAmount;
  const previousMonthInfo = getPreviousMonth();

  const previousMonthData = monthlyTotals.find(
    (item) => item.year === previousMonthInfo.year && item.month === previousMonthInfo.monthName,
  );

  let comparisonData = previousMonthData;
  if (!previousMonthData && monthlyTotals.length > 0) {
    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
    const currentYear = new Date().getFullYear();
    comparisonData = monthlyTotals.find((item) => !(item.month === currentMonthName && item.year === currentYear));
  }

  const previousMonthTotal = comparisonData?.total || 0;
  const trendPercentage = calculateTrendPercentage(currentMonthTotal, previousMonthTotal);
  const trendVsLabel =
    comparisonData && previousMonthTotal > 0 ? `vs ${comparisonData.month} ${comparisonData.year}` : '';

  const monthlyTotalsHint = useMemo(() => {
    if (monthlyTotals.length === 0) return 'No history yet';
    const latest = monthlyTotals[0];
    return `${monthlyTotals.length} ${monthlyTotals.length === 1 ? 'month' : 'months'} · Latest: ${formatCurrency(latest.total)} (${latest.month} ${latest.year})`;
  }, [monthlyTotals]);

  const expenseColumns: Column<Expense>[] = [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        render: (value: unknown) => formatDateShort(String(value)),
        className: 'w-20 sm:w-24',
      },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        className: 'min-w-0 flex-1',
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        render: (value: unknown) => (
          <span className="text-xs font-light text-fg-muted">{String(value)}</span>
        ),
        className: 'w-24 sm:w-28',
        mobileHidden: true,
      },
      {
        key: 'is_fixed' as keyof Expense,
        label: 'Type',
        sortable: true,
        render: (_value: unknown, item: Expense) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-control)] text-xs font-light ${
              item.is_fixed ? 'bg-surface-muted text-fg' : 'bg-accent-soft text-accent dark:bg-accent/15'
            }`}
          >
            {item.is_fixed ? 'Fixed' : 'Variable'}
          </span>
        ),
        className: 'w-20 sm:w-24',
        mobileHidden: true,
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        render: (value: unknown) => (
          <span className="font-light text-fg">{formatCurrency(Number(value))}</span>
        ),
        className: 'text-right w-20 sm:w-24',
      },
      {
        key: 'id' as keyof Expense,
        label: 'Actions',
        sortable: false,
        render: (_value: unknown, item: Expense) => (
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
              className="p-1.5 text-fg-muted hover:text-accent rounded-[var(--radius-control)] hover:bg-surface-hover transition-colors"
              title="Edit expense"
              aria-label={`Edit ${item.description}`}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRequest(item);
              }}
              className="p-1.5 text-fg-muted hover:text-red-600 dark:hover:text-red-400 rounded-[var(--radius-control)] hover:bg-surface-hover transition-colors"
              title="Delete expense"
              aria-label={`Delete ${item.description}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
        className: 'w-24 text-right',
      },
    ];

  const categoryData = Object.entries(summary.categoryBreakdown)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: calculatePercentage(data.amount, summary.totalAmount),
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyColumns: Column<(typeof monthlyTotals)[0]>[] = [
      {
        key: 'month',
        label: 'Month',
        render: (value: unknown, item: (typeof monthlyTotals)[0]) => (
          <div>
            <div className="font-light text-fg">{String(value)}</div>
            <div className="text-xs text-fg-muted font-light">{item.year}</div>
          </div>
        ),
        className: 'w-20 sm:w-24',
      },
      {
        key: 'total',
        label: 'Total',
        render: (value: unknown) => formatCurrency(Number(value)),
        className: 'text-right font-light text-fg',
      },
      {
        key: 'trend',
        label: 'Trend',
        render: (value: unknown) => {
          const trend = Number(value);
          if (trend === undefined || Number.isNaN(trend)) return '-';
          const isPositive = trend > 0;
          return (
            <span
              className={`inline-flex items-center text-sm font-light ${
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          );
        },
        className: 'text-right w-20',
        mobileHidden: true,
      },
    ];

  const isLoading = expensesLoading || summaryLoading || totalsLoading || fixedVsVariableLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (expensesError) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="min-h-[50vh] flex items-center justify-center py-12 px-4">
          <div
            role="alert"
            className="max-w-md w-full rounded-[var(--radius-card)] border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center shadow-[var(--shadow-card)]"
          >
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Could not load dashboard</h3>
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">{expensesError}</p>
            <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  const heroTotal =
    fixedVsVariable ? fixedVsVariable.fixed.amount + fixedVsVariable.variable.amount : summary.totalAmount;

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-10 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={2}>Dashboard</Heading>
            <p className="mt-2 text-sm text-fg-muted font-light max-w-xl">
              Overview of your expenses and spending patterns this month.
            </p>
            {currentMonthExpenses.length === 0 && (
              <div className="mt-5 max-w-md rounded-[var(--radius-card)] border border-accent-soft-border bg-accent-soft p-4 dark:bg-accent/10">
                <p className="text-sm text-fg font-light">
                  No expenses yet.{' '}
                  <Link to="/expenses" className="font-medium text-accent hover:text-accent-hover underline underline-offset-2">
                    Add your first expense
                  </Link>{' '}
                  to see your dashboard.
                </p>
              </div>
            )}
          </div>
          <Link
            to="/expenses"
            className="inline-flex items-center justify-center gap-2 self-start rounded-[var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-medium text-on-accent shadow-[var(--shadow-card)] hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-opacity"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Add expense
          </Link>
        </div>

        {/* This month — single surfaced card */}
        <section
          className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-6 md:p-8 shadow-[var(--shadow-card)]"
          aria-labelledby="dashboard-month-heading"
        >
          <h3 id="dashboard-month-heading" className="text-base font-medium text-fg mb-6 tracking-wide">
            {getCurrentMonthName()} {getCurrentYear()}
          </h3>

          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h4 className="text-xs font-normal text-fg-muted tracking-wide uppercase">Total spent this month</h4>
              {previousMonthTotal > 0 && (
                <div className="flex flex-col items-end gap-0.5 text-right">
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-[var(--radius-control)] ${
                      trendPercentage > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    <span className="mr-1" aria-hidden>
                      {trendPercentage > 0 ? '↗' : '↘'}
                    </span>
                    {Math.abs(trendPercentage).toFixed(1)}%
                  </span>
                  {trendVsLabel && (
                    <span className="text-[11px] text-fg-muted font-light max-w-[12rem]">{trendVsLabel}</span>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-4xl font-light text-fg tracking-tight tabular-nums">{formatCurrency(heroTotal)}</p>
          </div>

          {fixedVsVariable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 border-t border-divider">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-normal text-fg-muted tracking-wide uppercase">Fixed expenses</h4>
                  <span className="text-xs text-fg-muted font-light">{fixedVsVariable.fixed.percentage.toFixed(1)}%</span>
                </div>
                <p className="text-2xl font-light text-fg tracking-tight tabular-nums">
                  {formatCurrency(fixedVsVariable.fixed.amount)}
                </p>
                <p className="text-xs text-fg-muted font-light">
                  {fixedVsVariable.fixed.count} {fixedVsVariable.fixed.count === 1 ? 'expense' : 'expenses'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-normal text-fg-muted tracking-wide uppercase">Variable expenses</h4>
                  <span className="text-xs text-fg-muted font-light">{fixedVsVariable.variable.percentage.toFixed(1)}%</span>
                </div>
                <p className="text-2xl font-light text-fg tracking-tight tabular-nums">
                  {formatCurrency(fixedVsVariable.variable.amount)}
                </p>
                <p className="text-xs text-fg-muted font-light">
                  {fixedVsVariable.variable.count} {fixedVsVariable.variable.count === 1 ? 'expense' : 'expenses'}
                </p>
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-10 xl:grid-cols-2 xl:gap-12">
          <section aria-labelledby="category-heading" className="flex min-w-0 flex-col gap-2">
            <h3 id="category-heading" className="text-base font-medium text-fg tracking-wide">
              Spending by category
            </h3>
            <div className="flex min-h-[3.75rem] flex-col justify-start gap-1">
              <p className="text-xs font-light text-fg-muted leading-snug">
                Tap a category to expand and see transactions for this month.
              </p>
              <p className="text-xs font-light text-fg-muted leading-snug">
                Scroll inside the box below. Period: {getCurrentMonthName()} {getCurrentYear()}.
              </p>
            </div>
            <div className={`mt-1 ${DASHBOARD_COMPARE_PANEL_OUTER}`}>
              <div className={DASHBOARD_COMPARE_PANEL_INNER}>
                <CategoryBar data={categoryData} expenses={currentMonthExpenses} />
              </div>
            </div>
            <div className="flex min-h-[2.75rem] items-start pt-1 text-xs text-fg-muted">
              <Link
                to="/expenses"
                className="text-accent underline-offset-2 hover:text-accent-hover hover:underline"
              >
                Manage expenses
              </Link>{' '}
              to add or recategorize.
            </div>
          </section>

          <section aria-labelledby="monthly-heading" className="flex min-w-0 flex-col gap-2">
            <h3 id="monthly-heading" className="text-base font-medium text-fg tracking-wide">
              Monthly totals
            </h3>
            <div className="flex min-h-[3.75rem] flex-col justify-start gap-1">
              <p className="text-xs font-light text-fg-muted leading-snug">{monthlyTotalsHint}</p>
              <p className="text-xs font-light text-fg-muted leading-snug">
                Spending trends over time. Scroll inside the box below.
              </p>
            </div>
            <div className={`mt-1 ${DASHBOARD_COMPARE_PANEL_OUTER}`}>
              <div className={DASHBOARD_COMPARE_PANEL_INNER}>
                <DataTable data={monthlyTotals} columns={monthlyColumns} emptyMessage="No monthly data available" />
              </div>
            </div>
            <div className="flex min-h-[2.75rem] items-start pt-1 text-xs text-fg-muted">
              <Link
                to="/analytics"
                className="text-accent underline-offset-2 hover:text-accent-hover hover:underline"
              >
                Open analytics
              </Link>{' '}
              for charts and deeper trends.
            </div>
          </section>
        </div>

        <section aria-labelledby="transactions-heading">
          <h3 id="transactions-heading" className="text-base font-medium text-fg mb-6 tracking-wide">
            Recent transactions
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
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="px-3 py-1.5 text-sm text-accent hover:text-accent-hover transition-colors rounded-[var(--radius-control)] hover:bg-accent-soft flex items-center gap-1.5"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(item);
                  }}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-[var(--radius-control)] hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          />
        </section>
      </div>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center bg-black/40"
          role="presentation"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface-raised shadow-[var(--shadow-card)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-dialog-title" className="text-base font-semibold text-fg">
              Delete expense?
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              &ldquo;<span className="text-fg font-medium">{pendingDelete.description}</span>&rdquo; will be removed. This cannot be undone.
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!bg-red-600 hover:!bg-red-700 focus-visible:ring-red-500"
                onClick={() => void executePendingDelete()}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <EditExpenseModal expense={editingExpense} isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} onSave={handleSaveEdit} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ExpenseChat />
    </ResponsiveContainer>
  );
};

export default Dashboard;
