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
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        className={`
          w-full h-11 px-3 rounded-lg border bg-ink-surface text-text-primary
          ${error ? 'border-danger focus:ring-danger/40' : 'border-border-subtle focus:ring-accent-border'}
          focus:outline-none focus:ring-2 focus:border-transparent focus:ring-offset-2 focus:ring-offset-ink
          disabled:bg-ink-elevated disabled:cursor-not-allowed
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
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
};
