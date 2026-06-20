import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, PawPrint, Loader2, X } from 'lucide-react';
import { useDogs } from '@/hooks/useDogs';
import { DogCard } from '@/components/DogCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { EventType } from '@/types';

type FilterType = EventType | 'all' | 'critical';

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All Dogs', value: 'all' },
  { label: 'In Care', value: 'catch' },
  { label: 'Released', value: 'release' },
  { label: 'Critical', value: 'critical' },
];

const DogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, error } = useDogs(page);

  const stats = useMemo(() => {
    if (!data?.data) return { all: 0, catch: 0, release: 0, critical: 0 };
    return data.data.reduce(
      (acc, dog) => {
        acc.all++;
        if (['catch', 'vaccinate', 'sterilize', 'recover'].includes(dog.current_status)) {
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
      if (activeFilter === 'critical') return matchesSearch && (dog.condition as string) === 'critical';
      if (activeFilter === 'catch') {
          return matchesSearch && ['catch', 'vaccinate', 'sterilize', 'recover'].includes(dog.current_status);
      }
      return matchesSearch && dog.current_status === activeFilter;
    });
  }, [data?.data, searchQuery, activeFilter]);

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center bg-white">
        <div className="rounded-full bg-red-50 p-8 text-red-500 mb-6">
          <PawPrint size={64} strokeWidth={1} />
        </div>
        <h3 className="text-2xl font-extrabold text-dark tracking-tight">Sync Failed</h3>
        <p className="mt-2 text-muted font-medium">We couldn't retrieve the dog registry. Please check your network.</p>
        <Button onClick={() => window.location.reload()} className="mt-8 h-[56px] w-full max-w-xs rounded-[18px] bg-dark">
          Retry Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Immersive Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#F9FAFB]/80 backdrop-blur-xl border-b border-gray-100 pt-6 pb-4">
        <div className="px-5 mb-5 flex items-center justify-between">
           <h1 className="text-[28px] font-extrabold text-dark tracking-tight leading-none">Registry</h1>
           <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-[12px] font-bold text-muted">
                {stats.all} Records
              </span>
           </div>
        </div>

        <div className="px-5 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" size={20} />
            <Input
              type="text"
              placeholder="Search by ID or location..."
              className="h-[52px] rounded-[18px] border-none bg-gray-100/80 pl-12 text-[16px] font-medium focus-visible:ring-primary/20 shadow-none transition-all placeholder:text-muted/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-muted"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-5 px-5">
            {FILTER_OPTIONS.map((option) => {
              const count = stats[option.value as keyof typeof stats] || 0;
              const isActive = activeFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setActiveFilter(option.value)}
                  className={cn(
                    'flex h-[38px] shrink-0 items-center rounded-full px-5 text-[13px] font-bold transition-all duration-300',
                    isActive
                      ? 'bg-primary text-white shadow-teal-glow translate-y-[-2px]'
                      : 'bg-white border border-gray-200 text-muted hover:border-muted/30'
                  )}
                >
                  {option.label}
                  {count > 0 && <span className={cn("ml-2 opacity-50", isActive && "opacity-100")}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Registry Grid */}
      <div className="px-5 pt-6 pb-[160px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[280px] w-full rounded-[24px]" />
            ))}
          </div>
        ) : filteredDogs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-5"
          >
            {filteredDogs.map((dog) => (
              <DogCard key={dog.dog_id} dog={dog} />
            ))}

            {data && data.count > (page + 1) * 20 && (
              <div className="mt-8 flex justify-center pb-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={isFetching}
                  className="h-[56px] w-full rounded-[18px] border-gray-200 text-dark font-bold text-[15px]"
                >
                  {isFetching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Load More Records'}
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 h-24 w-24 flex items-center justify-center rounded-full bg-gray-50 text-gray-200">
              <PawPrint size={48} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-extrabold text-dark tracking-tight">No Matches Found</h3>
            <p className="mt-1 text-muted font-medium px-8">
              {searchQuery ? "Try refining your search terms." : "The registry is currently empty."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/catch')}
                className="mt-8 h-[56px] px-8 rounded-[18px] bg-primary text-white font-extrabold shadow-teal-glow"
              >
                Register First Dog
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-[100px] right-5 z-50 pointer-events-none">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/catch')}
          className="pointer-events-auto flex h-[64px] w-[64px] items-center justify-center rounded-[22px] bg-primary text-white shadow-floating border border-white/20"
        >
          <Camera size={30} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};

export default DogsPage;
