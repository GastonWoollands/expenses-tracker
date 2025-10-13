/**
 * Container: centers content with balanced horizontal padding
 */

import React from 'react';

interface ContainerProps {
  className?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Container: React.FC<ContainerProps> = ({ className = '', children, width = 'sm' }) => {
  return (
    <div className={`mx-auto w-full ${widthMap[width]} px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
};

export default Container;


