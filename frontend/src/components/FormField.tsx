/**
 * Minimal form field wrapper
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, children }) => {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
};

export default FormField;
