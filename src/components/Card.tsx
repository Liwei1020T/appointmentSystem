import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  onClick?: () => void;
}

/**
 * Card component for content containers
 * 
 * @param children - Card content
 * @param className - Additional CSS classes
 * @param padding - Card padding size
 * @param shadow - Whether to show shadow
 * @param onClick - Click handler (makes card clickable)
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = true,
  onClick
}) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  const isClickable = !!onClick;

  return (
    <div
      className={`
        bg-ink-surface rounded-xl border border-border-subtle 
        ${shadow ? 'shadow-sm' : ''}
        ${paddings[padding]}
        ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Provide default export for legacy imports
export default Card;
