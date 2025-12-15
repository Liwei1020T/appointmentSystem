import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'large' | 'medium' | 'small';
  className?: string;
}

/**
 * Loading spinner component
 * 
 * @param size - Spinner size
 * @param className - Additional CSS classes
 */
export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    medium: 'w-6 h-6',
    lg: 'w-8 h-8',
    large: 'w-8 h-8',
    small: 'w-4 h-4'
  };
  
  return (
    <div 
      className={`
        ${sizes[size]} 
        border-2 border-current border-t-transparent 
        rounded-full animate-spin
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Provide default export for legacy imports
export default Spinner;
