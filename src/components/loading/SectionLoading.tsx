import React from 'react';
import LoadingSpinner, { type LoadingTone } from './LoadingSpinner';

export interface SectionLoadingProps {
  label?: string;
  tone?: LoadingTone;
  className?: string;
  minHeightClassName?: string;
}

export function SectionLoading({
  label = '加载中...',
  tone = 'muted',
  className = '',
  minHeightClassName = 'min-h-[160px]',
}: SectionLoadingProps) {
  return (
    <div
      className={`flex items-center justify-center ${minHeightClassName} ${className}`
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <div className="flex items-center gap-3">
        <LoadingSpinner size="md" tone={tone} />
        {label ? (
          <span className="text-sm text-text-secondary">{label}</span>
        ) : null}
      </div>
    </div>
  );
}

export default SectionLoading;
