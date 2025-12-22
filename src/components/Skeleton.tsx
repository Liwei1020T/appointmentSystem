import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

/**
 * Skeleton loading placeholder component
 * 
 * Displays an animated shimmer effect as a placeholder while content loads.
 * Helps improve perceived performance and provides visual feedback.
 * 
 * @param className - Additional CSS classes
 * @param variant - Shape variant: 'text' (rounded), 'circular' (round), 'rectangular' (square corners)
 * @param width - Custom width (accepts number in px or string with unit)
 * @param height - Custom height (accepts number in px or string with unit)
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
}) => {
    const variantStyles = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`skeleton ${variantStyles[variant]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

/**
 * Pre-built skeleton patterns for common use cases
 */

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className = ''
}) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            />
        ))}
    </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`p-4 bg-ink-surface rounded-xl border border-border-subtle ${className}`}>
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3" />
    </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return <Skeleton variant="circular" className={`${sizes[size]} ${className}`} />;
};

export default Skeleton;
