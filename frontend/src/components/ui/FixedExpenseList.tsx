/**
 * FixedExpenseList: Display list of fixed expenses
 */

import React from 'react';
import { Card } from '../index';
import type { FixedExpense } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Edit2, Trash2, Repeat, Calendar, Coins, Tag, FileText } from 'lucide-react';

interface FixedExpenseListProps {
  fixedExpenses: FixedExpense[];
  onEdit: (fixedExpense: FixedExpense) => void;
  onDelete: (fixedExpense: FixedExpense) => void;
  isLoading?: boolean;
}

const FixedExpenseList: React.FC<FixedExpenseListProps> = ({
  fixedExpenses,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <div className="py-10 text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent"
            role="status"
            aria-label="Loading"
          />
          <p className="text-sm text-fg-muted">Loading fixed expenses…</p>
        </div>
      </Card>
    );
  }

  if (fixedExpenses.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center">
          <Repeat className="mx-auto mb-4 h-12 w-12 text-fg-muted opacity-50" aria-hidden />
          <h3 className="mb-2 text-lg font-semibold text-fg">No fixed expenses yet</h3>
          <p className="mx-auto max-w-md text-sm font-light text-fg-muted">
            Add one to schedule the same amount each month. Entries will appear with the rest of your spending.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fixedExpenses.map((fixedExpense) => (
        <Card
          key={fixedExpense.id}
          className="transition-shadow hover:shadow-[var(--shadow-card-hover)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Repeat className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                <h3 className="font-semibold text-fg">{fixedExpense.category_name}</h3>
                {fixedExpense.is_active ? (
                  <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent dark:bg-accent/15">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-muted">
                    Inactive
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
                  <span className="text-fg-muted">Amount</span>
                  <span className="font-semibold tabular-nums text-fg">{formatCurrency(fixedExpense.amount)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
                  <span className="text-fg-muted">Day</span>
                  <span className="font-semibold text-fg">{fixedExpense.day_of_month}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
                  <span className="text-fg-muted">Currency</span>
                  <span className="font-semibold text-fg">{fixedExpense.currency}</span>
                </div>
              </div>

              {fixedExpense.description && (
                <div className="mt-3 flex items-start gap-2 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
                  <p className="font-light text-fg-muted">{fixedExpense.description}</p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(fixedExpense)}
                className="rounded-[var(--radius-control)] p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-accent"
                title="Edit fixed expense"
                aria-label={`Edit ${fixedExpense.category_name}`}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(fixedExpense)}
                className="rounded-[var(--radius-control)] p-2 text-fg-muted transition-colors hover:bg-surface-hover hover:text-red-600 dark:hover:text-red-400"
                title="Delete fixed expense"
                aria-label={`Delete ${fixedExpense.category_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FixedExpenseList;
