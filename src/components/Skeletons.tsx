import React from 'react';
import { Skeleton } from './ui/skeleton';

export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#F9FAFB] px-6 pt-10 animate-pulse">
    <div className="space-y-3 mb-10">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-4 w-48 rounded-lg" />
    </div>

    <div className="grid grid-cols-2 gap-4 mb-8">
      <Skeleton className="h-32 rounded-[24px]" />
      <Skeleton className="h-32 rounded-[24px]" />
    </div>

    <Skeleton className="h-[180px] w-full rounded-[32px] mb-10" />

    <div className="space-y-4">
      <Skeleton className="h-6 w-40 rounded-lg" />
      <Skeleton className="h-[200px] w-full rounded-[28px]" />
    </div>
  </div>
);

export const DogsListSkeleton: React.FC = () => (
  <div className="px-5 pt-8 animate-pulse">
    <div className="flex justify-between items-center mb-8">
       <Skeleton className="h-10 w-32 rounded-xl" />
       <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-14 w-full rounded-[18px] mb-10" />
    <div className="grid grid-cols-1 gap-5">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[280px] w-full rounded-[24px]" />
      ))}
    </div>
  </div>
);

export const DogProfileSkeleton: React.FC = () => (
  <div className="animate-pulse bg-white min-h-screen">
    <div className="h-[40dvh] bg-gray-100" />
    <div className="px-5 -mt-6">
       <Skeleton className="h-16 w-full rounded-[24px] mb-4" />
       <div className="grid grid-cols-3 gap-3 mb-6">
         <Skeleton className="h-24 rounded-[20px]" />
         <Skeleton className="h-24 rounded-[20px]" />
         <Skeleton className="h-24 rounded-[20px]" />
       </div>
       <Skeleton className="h-48 w-full rounded-[28px]" />
    </div>
  </div>
);
