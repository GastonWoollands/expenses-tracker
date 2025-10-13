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
    'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
  ghost:
    'text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-200 dark:hover:bg-gray-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-5 py-3 text-base rounded-lg',
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


