/**
 * MonthlyBudgetOverview: total budget vs expenses
 */

import React from 'react';
import Card from '../Card';
import Heading from './Heading';
import { formatCurrency } from '../../utils/formatters';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyBudgetOverviewProps {
  totalBudget: number;
  totalExpenses: number;
  difference: number;
}

const MonthlyBudgetOverview: React.FC<MonthlyBudgetOverviewProps> = ({
  totalBudget,
  totalExpenses,
  difference,
}) => {
  const isOverBudget = difference < 0;
  const isNearBudget = difference >= 0 && difference < totalBudget * 0.1;
  const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading level={2}>Monthly budget overview</Heading>
          <div
            className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-semibold ${
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
                <Target className="mr-1 h-3 w-3" aria-hidden />
                On track
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center sm:text-left">
            <div className="mb-1 text-sm text-fg-muted">Total budget</div>
            <div className="text-xl font-semibold tabular-nums text-fg">{formatCurrency(totalBudget)}</div>
          </div>

          <div className="text-center sm:text-left">
            <div className="mb-1 text-sm text-fg-muted">Total expenses</div>
            <div className="text-xl font-semibold tabular-nums text-fg">{formatCurrency(totalExpenses)}</div>
          </div>

          <div className="text-center sm:text-left">
            <div className="mb-1 text-sm text-fg-muted">{isOverBudget ? 'Over budget' : 'Remaining'}</div>
            <div
              className={`text-xl font-semibold tabular-nums ${
                isOverBudget
                  ? 'text-red-600 dark:text-red-300'
                  : isNearBudget
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {formatCurrency(Math.abs(difference))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-fg-muted">Budget utilization</span>
            <span
              className={`font-medium tabular-nums ${
                isOverBudget
                  ? 'text-red-600 dark:text-red-300'
                  : isNearBudget
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isOverBudget
                  ? 'bg-red-600/80'
                  : isNearBudget
                    ? 'bg-amber-600/80'
                    : 'bg-emerald-600/80'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />

            {isOverBudget && <div className="pointer-events-none absolute inset-0 bg-red-200/30 dark:bg-red-800/25" />}

            {budgetUtilization > 100 && (
              <div className="absolute top-0 left-full h-full w-0.5 bg-border-strong" />
            )}
          </div>
        </div>

        <div className="text-center">
          <p
            className={`text-sm font-light ${
              isOverBudget
                ? 'text-red-600 dark:text-red-300'
                : isNearBudget
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {isOverBudget
              ? `You have exceeded your budget by ${formatCurrency(Math.abs(difference))}.`
              : totalBudget > 0
                ? `You have ${formatCurrency(difference)} remaining (${((difference / totalBudget) * 100).toFixed(1)}% of budget left).`
                : `You have ${formatCurrency(difference)} remaining.`}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyBudgetOverview;
