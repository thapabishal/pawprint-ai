import React from 'react';

export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-surface p-4 pt-safe animate-pulse">
    <div className="mb-6 h-8 w-48 rounded-lg bg-gray-200" />

    <div className="grid grid-cols-2 gap-3 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-[16px] bg-gray-200" />
      ))}
    </div>

    <div className="mb-8">
      <div className="h-6 w-32 rounded-lg bg-gray-200 mb-4" />
      <div className="h-32 rounded-[16px] bg-gray-200" />
    </div>

    <div className="space-y-4">
      <div className="h-6 w-40 rounded-lg bg-gray-200" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-[16px] bg-gray-200" />
      ))}
    </div>
  </div>
);

export const DogsListSkeleton: React.FC = () => (
  <div className="p-4 pt-safe animate-pulse">
    <div className="mb-6 h-8 w-32 rounded-lg bg-gray-200" />
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square w-full rounded-[16px] bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  </div>
);

export const DogProfileSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-[260px] w-full bg-gray-200" />
    <div className="px-4">
      <div className="-mt-7 h-[200px] rounded-[16px] bg-white border shadow-sm p-4 space-y-4">
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-gray-200" />
          <div className="h-6 w-20 rounded-full bg-gray-200" />
        </div>
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  </div>
);

export const BoosterRemindersSkeleton: React.FC = () => (
  <div className="min-h-screen bg-surface p-4 pt-safe animate-pulse">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
      </div>
      <div className="h-10 w-10 rounded-full bg-gray-200" />
    </div>

    <div className="h-12 w-full rounded-xl bg-gray-200 mb-8" />

    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-44 rounded-[14px] bg-white border border-gray-100 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-5 w-20 rounded bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
          </div>
          <div className="pt-3 border-t border-gray-50 flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-gray-200" />
            <div className="h-9 flex-1 rounded-lg bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
