/**
 * Minimal alert component
 */

import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
}

const styles: Record<AlertVariant, string> = {
  info:
    'bg-accent-soft text-accent border border-accent-soft-border dark:border-accent/40 dark:bg-accent/10 dark:text-accent-hover',
  success: 'bg-green-50 text-green-800 border border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 text-yellow-800 border border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 text-red-800 border border-red-100 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
};

const Alert: React.FC<AlertProps> = ({ variant = 'info', children }) => {
  return (
    <div className={`rounded-[var(--radius-control)] p-4 ${styles[variant]}`}>
      <div className="text-sm">{children}</div>
    </div>
  );
};

export default Alert;
