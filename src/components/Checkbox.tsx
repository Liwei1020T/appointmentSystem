import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Checkbox component with label
 * 
 * @param label - Checkbox label text
 */
export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  className = '', 
  ...props 
}) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="w-5 h-5 rounded border-border-subtle bg-ink-surface text-accent focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
        {...props}
      />
      <span className="text-sm text-text-secondary">{label}</span>
    </label>
  );
};
