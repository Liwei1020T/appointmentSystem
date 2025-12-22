import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  glow?: boolean;
}

/**
 * Button component following UI Design Guide
 * 
 * @param variant - Button style variant
 * @param size - Button size
 * @param fullWidth - Whether button should take full width
 * @param loading - Show loading spinner
 * @param icon - Optional icon element
 * @param glow - Enable glow effect (primarily for primary buttons)
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  glow = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `
    font-semibold rounded-lg transition-all duration-200 
    active:scale-98 btn-press
    flex items-center justify-center gap-2 
    focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-accent-border focus-visible:ring-offset-2 
    focus-visible:ring-offset-ink
  `.trim();

  const variants = {
    primary: `
      bg-accent text-text-onAccent 
      hover:shadow-glow hover:brightness-105
      ${glow ? 'shadow-glow' : 'shadow-sm'}
    `.trim(),
    secondary: `
      bg-ink-surface text-accent 
      border border-accent-border 
      hover:bg-accent-soft hover:shadow-sm
    `.trim(),
    ghost: `
      bg-transparent text-text-primary 
      hover:bg-ink-surface/80
    `.trim(),
    danger: `
      bg-danger text-white 
      hover:bg-danger/90 hover:shadow-sm
    `.trim()
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-6 text-base'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && icon}
      {children}
    </button>
  );
};

// Provide default export for legacy imports
export default Button;

