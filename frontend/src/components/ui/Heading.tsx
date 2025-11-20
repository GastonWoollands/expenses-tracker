/**
 * Heading: typographic hierarchy with minimalist defaults
 */

import React from 'react';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingProps {
  level?: Level;
  className?: string;
  children: React.ReactNode;
}

const sizeMap: Record<Level, string> = {
  1: 'text-3xl sm:text-4xl',
  2: 'text-2xl sm:text-3xl',
  3: 'text-xl sm:text-2xl',
  4: 'text-lg sm:text-xl',
  5: 'text-base sm:text-lg',
  6: 'text-sm sm:text-base',
};

const Heading: React.FC<HeadingProps> = ({ level = 2, className = '', children }) => {
  const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
  return (
    <Tag className={`font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${sizeMap[level]} ${className}`}>
      {children}
    </Tag>
  );
};

export default Heading;


