/**
 * BudgetCategoryTable: budget status by category
 */

import React from 'react';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import CategoryProgressBar from './CategoryProgressBar';
import { formatCurrency } from '../../utils/formatters';
import { Edit3, Check, X, PieChart } from 'lucide-react';

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

interface BudgetCategoryTableProps {
  categories: BudgetCategory[];
  editingCategory: string | null;
  onEditCategory: (categoryId: string) => void;
  onSaveCategory: (categoryId: string, budget: number) => void;
  onCancelEdit: () => void;
}

const BudgetCategoryTable: React.FC<BudgetCategoryTableProps> = ({
  categories,
  editingCategory,
  onEditCategory,
  onSaveCategory,
  onCancelEdit,
}) => {
  const sortedCategories = [...categories].sort((a, b) => b.percentageUsed - a.percentageUsed);

  if (categories.length === 0) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
            <PieChart className="h-8 w-8 text-fg-muted" aria-hidden />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-fg">No budget categories</h3>
          <p className="text-sm font-light text-fg-muted">
            Set limits for your expense categories to track spending goals.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-muted/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
                  % used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Progress
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface-raised">
              {sortedCategories.map((category) => (
                <tr
                  key={category.id}
                  data-category={category.id}
                  className="transition-colors hover:bg-surface-hover/80"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`mr-3 h-3 w-3 shrink-0 rounded-full ${
                          category.isOverBudget
                            ? 'bg-red-600/80'
                            : category.percentageUsed > 80
                              ? 'bg-amber-600/80'
                              : 'bg-emerald-600/80'
                        }`}
                      />
                      <div className="text-sm font-medium text-fg">{category.name}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {editingCategory === category.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={category.budget}
                          className="w-28 text-sm"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                              const amount = parseFloat((e.target as HTMLInputElement).value);
                              if (!isNaN(amount) && amount >= 0) {
                                onSaveCategory(category.id, amount);
                              }
                            } else if (e.key === 'Escape') {
                              onCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector(
                              `tr[data-category="${category.id}"] input[type="number"]`,
                            ) as HTMLInputElement;
                            const amount = parseFloat(input?.value || category.budget.toString());
                            if (!isNaN(amount) && amount >= 0) {
                              onSaveCategory(category.id, amount);
                            }
                          }}
                          className="p-1.5"
                          title="Save budget"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                        <Button type="button" onClick={onCancelEdit} variant="secondary" className="p-1.5" title="Cancel">
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEditCategory(category.id)}
                        className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
                      >
                        {formatCurrency(category.budget)}
                      </button>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm tabular-nums text-fg">{formatCurrency(category.spent)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div
                      className={`text-sm font-medium tabular-nums ${
                        category.isOverBudget
                          ? 'text-red-600 dark:text-red-300'
                          : category.percentageUsed > 80
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {category.percentageUsed.toFixed(1)}%
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <CategoryProgressBar percentage={category.percentageUsed} isOverBudget={category.isOverBudget} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {editingCategory !== category.id && (
                      <button
                        type="button"
                        onClick={() => onEditCategory(category.id)}
                        className="rounded-[var(--radius-control)] p-1.5 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Edit3 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 p-4 lg:hidden">
        {sortedCategories.map((category) => (
          <div
            key={category.id}
            className="rounded-[var(--radius-card)] border border-border bg-surface-muted/50 p-4 dark:bg-surface-muted/30"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center">
                <div
                  className={`mr-3 h-3 w-3 shrink-0 rounded-full ${
                    category.isOverBudget
                      ? 'bg-red-600/80'
                      : category.percentageUsed > 80
                        ? 'bg-amber-600/80'
                        : 'bg-emerald-600/80'
                  }`}
                />
                <h3 className="truncate text-sm font-medium text-fg">{category.name}</h3>
              </div>
              {editingCategory !== category.id && (
                <button
                  type="button"
                  onClick={() => onEditCategory(category.id)}
                  className="shrink-0 rounded-[var(--radius-control)] p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg"
                  aria-label={`Edit ${category.name}`}
                >
                  <Edit3 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-fg-muted">Budget</span>
                {editingCategory === category.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={category.budget}
                      className="w-24 text-right text-sm"
                      data-category={category.id}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          const amount = parseFloat((e.target as HTMLInputElement).value);
                          if (!isNaN(amount) && amount >= 0) {
                            onSaveCategory(category.id, amount);
                          }
                        } else if (e.key === 'Escape') {
                          onCancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector(`input[data-category="${category.id}"]`) as HTMLInputElement;
                        const amount = parseFloat(input?.value || category.budget.toString());
                        if (!isNaN(amount) && amount >= 0) {
                          onSaveCategory(category.id, amount);
                        }
                      }}
                      className="p-1.5"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button type="button" onClick={onCancelEdit} variant="secondary" className="p-1.5">
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                ) : (
                  <span className="font-medium tabular-nums text-fg">{formatCurrency(category.budget)}</span>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-fg-muted">Spent</span>
                <span className="font-medium tabular-nums text-fg">{formatCurrency(category.spent)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-fg-muted">% used</span>
                <span
                  className={`font-medium tabular-nums ${
                    category.isOverBudget
                      ? 'text-red-600 dark:text-red-300'
                      : category.percentageUsed > 80
                        ? 'text-amber-600 dark:text-amber-300'
                        : 'text-emerald-600 dark:text-emerald-300'
                  }`}
                >
                  {category.percentageUsed.toFixed(1)}%
                </span>
              </div>

              <CategoryProgressBar percentage={category.percentageUsed} isOverBudget={category.isOverBudget} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BudgetCategoryTable;
