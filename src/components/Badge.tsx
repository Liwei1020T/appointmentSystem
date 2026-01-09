import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'blue';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge component for status indicators and labels
 * 
 * @param variant - Badge color variant
 * @param size - Badge size
 * @param children - Badge content
 */
export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'neutral', 
  size = 'md',
  children,
  className = ''
}) => {
  const variants = {
    success: 'bg-success/12 text-success border border-success/20',
    warning: 'bg-warning/12 text-warning border border-warning/20',
    error: 'bg-danger/12 text-danger border border-danger/20',
    info: 'bg-info/10 text-info border border-info/20',
    neutral: 'bg-ink text-text-secondary border border-border-subtle',
    blue: 'bg-info/10 text-info border border-info/20'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  return (
    <span 
      className={`
        inline-flex items-center rounded-md font-medium 
        ${variants[variant]} 
        ${sizes[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </span>
  );
};
