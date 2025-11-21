/**
 * Minimal card component
 */

import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 shadow-sm dark:shadow-xl rounded-lg border border-gray-200 dark:border-slate-700 transition-all duration-200 ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-slate-700">
          {title && (
            <h3 className="text-lg leading-6 font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;


