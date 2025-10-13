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
        className={`appearance-none relative block w-full px-3 py-2 ${leftIcon ? 'pl-10' : ''} ${rightAdornment ? 'pr-10' : ''} rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
        bg-white text-gray-900 placeholder-gray-500 border border-gray-300 
        dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700 ${className}`}
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


