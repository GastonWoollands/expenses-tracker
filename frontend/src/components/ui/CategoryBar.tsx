/**
 * CategoryBar: Minimalist category breakdown with visual indicators
 */

import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface CategoryBarProps {
  data: CategoryData[];
  className?: string;
  title?: string;
  subtitle?: string;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  data,
  className = '',
  title,
  subtitle
}) => {
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
        {data.map((item) => (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBar;
