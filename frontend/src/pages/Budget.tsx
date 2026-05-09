/**
 * Budget: income, category limits, and monthly overview (layout aligned with Dashboard)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, Heading, Card, Button } from '../components';
import BudgetSummaryCard from '../components/ui/BudgetSummaryCard';
import BudgetCategoryTable from '../components/ui/BudgetCategoryTable';
import MonthlyBudgetOverview from '../components/ui/MonthlyBudgetOverview';
import BudgetCategorySetup from '../components/ui/BudgetCategorySetup';
import { useBudgetData } from '../hooks/useBudgetData';
import { getCurrentMonthName, getCurrentYear } from '../utils/formatters';
import { Settings, LayoutDashboard, Wallet, Loader2, CheckCircle, CircleAlert } from 'lucide-react';

const Budget: React.FC = () => {
  const {
    budgetData,
    loading,
    error,
    saveStatus,
    updateIncome,
    updateCategoryBudget,
    refreshData,
  } = useBudgetData();

  const [editingIncome, setEditingIncome] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showCategorySetup, setShowCategorySetup] = useState(false);

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="space-y-10 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Heading level={2}>Budget</Heading>
              <p className="mt-2 max-w-xl text-sm font-light text-fg-muted">Loading your budget overview…</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-1/4 rounded bg-surface-muted" />
                  <div className="h-8 w-1/2 rounded bg-surface-muted" />
                  <div className="h-4 w-1/3 rounded bg-surface-muted" />
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/2 rounded bg-surface-muted" />
                  <div className="h-6 w-3/4 rounded bg-surface-muted" />
                </div>
              </Card>
              <Card>
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/2 rounded bg-surface-muted" />
                  <div className="h-6 w-3/4 rounded bg-surface-muted" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }

  if (error) {
    return (
      <ResponsiveContainer maxWidth="xl">
        <div className="space-y-10 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Heading level={2}>Budget</Heading>
              <p className="mt-2 max-w-xl text-sm font-light text-fg-muted">Unable to load budget data.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-[var(--radius-control)] border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg shadow-[var(--shadow-card)] transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
              Dashboard
            </Link>
          </div>
          <Card>
            <div className="text-center">
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button type="button" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="xl">
      <div className="space-y-10 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Heading level={2}>Budget</Heading>
            <p className="mt-2 max-w-xl text-sm font-light text-fg-muted">
              Track income, spending limits, and goals for {getCurrentMonthName()} {getCurrentYear()}.
            </p>
            <div className="mt-4 flex min-h-[2rem] flex-wrap items-center gap-2">
              {saveStatus.saving && (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-sm text-fg">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden />
                  Saving…
                </span>
              )}
              {saveStatus.saved && !saveStatus.saving && (
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-sm text-fg">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  Saved
                </span>
              )}
              {saveStatus.error && (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
                  {saveStatus.error}
                </span>
              )}
            </div>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-[var(--radius-control)] border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-fg shadow-[var(--shadow-card)] transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
            Dashboard
          </Link>
        </div>

        <BudgetSummaryCard
          income={budgetData.income}
          totalExpenses={budgetData.totalExpenses}
          remainingBalance={budgetData.remainingBalance}
          editingIncome={editingIncome}
          onEditIncome={() => setEditingIncome(true)}
          onSaveIncome={(amount: number) => {
            updateIncome(amount);
            setEditingIncome(false);
          }}
          onCancelEdit={() => setEditingIncome(false)}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Heading level={2}>Budget by category</Heading>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-light text-fg-muted">{budgetData.categories.length} categories</p>
              <button
                type="button"
                onClick={() => setShowCategorySetup(true)}
                className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-fg shadow-[var(--shadow-card)] transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <Settings className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
                Set up categories
              </button>
            </div>
          </div>

          <BudgetCategoryTable
            categories={budgetData.categories}
            editingCategory={editingCategory}
            onEditCategory={(categoryId: string) => setEditingCategory(categoryId)}
            onSaveCategory={(categoryId: string, budget: number) => {
              updateCategoryBudget(categoryId, budget);
              setEditingCategory(null);
            }}
            onCancelEdit={() => setEditingCategory(null)}
          />
        </div>

        <MonthlyBudgetOverview
          totalBudget={budgetData.totalBudget}
          totalExpenses={budgetData.totalExpenses}
          difference={budgetData.budgetDifference}
        />

        {budgetData.categories.length === 0 && (
          <Card>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
                <Wallet className="h-8 w-8 text-fg-muted" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-fg">No budget categories yet</h3>
              <p className="mx-auto mb-6 max-w-md text-sm font-light text-fg-muted">
                Add limits for your expense categories to see progress against your plan.
              </p>
              <Button type="button" onClick={() => setShowCategorySetup(true)}>
                Set up categories
              </Button>
            </div>
          </Card>
        )}
      </div>

      <BudgetCategorySetup
        isOpen={showCategorySetup}
        onClose={() => setShowCategorySetup(false)}
        onSave={() => {
          refreshData();
        }}
        existingBudgets={budgetData.categories
          .filter((cat) => cat.budget > 0)
          .map((cat) => ({
            category_key: cat.id,
            amount: cat.budget,
          }))}
      />
    </ResponsiveContainer>
  );
};

export default Budget;
