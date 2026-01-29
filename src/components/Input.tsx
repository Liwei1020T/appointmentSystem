import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input component with label, error states, and icon support
 * 
 * @param label - Input label text
 * @param error - Error message to display
 * @param helperText - Helper text below input
 * @param leftIcon - Icon on the left side
 * @param rightIcon - Icon on the right side
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full h-11 px-3 rounded-xl border bg-white text-text-primary
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
            ${error ? 'border-danger focus:ring-danger/30 dark:border-danger' : 'border-border-subtle focus:ring-accent/30 dark:focus:border-accent dark:focus:ring-accent/20'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            focus:outline-none focus:ring-2 focus:border-transparent focus:ring-offset-2 focus:ring-offset-ink
            placeholder:text-text-tertiary dark:placeholder-gray-500
            disabled:bg-ink disabled:cursor-not-allowed dark:disabled:bg-gray-900
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger dark:text-red-400">{error}</p>}
      {helperText && !error && <p className="text-sm text-text-tertiary dark:text-gray-400">{helperText}</p>}
    </div>
  );
};
