/**
 * Label: accessible label with subtle tone
 */

import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label: React.FC<LabelProps> = ({ className = '', children, ...props }) => {
  return (
    <label className={`block text-sm text-gray-700 dark:text-gray-300 ${className}`} {...props}>
      {children}
    </label>
  );
};

export default Label;


