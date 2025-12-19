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
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-danger/15 text-danger',
    info: 'bg-info-soft text-info',
    neutral: 'bg-ink-elevated text-text-secondary border border-border-subtle',
    blue: 'bg-info-soft text-info'
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
