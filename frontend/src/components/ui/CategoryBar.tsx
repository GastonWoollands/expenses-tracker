/**
 * CategoryBar: Minimalist category breakdown with visual indicators
 */

import React from 'react';

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
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        )}
        <div className="px-6 py-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No category data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map((item) => (
          <div key={item.category} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.category}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  ${item.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
              <div 
                className="bg-gray-400 dark:bg-gray-600 h-1.5 rounded-full transition-all duration-300"
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
