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
          <p className="text-xs text-slate-400 dark:text-slate-500 font-light mb-6">{subtitle}</p>
        )}
        <div className="py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-light">No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-500 font-light mb-6">{subtitle}</p>
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
                    ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-1 rounded transition-colors' 
                    : ''
                }`}
                onClick={() => handleCategoryClick(item.category)}
              >
                <div className="flex items-center space-x-3">
                  {isClickable ? (
                    <ChevronRight 
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  )}
                  <span className="text-sm font-light text-slate-900 dark:text-slate-100">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-light">
                    {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-light text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-light">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                <div 
                  className="bg-slate-400 dark:bg-slate-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Expanded expense details */}
              {isExpanded && categoryExpenses.length > 0 && (
                <div className="ml-7 pt-2 pb-1 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                  {categoryExpenses.map(expense => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className="text-slate-400 dark:text-slate-500 w-14 flex-shrink-0">
                          {formatDateShort(expense.date)}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 truncate">
                          {expense.description}
                        </span>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-light ml-3 flex-shrink-0">
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
