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
      <input
        className={`appearance-none relative block w-full px-3 py-2 ${leftIcon ? 'pl-10' : ''} ${rightAdornment ? 'pr-10' : ''} rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-transparent 
        bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 border border-slate-300 dark:border-slate-600 
        hover:border-slate-400 dark:hover:border-slate-500 transition-colors duration-200 ${className}`}
        {...props}
      />
      {rightAdornment && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
          {rightAdornment}
        </div>
      )}
    </div>
  );
};

export default Input;


