import React from 'react';
import { Skeleton } from '../Skeleton';

export const DashboardSkeleton: React.FC = () => {
  const chartHeights = ['h-24', 'h-28', 'h-32', 'h-20', 'h-36', 'h-28', 'h-24'];

  return (
    <div className="space-y-6 animate-fade-in p-6">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
         <div className="space-y-2">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-64" />
         </div>
         <Skeleton className="h-10 w-32 rounded-lg" />
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[1, 2, 3, 4].map((i) => (
           <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-start mb-4">
               <Skeleton className="h-4 w-20" />
               <Skeleton variant="circular" className="w-10 h-10" />
             </div>
             <Skeleton className="h-9 w-32 mb-2" />
             <Skeleton className="h-4 w-24" />
           </div>
         ))}
       </div>

       {/* Charts Area */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
            <div className="flex justify-between mb-8">
               <Skeleton className="h-6 w-40" />
               <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map(i => (
                 <Skeleton key={i} className="h-8 w-full rounded" />
               ))}
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
            <div className="flex justify-between mb-8">
               <Skeleton className="h-6 w-40" />
               <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-end justify-between h-64 gap-2">
               {chartHeights.map((heightClass, index) => (
                 <Skeleton key={index} className={`w-full rounded-t-lg ${heightClass}`} />
               ))}
            </div>
         </div>
       </div>
    </div>
  );
};
