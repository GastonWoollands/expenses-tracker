/**
 * ResponsiveContainer: Mobile-first container with proper spacing
 */

import React from 'react';
import type { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-full'
};

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className = '', 
  maxWidth = 'xl' 
}) => {
  return (
    <div className={`mx-auto w-full ${maxWidthMap[maxWidth]} px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;
