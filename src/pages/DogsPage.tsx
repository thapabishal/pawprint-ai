import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, PawPrint, Loader2, ArrowUpDown, Check } from 'lucide-react';
import { useDogs } from '@/hooks/useDogs';
import { DogCard } from '@/components/DogCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { ProgrammeFilter, StatusFilter, SortOption } from '@/types';

const PROGRAMME_OPTIONS: { label: string; value: ProgrammeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '🔬 CNVR', value: 'cnvr' },
  { label: '💉 Vaccination', value: 'vaccination' },
];

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Clinic', value: 'clinic' },
  { label: 'Released', value: 'released' },
  { label: 'Critical', value: 'critical' },
  { label: 'Overdue Booster', value: 'overdue' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Boosters due soonest', value: 'boosters' },
  { label: 'Most recent activity', value: 'activity' },
];

const DogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProgramme, setActiveProgramme] = useState<ProgrammeFilter>('all');
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState(0);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const { data, isLoading, isFetching, error } = useDogs(
    page,
    20,
    { programme: activeProgramme, status: activeStatus, search: searchQuery },
    sortBy
  );

  const handleProgrammeChange = (val: ProgrammeFilter) => {
    setActiveProgramme(val);
    setPage(0);
  };

  const handleStatusChange = (val: StatusFilter) => {
    setActiveStatus(val);
    setPage(0);
  };

  const handleSortChange = (val: SortOption) => {
    setSortBy(val);
    setPage(0);
    setIsSortOpen(false);
  };

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <PawPrint size={48} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-dark">Failed to load dogs</h3>
        <p className="mt-2 text-sm text-muted">Please check your connection and try again.</p>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-primary">
          Retry
        </Button>
      </div>
    );
  }

  const getEmptyState = () => {
    if (activeProgramme === 'cnvr') return "No CNVR dogs registered yet";
    if (activeProgramme === 'vaccination') return "No vaccination records yet. Start a vaccination camp →";
    if (activeStatus === 'overdue') return "All vaccinations up to date ✓";
    return "No dogs found";
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky Header with Search and Sort */}
      <div className="sticky top-0 z-40 bg-surface/80 px-4 pt-4 pb-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <Input
              type="text"
              placeholder="Search by ID or notes..."
              className="h-11 rounded-full border-none bg-gray-100 pl-10 text-base focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
              }}
            />
          </div>

          <Sheet open={isSortOpen} onOpenChange={setIsSortOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-11 rounded-full bg-gray-100 px-4 text-slate-600">
                <ArrowUpDown size={18} className="mr-2" />
                Sort
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[24px] pb-10">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left">Sort Options</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors",
                      sortBy === option.value ? "bg-primary/10 text-primary" : "active:bg-gray-50"
                    )}
                  >
                    {option.label}
                    {sortBy === option.value && <Check size={18} />}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Row 1: Programme */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {PROGRAMME_OPTIONS.map((option) => {
              const isActive = activeProgramme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleProgrammeChange(option.value)}
                  className={cn(
                    'flex h-[38px] shrink-0 items-center rounded-full px-5 text-sm font-bold transition-all border',
                    isActive
                      ? option.value === 'cnvr'
                        ? 'bg-primary border-primary text-white shadow-md'
                        : option.value === 'vaccination'
                          ? 'bg-accent border-accent text-white shadow-md'
                          : 'bg-dark border-dark text-white shadow-md'
                      : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: Status */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {STATUS_OPTIONS.map((option) => {
              const isActive = activeStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={cn(
                    'flex h-[32px] shrink-0 items-center rounded-full px-4 text-xs font-semibold transition-all',
                    isActive
                      ? option.value === 'overdue'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-slate-800 text-white shadow-sm'
                      : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="px-4 pb-24 pt-2">
        {isLoading && page === 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-[16px]" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {data.data.map((dog) => (
                <DogCard key={dog.dog_id} dog={dog} />
              ))}
            </div>

            {data.count > (page + 1) * 20 && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={isFetching}
                  className="rounded-full px-8"
                >
                  {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Load More'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={cn(
                "mb-4 rounded-full p-6",
                activeStatus === 'overdue' && data?.count === 0 ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-300"
            )}>
              {activeStatus === 'overdue' && data?.count === 0 ? (
                  <Check size={64} strokeWidth={1.5} />
              ) : (
                  <PawPrint size={64} strokeWidth={1} />
              )}
            </div>
            <h3 className={cn(
                "text-lg font-bold",
                activeStatus === 'overdue' && data?.count === 0 ? "text-green-700" : "text-dark"
            )}>
                {getEmptyState()}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {searchQuery ? "Try a different search term" : activeStatus === 'overdue' ? "" : "Register your first dog to get started"}
            </p>
            {!searchQuery && activeStatus !== 'overdue' && (
              <Button
                onClick={() => navigate('/catch')}
                className="mt-6 bg-primary"
              >
                {activeProgramme === 'vaccination' ? 'Start Vaccination Camp' : 'Register First Dog'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* FAB - Always shown on Dogs list */}
      <button
        onClick={() => navigate('/catch')}
        className="fixed bottom-[80px] right-5 z-50 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_25px_rgba(13,115,119,0.4)] transition-transform active:scale-90"
      >
        <Camera size={28} />
      </button>
    </div>
  );
};

export default DogsPage;
