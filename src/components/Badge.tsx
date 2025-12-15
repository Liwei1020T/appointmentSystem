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
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-700',
    neutral: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700'
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
