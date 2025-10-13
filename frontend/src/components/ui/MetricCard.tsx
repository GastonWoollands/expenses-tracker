/**
 * MetricCard: Clean, minimalist metric display
 */

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    isFirstMonth?: boolean;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  className = ''
}) => {
  console.log('MetricCard received trend:', trend);
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">
            {title}
          </h3>
          {trend && (
            <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg border-2 shadow-sm ${
              trend.isFirstMonth
                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-600'
                : trend.isPositive 
                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-600' 
                  : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-600'
            }`}>
              <span className="mr-1 text-sm">
                {trend.isFirstMonth ? '🆕' : trend.isPositive ? '↗' : '↘'}
              </span>
              {trend.isFirstMonth ? 'First Month' : `${Math.abs(trend.value).toFixed(1)}%`}
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
