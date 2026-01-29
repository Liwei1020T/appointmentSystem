/**
 * Skeleton 骨架屏组件
 *
 * 用于页面加载时的占位显示，提供更好的用户体验
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'shimmer' | 'pulse' | 'none';
}

/**
 * Skeleton loading placeholder component
 *
 * Displays an animated shimmer effect as a placeholder while content loads.
 * Helps improve perceived performance and provides visual feedback.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    rounded: 'rounded-xl',
  };

  const animationStyles = {
    shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer',
    pulse: 'bg-gray-200 dark:bg-gray-700 animate-pulse',
    none: 'bg-gray-200 dark:bg-gray-700',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${animationStyles[animation]} ${variantStyles[variant]} ${className}`}
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
  className = '',
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
  <div className={`p-4 bg-ink-surface dark:bg-dark-elevated rounded-xl border border-border-subtle dark:border-gray-700 ${className}`}>
    <Skeleton className="h-4 w-3/4 mb-3" />
    <Skeleton className="h-3 w-full mb-2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return <Skeleton variant="circular" className={`${sizes[size]} ${className}`} />;
};

// 订单卡片骨架屏
export const SkeletonOrderCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4 ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton variant="rounded" className="h-6 w-16" />
    </div>
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-5 h-5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-5 h-5" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
      <Skeleton className="h-4 w-20" />
      <Skeleton variant="rounded" className="h-8 w-20" />
    </div>
  </div>
);

// 列表项骨架屏
export const SkeletonListItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 p-3 ${className}`}>
    <Skeleton variant="circular" className="w-10 h-10" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-2/5" />
    </div>
    <Skeleton className="h-4 w-16" />
  </div>
);

// 套餐卡片骨架屏
export const SkeletonPackageCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-5 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-28" />
      <Skeleton variant="rounded" className="h-5 w-12" />
    </div>
    <Skeleton className="h-4 w-4/5 mb-4" />
    <div className="flex items-baseline gap-1 mb-4">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton variant="rounded" className="h-10 w-full" />
  </div>
);

// 用户信息骨架屏
export const SkeletonUserInfo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <Skeleton variant="circular" className="w-16 h-16" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="h-4 w-44" />
    </div>
  </div>
);

// 统计卡片骨架屏
export const SkeletonStatsCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4 ${className}`}>
    <div className="flex items-center gap-3 mb-3">
      <Skeleton variant="circular" className="w-10 h-10" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="h-8 w-16 mb-1" />
    <Skeleton className="h-3 w-24" />
  </div>
);

// 评价卡片骨架屏
export const SkeletonReviewCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4 ${className}`}>
    <div className="flex items-center gap-3 mb-3">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="space-y-2 mb-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="flex gap-2">
      <Skeleton variant="rounded" className="w-16 h-16" />
      <Skeleton variant="rounded" className="w-16 h-16" />
    </div>
  </div>
);

// 表格行骨架屏
export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 5,
  className = '',
}) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className={`h-4 ${i === 0 ? 'w-4/5' : 'w-3/5'}`} />
      </td>
    ))}
  </tr>
);

// 表格骨架屏
export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => (
  <div className={`bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// 仪表板骨架屏
export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* 统计卡片 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SkeletonStatsCard />
      <SkeletonStatsCard />
      <SkeletonStatsCard />
      <SkeletonStatsCard />
    </div>
    {/* 图表区域 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <Skeleton className="h-6 w-28 mb-4" />
        <Skeleton variant="rounded" className="h-48 w-full" />
      </div>
      <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <Skeleton className="h-6 w-28 mb-4" />
        <Skeleton variant="rounded" className="h-48 w-full" />
      </div>
    </div>
  </div>
);

// 首页骨架屏
export const SkeletonHomePage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* 欢迎区 */}
    <div className="bg-white/90 dark:bg-dark-elevated/90 border-b border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton variant="circular" className="w-12 h-12" />
      </div>
    </div>
    {/* 快捷操作 */}
    <div className="px-4">
      <Skeleton variant="rounded" className="h-20 w-full mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="rounded" className="h-18" />
        <Skeleton variant="rounded" className="h-18" />
        <Skeleton variant="rounded" className="h-18" />
        <Skeleton variant="rounded" className="h-18" />
      </div>
    </div>
    {/* 订单状态 */}
    <div className="px-4">
      <SkeletonOrderCard />
    </div>
    {/* 权益信息 */}
    <div className="px-4">
      <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Skeleton className="h-6 w-10 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-10 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-10 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 预约页面骨架屏
export const SkeletonBookingPage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 p-4 ${className}`}>
    {/* 步骤指示器 */}
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <Skeleton variant="circular" className="w-8 h-8" />
          {i < 4 && <Skeleton className="h-0.5 w-10" />}
        </React.Fragment>
      ))}
    </div>
    {/* 球线列表 */}
    <div className="space-y-3">
      <Skeleton className="h-5 w-24 mb-2" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" className="w-16 h-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 订单列表骨架屏
export const SkeletonOrderList: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = '',
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonOrderCard key={i} />
    ))}
  </div>
);

// 个人资料页骨架屏
export const SkeletonProfilePage: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* 头像和基本信息 */}
    <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-6 text-center">
      <Skeleton variant="circular" className="w-24 h-24 mx-auto mb-4" />
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-40 mx-auto mb-4" />
      <Skeleton variant="rounded" className="h-6 w-24 mx-auto" />
    </div>
    {/* 统计信息 */}
    <div className="grid grid-cols-3 gap-4">
      <SkeletonStatsCard />
      <SkeletonStatsCard />
      <SkeletonStatsCard />
    </div>
    {/* 菜单列表 */}
    <div className="bg-white dark:bg-dark-elevated rounded-xl border border-gray-100 dark:border-gray-700">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonListItem key={i} className="border-b border-gray-50 dark:border-gray-700 last:border-b-0" />
      ))}
    </div>
  </div>
);

export default Skeleton;
