import React from 'react';
import { Skeleton } from '../Skeleton';

export const OrderListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter Bar Skeleton */}
      <div className="bg-ink-surface rounded-xl p-1.5 shadow-sm border border-border-subtle flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>

      {/* Order Cards Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i}
          className="bg-ink-surface rounded-xl border border-border-subtle shadow-sm p-5"
        >
          {/* Top Row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};
