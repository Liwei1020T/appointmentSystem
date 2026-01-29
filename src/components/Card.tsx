import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  hover?: boolean;
  animate?: boolean;
  variant?: 'default' | 'elevated' | 'gradient-border';
  onClick?: () => void;
}

/**
 * Card component for content containers
 * 
 * @param children - Card content
 * @param className - Additional CSS classes
 * @param padding - Card padding size
 * @param shadow - Whether to show shadow
 * @param hover - Enable hover lift effect
 * @param animate - Enable fade-in animation on mount
 * @param variant - Visual style variant
 * @param onClick - Click handler (makes card clickable)
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = true,
  hover = false,
  animate = false,
  variant = 'default',
  onClick
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };

  const variants = {
    default: 'bg-ink-surface dark:bg-dark-elevated',
    elevated: 'bg-ink-elevated dark:bg-dark-elevated',
    'gradient-border': 'bg-ink-elevated dark:bg-dark-elevated border-gradient',
  };

  const isClickable = !!onClick;

  return (
    <div
      className={`
        ${variants[variant]}
        rounded-2xl
        border border-border-subtle dark:border-gray-700
        ${shadow ? 'shadow-card' : ''}
        ${paddings[padding]}
        ${hover ? 'card-hover' : ''}
        ${animate ? 'animate-slide-up' : ''}
        ${isClickable ? 'cursor-pointer hover:shadow-card-hover transition-shadow' : ''}
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
