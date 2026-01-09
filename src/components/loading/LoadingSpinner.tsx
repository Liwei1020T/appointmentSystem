import React from 'react';
import Spinner from '@/components/Spinner';

export type LoadingTone = 'accent' | 'muted' | 'neutral' | 'inverse';

const toneClasses: Record<LoadingTone, string> = {
  accent: 'text-accent',
  muted: 'text-text-tertiary',
  neutral: 'text-text-secondary',
  inverse: 'text-white',
};

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'large' | 'medium' | 'small';
  tone?: LoadingTone;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  tone = 'accent',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <Spinner
      size={size}
      className={`${toneClasses[tone]} ${className}`.trim()}
    />
  );
}

export default LoadingSpinner;
