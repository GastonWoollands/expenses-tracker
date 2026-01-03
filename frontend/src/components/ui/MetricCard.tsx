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
    <div className={`${className}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-normal text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </h3>
          {trend && (
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${
              trend.isFirstMonth
                ? 'text-blue-600 dark:text-blue-400'
                : trend.isPositive 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
            }`}>
              <span className="mr-1 text-xs">
                {trend.isFirstMonth ? '🆕' : trend.isPositive ? '↗' : '↘'}
              </span>
              {trend.isFirstMonth ? 'First Month' : `${Math.abs(trend.value).toFixed(1)}%`}
            </span>
          )}
        </div>
        
        <div>
          <div className="text-3xl font-light text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-light">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
