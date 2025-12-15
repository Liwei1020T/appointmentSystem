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
        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        {...props}
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
};
