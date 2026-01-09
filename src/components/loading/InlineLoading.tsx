import React from 'react';
import LoadingSpinner, { type LoadingTone } from './LoadingSpinner';

export interface InlineLoadingProps {
  label?: string;
  tone?: LoadingTone;
  size?: 'sm' | 'md' | 'lg' | 'large' | 'medium' | 'small';
  className?: string;
}

export function InlineLoading({
  label = '加载中...',
  tone = 'muted',
  size = 'sm',
  className = '',
}: InlineLoadingProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <LoadingSpinner size={size} tone={tone} />
      {label ? (
        <span className="text-xs text-text-secondary">{label}</span>
      ) : null}
    </span>
  );
}

export default InlineLoading;
