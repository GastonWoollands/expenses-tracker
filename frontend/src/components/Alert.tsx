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
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
};

const Alert: React.FC<AlertProps> = ({ variant = 'info', children }) => {
  return (
    <div className={`rounded-md p-4 ${styles[variant]}`}>
      <div className="text-sm">{children}</div>
    </div>
  );
};

export default Alert;


