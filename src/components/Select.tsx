import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

/**
 * Select dropdown component
 * 
 * @param label - Select label text
 * @param error - Error message
 * @param options - Array of option objects
 */
export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        className={`
          w-full h-11 px-3 rounded-lg border 
          ${error ? 'border-red-300' : 'border-slate-300'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          bg-white
          disabled:bg-slate-100 disabled:cursor-not-allowed
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
