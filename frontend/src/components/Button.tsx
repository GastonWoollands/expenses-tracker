/**
 * Minimal button component
 */

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'text-on-accent bg-accent hover:bg-accent-hover active:opacity-90 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-card)] hover:opacity-[0.98] transition-opacity duration-150',
  secondary:
    'text-fg bg-surface-raised border border-border hover:bg-surface-hover focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-card)] transition-colors duration-150',
  ghost:
    'text-fg hover:bg-surface-hover focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-control)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-control)]',
  lg: 'px-5 py-3 text-base rounded-[var(--radius-control)]',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  );
};

export default Button;
