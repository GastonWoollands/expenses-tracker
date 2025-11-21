/**
 * CategoryProgressBar: Visual progress indicator for budget categories
 */

import React from 'react';

interface CategoryProgressBarProps {
  percentage: number;
  isOverBudget: boolean;
  className?: string;
}

const CategoryProgressBar: React.FC<CategoryProgressBarProps> = ({
  percentage,
  isOverBudget,
  className = ''
}) => {
  // Cap percentage at 150% for visual purposes
  const displayPercentage = Math.min(percentage, 150);

  const getBarColor = () => {
    if (isOverBudget) {
      return 'bg-red-500';
    } else if (percentage > 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  const getBackgroundColor = () => {
    if (isOverBudget) {
      return 'bg-red-100 dark:bg-red-900/20';
    } else if (percentage > 80) {
      return 'bg-yellow-100 dark:bg-yellow-900/20';
    } else {
      return 'bg-green-100 dark:bg-green-900/20';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative h-2 rounded-full overflow-hidden ${getBackgroundColor()}`}>
        <div
          className={`h-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${displayPercentage}%` }}
        />
        
        {/* Over-budget indicator */}
        {isOverBudget && (
          <div className="absolute inset-0 bg-red-200 dark:bg-red-800 opacity-30" />
        )}
        
        {/* 100% marker */}
        {percentage > 100 && (
          <div className="absolute top-0 left-full w-0.5 h-full bg-gray-400 dark:bg-gray-600" />
        )}
      </div>
      
      {/* Percentage text */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
        {percentage > 100 && (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {percentage.toFixed(0)}% used
          </span>
        )}
      </div>
    </div>
  );
};

export default CategoryProgressBar;
