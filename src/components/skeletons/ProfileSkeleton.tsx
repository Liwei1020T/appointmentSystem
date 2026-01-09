import React from 'react';
import { Skeleton } from '../Skeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-ink pb-24 animate-fade-in">
      {/* Header Skeleton - Using gradient classes to match real profile but lighter */}
      <div className="bg-gradient-to-br from-accent/15 via-emerald-50 to-white pt-8 pb-12 relative border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="w-20 h-20 shadow-md ring-4 ring-white/50" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4 relative z-10">
        
        {/* Membership Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-border-subtle p-5 space-y-4">
           {/* Header Row */}
           <div className="flex justify-between items-center">
             <div className="flex gap-3 items-center">
               <Skeleton variant="rectangular" className="w-12 h-12 rounded-xl" />
               <div className="space-y-2">
                 <Skeleton className="h-3 w-16" />
                 <Skeleton className="h-6 w-32" />
               </div>
             </div>
             <div className="space-y-2 flex flex-col items-end">
               <Skeleton className="h-3 w-16" />
               <Skeleton className="h-8 w-24" />
             </div>
           </div>
           
           {/* Points Row */}
           <Skeleton className="h-14 w-full rounded-xl" />
           
           {/* Progress Bar */}
           <div className="space-y-2 pt-2">
             <div className="flex justify-between">
               <Skeleton className="h-4 w-20" />
               <Skeleton className="h-5 w-24" />
             </div>
             <Skeleton className="h-2.5 w-full rounded-full" />
             <Skeleton className="h-3 w-1/2" />
           </div>
        </div>

        {/* Quick Access Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle p-4">
          <div className="grid grid-cols-3 gap-3">
             <div className="flex flex-col items-center gap-2">
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-8" />
             </div>
             <div className="flex flex-col items-center gap-2">
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-8" />
             </div>
             <div className="flex flex-col items-center gap-2">
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-8" />
             </div>
          </div>
        </div>

        {/* Menu Items Group 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden p-4 space-y-4">
           <Skeleton className="h-5 w-24 mb-2" />
           <div className="space-y-4">
             <div className="flex justify-between items-center">
               <div className="flex gap-3 items-center w-full">
                 <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
                 <div className="space-y-1 flex-1">
                   <Skeleton className="h-5 w-24" />
                   <Skeleton className="h-3 w-32" />
                 </div>
               </div>
               <Skeleton className="w-5 h-5 rounded-full" />
             </div>
             <div className="flex justify-between items-center">
               <div className="flex gap-3 items-center w-full">
                 <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
                 <div className="space-y-1 flex-1">
                   <Skeleton className="h-5 w-24" />
                   <Skeleton className="h-3 w-32" />
                 </div>
               </div>
               <Skeleton className="w-5 h-5 rounded-full" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
