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
    <div className={`bg-white dark:bg-gray-900 shadow rounded-md border border-gray-100/10 ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 py-5 sm:px-6">
          {title && (
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtitle}</p>
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


