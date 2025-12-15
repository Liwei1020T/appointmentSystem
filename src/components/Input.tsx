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
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full h-11 px-3 rounded-lg border 
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            focus:outline-none focus:ring-2 focus:border-transparent
            placeholder:text-slate-400
            disabled:bg-slate-100 disabled:cursor-not-allowed
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-slate-500">{helperText}</p>}
    </div>
  );
};
