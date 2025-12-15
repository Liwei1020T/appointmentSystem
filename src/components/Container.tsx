import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

/**
 * Container component for consistent page width and padding
 * 
 * @param children - Container content
 * @param size - Maximum width size
 * @param className - Additional CSS classes
 */
export const Container: React.FC<ContainerProps> = ({ 
  children, 
  size = 'lg',
  className = ''
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={`mx-auto px-4 sm:px-6 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
};
