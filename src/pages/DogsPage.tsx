import React, { useState, useMemo } from 'react';
import { useDogs } from '@/hooks/useDogs';
import { DogCard } from '@/components/dog/DogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, Camera, PawPrint, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { DogCurrentStatus } from '@/types';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'clinic', label: 'In Clinic' },
  { id: 'release', label: 'Released' },
  { id: 'critical', label: 'Critical' },
];

const DogsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const location = useLocation();

  const { data, isLoading, isFetching } = useDogs(page);

  const filteredDogs = useMemo(() => {
    const dogs = data?.dogs;
    if (!dogs) return [];

    return dogs.filter((dog: DogCurrentStatus) => {
      // Search filter
      const matchesSearch = dog.dog_id.toLowerCase().includes(search.toLowerCase()) ||
                            (dog.catch_notes || '').toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (filter === 'all') return true;
      if (filter === 'clinic') return dog.current_status !== 'release';
      if (filter === 'release') return dog.current_status === 'release';
      if (filter === 'critical') return dog.condition === 'critical';

      return true;
    });
  }, [data?.dogs, search, filter]);

  const counts = useMemo(() => {
    const dogs = data?.dogs;
    const defaultCounts = { all: 0, clinic: 0, release: 0, critical: 0 };
    if (!dogs) return defaultCounts;
    return {
      all: dogs.length,
      clinic: dogs.filter((d: DogCurrentStatus) => d.current_status !== 'release').length,
      release: dogs.filter((d: DogCurrentStatus) => d.current_status === 'release').length,
      critical: dogs.filter((d: DogCurrentStatus) => d.condition === 'critical').length,
    };
  }, [data?.dogs]);

  const showFAB = !['/catch', '/identify'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-full bg-surface">
      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Search by ID or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-gray-100 border-none rounded-full text-base focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={cn(
                "flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
                filter === opt.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-gray-100 text-muted border-transparent hover:bg-gray-200"
              )}
            >
              {opt.label} ({counts[opt.id as keyof typeof counts]})
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {isLoading && page === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-card" />
            ))}
          </div>
        ) : filteredDogs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredDogs.map((dog: DogCurrentStatus) => (
              <DogCard key={dog.dog_id} dog={dog} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <PawPrint size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-dark">No dogs found</h3>
            <p className="text-muted text-sm mt-1">Try adjusting your search or filters.</p>
            <Button asChild className="mt-6 rounded-full bg-primary hover:bg-primary-dark shadow-teal-glow">
              <Link to="/catch">Register First Dog</Link>
            </Button>
          </div>
        )}

        {/* Load More */}
        {data?.hasMore && (
          <div className="mt-8 mb-12 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={isFetching}
              className="rounded-full px-8"
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* FAB */}
      {showFAB && (
        <Link
          to="/catch"
          className="fixed bottom-24 right-5 w-[60px] h-[60px] bg-primary rounded-full flex items-center justify-center text-white shadow-teal-glow active:scale-95 transition-transform z-40"
        >
          <Camera size={24} />
        </Link>
      )}
    </div>
  );
};

export default DogsPage;
