/**
 * CategoryBar: Minimalist category breakdown with visual indicators
 * Supports expandable drill-down to show individual expenses per category
 */

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../../utils/formatters';
import type { Expense } from '../../services/api';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface CategoryBarProps {
  data: CategoryData[];
  expenses?: Expense[];
  className?: string;
  title?: string;
  subtitle?: string;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  data,
  expenses,
  className = '',
  subtitle
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    if (!expenses) return;
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getExpensesForCategory = (category: string): Expense[] => {
    if (!expenses) return [];
    return expenses
      .filter(e => e.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  if (data.length === 0) {
    return (
      <div className={className}>
        {subtitle && (
          <p className="text-xs text-fg-muted font-light mb-6">{subtitle}</p>
        )}
        <div className="py-12 text-center">
          <p className="text-fg-muted text-sm font-light">No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {subtitle && (
        <p className="text-xs text-fg-muted font-light mb-6">{subtitle}</p>
      )}
      
      <div className="space-y-4">
        {data.map((item) => {
          const isExpanded = expandedCategory === item.category;
          const categoryExpenses = isExpanded ? getExpensesForCategory(item.category) : [];
          const isClickable = !!expenses;
          
          return (
            <div key={item.category} className="space-y-2">
              <div 
                className={`flex items-center justify-between ${
                  isClickable
                    ? 'cursor-pointer hover:bg-surface-hover -mx-2 px-2 py-1 rounded-[var(--radius-control)] transition-colors'
                    : ''
                }`}
                onClick={() => handleCategoryClick(item.category)}
              >
                <div className="flex items-center space-x-3">
                  {isClickable ? (
                    <ChevronRight
                      className={`h-4 w-4 text-fg-muted transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border-strong" />
                  )}
                  <span className="text-sm font-light text-fg">
                    {item.category}
                  </span>
                  <span className="text-xs text-fg-muted font-light">
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-light text-fg">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-xs text-fg-muted font-light">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-surface-muted rounded-full h-1">
                <div
                  className="bg-accent/50 dark:bg-accent/40 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Expanded expense details */}
              {isExpanded && categoryExpenses.length > 0 && (
                <div className="ml-7 pt-2 pb-1 space-y-1 border-l border-divider pl-3">
                  {categoryExpenses.map(expense => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className="text-fg-muted w-14 flex-shrink-0">
                          {formatDateShort(expense.date)}
                        </span>
                        <span className="text-fg-muted truncate">
                          {expense.description}
                        </span>
                      </div>
                      <span className="text-fg font-light ml-3 flex-shrink-0">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
