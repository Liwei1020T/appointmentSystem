import React from 'react';
import LoadingSpinner, { type LoadingTone } from './LoadingSpinner';

type LoadingSurface = 'light' | 'dark' | 'transparent';

const surfaceClasses: Record<LoadingSurface, string> = {
  light: 'bg-ink',
  dark: 'bg-ink',
  transparent: 'bg-transparent',
};

export interface PageLoadingProps {
  label?: string;
  tone?: LoadingTone;
  surface?: LoadingSurface;
  className?: string;
}

export function PageLoading({
  label = '加载中...',
  tone = 'accent',
  surface = 'light',
  className = '',
}: PageLoadingProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center ${surfaceClasses[surface]} ${className}`
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" tone={tone} />
        {label ? (
          <p className="text-sm text-text-tertiary">{label}</p>
        ) : null}
      </div>
    </div>
  );
}

export default PageLoading;
