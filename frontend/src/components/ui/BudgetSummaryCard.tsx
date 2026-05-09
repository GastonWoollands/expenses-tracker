/**
 * BudgetSummaryCard: income, expenses, and remaining balance
 */

import React, { useState } from 'react';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, TrendingUp, TrendingDown, Edit3, Check, X } from 'lucide-react';

const iconSlot =
  'absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none text-fg-muted';

interface BudgetSummaryCardProps {
  income: number;
  totalExpenses: number;
  remainingBalance: number;
  editingIncome: boolean;
  onEditIncome: () => void;
  onSaveIncome: (amount: number) => void;
  onCancelEdit: () => void;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  income,
  totalExpenses,
  remainingBalance,
  editingIncome,
  onEditIncome,
  onSaveIncome,
  onCancelEdit,
}) => {
  const [tempIncome, setTempIncome] = useState(income.toString());

  const handleSave = () => {
    const amount = parseFloat(tempIncome);
    if (!isNaN(amount) && amount >= 0) {
      onSaveIncome(amount);
    }
  };

  const handleCancel = () => {
    setTempIncome(income.toString());
    onCancelEdit();
  };

  const isOverBudget = remainingBalance < 0;
  const isNearBudget = remainingBalance >= 0 && remainingBalance < income * 0.1;

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
      <Card className="transition-shadow hover:shadow-[var(--shadow-card-hover)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-fg-muted">Monthly income</h3>
            {!editingIncome && (
              <button
                type="button"
                onClick={onEditIncome}
                className="rounded-[var(--radius-control)] p-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                aria-label="Edit income"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>

          {editingIncome ? (
            <div className="space-y-3">
              <div className="relative">
                <div className={iconSlot}>
                  <DollarSign className="h-5 w-5" aria-hidden />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempIncome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempIncome(e.target.value)}
                  className="pl-10"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleSave} className="flex-1 text-sm">
                  <Check className="mr-1 h-4 w-4" aria-hidden />
                  Save
                </Button>
                <Button type="button" onClick={handleCancel} variant="secondary" className="flex-1 text-sm">
                  <X className="mr-1 h-4 w-4" aria-hidden />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatCurrency(income)}</div>
              <p className="text-xs text-fg-muted">Per month</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="transition-shadow hover:shadow-[var(--shadow-card-hover)]">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-fg-muted">Total expenses</h3>
          <div className="space-y-1">
            <div className="text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-fg-muted">This month</p>
          </div>
        </div>
      </Card>

      <Card
        className={`transition-shadow hover:shadow-[var(--shadow-card-hover)] ${
          isOverBudget
            ? 'border-red-200 dark:border-red-800/60 bg-red-50/80 dark:bg-red-950/25'
            : isNearBudget
              ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/20'
              : 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/20'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-fg-muted">Remaining balance</h3>
            <div
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-semibold ${
                isOverBudget
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                  : isNearBudget
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                    : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
              }`}
            >
              {isOverBudget ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3" aria-hidden />
                  Over budget
                </>
              ) : isNearBudget ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
                  Near limit
                </>
              ) : (
                <>
                  <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
                  On track
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div
              className={`text-2xl font-semibold tabular-nums tracking-tight ${
                isOverBudget
                  ? 'text-red-600 dark:text-red-300'
                  : isNearBudget
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {formatCurrency(remainingBalance)}
            </div>
            <p className="text-xs text-fg-muted">
              {isOverBudget ? 'Over budget' : isNearBudget ? 'Low balance' : 'Available'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BudgetSummaryCard;
