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
    <div
      className={`bg-surface-raised shadow-[var(--shadow-card)] rounded-[var(--radius-card)] border border-border transition-colors duration-150 ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-4 py-5 sm:px-6 border-b border-border">
          {title && <h3 className="text-lg leading-6 font-semibold text-fg">{title}</h3>}
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-fg-muted">{subtitle}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
};

export default Card;
