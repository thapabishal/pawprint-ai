import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, PawPrint, Loader2 } from 'lucide-react';
import { useDogs } from '@/hooks/useDogs';
import { DogCard } from '@/components/DogCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { EventType } from '@/types';

const FILTER_OPTIONS: { label: string; value: EventType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Clinic', value: 'catch' }, // Simplified: caught dogs usually in clinic
  { label: 'Released', value: 'release' },
  { label: 'Critical', value: 'critical' },
];

const DogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, error } = useDogs(page);

  const stats = useMemo(() => {
    if (!data?.data) return { all: 0, catch: 0, release: 0, critical: 0 };
    return data.data.reduce(
      (acc, dog) => {
        acc.all++;
        if (dog.current_status === 'catch' || dog.current_status === 'vaccinate' || dog.current_status === 'sterilize' || dog.current_status === 'recover') {
          acc.catch++;
        } else if (dog.current_status === 'release') {
          acc.release++;
        }
        if (dog.condition === 'critical') acc.critical++;
        return acc;
      },
      { all: 0, catch: 0, release: 0, critical: 0 }
    );
  }, [data?.data]);

  const filteredDogs = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((dog) => {
      const matchesSearch =
        dog.dog_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dog.last_notes?.toLowerCase().includes(searchQuery.toLowerCase()) || '');

      if (activeFilter === 'all') return matchesSearch;
      if (activeFilter === 'critical') return matchesSearch && dog.condition === 'critical';
      if (activeFilter === 'catch') {
          return matchesSearch && ['catch', 'vaccinate', 'sterilize', 'recover'].includes(dog.current_status);
      }
      return matchesSearch && dog.current_status === activeFilter;
    });
  }, [data?.data, searchQuery, activeFilter]);

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

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-40 bg-surface/80 px-4 pt-4 pb-2 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <Input
            type="text"
            placeholder="Search by ID or notes..."
            className="h-11 rounded-full border-none bg-gray-100 pl-10 text-base focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTER_OPTIONS.map((option) => {
            const count = stats[option.value as keyof typeof stats] || 0;
            const isActive = activeFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={cn(
                  'flex h-[34px] shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                )}
              >
                {option.label} <span className={cn("ml-1.5 opacity-60", isActive && "text-white/80")}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-[16px]" />
            ))}
          </div>
        ) : filteredDogs.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredDogs.map((dog) => (
                <DogCard key={dog.dog_id} dog={dog} />
              ))}
            </div>

            {data && data.count > (page + 1) * 20 && (
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
            <div className="mb-4 rounded-full bg-gray-100 p-6 text-gray-300">
              <PawPrint size={64} strokeWidth={1} />
            </div>
            <h3 className="text-lg font-bold text-dark">No dogs found</h3>
            <p className="mt-1 text-sm text-muted">
              {searchQuery ? "Try a different search term" : "Register your first dog to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/catch')}
                className="mt-6 bg-primary"
              >
                Register First Dog
              </Button>
            )}
          </div>
        )}
      </div>

      {/* FAB - Not shown on /catch or /identify */}
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
