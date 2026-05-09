/**
 * StatCard component for displaying key metrics
 */

import React from 'react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-surface-raised rounded-[var(--radius-card)] border border-border p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-fg-muted mb-1">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-fg">{value}</p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-fg-muted mt-1">{subtitle}</p>
          )}
        </div>
        {icon && <div className="flex-shrink-0 text-fg-muted">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
