/**
 * Minimal input component
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ leftIcon, rightAdornment, className = '', ...props }) => {
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-fg-muted">
          {leftIcon}
        </div>
      )}
      <input
        className={`appearance-none relative block w-full px-3 py-2 ${leftIcon ? 'pl-10' : ''} ${rightAdornment ? 'pr-10' : ''} rounded-[var(--radius-control)] sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-surface
        bg-input text-fg placeholder:text-fg-muted/80 border border-border-strong
        hover:border-border transition-colors duration-150 ${className}`}
        {...props}
      />
      {rightAdornment && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-fg-muted">{rightAdornment}</div>
      )}
    </div>
  );
};

export default Input;
