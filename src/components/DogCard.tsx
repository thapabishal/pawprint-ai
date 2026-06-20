import React from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DogCurrentStatusView } from '@/types';

interface DogCardProps {
  dog: DogCurrentStatusView;
  className?: string;
}

export const DogCard: React.FC<DogCardProps> = ({ dog, className }) => {
  const daysInSystem = differenceInDays(new Date(), new Date(dog.registered_at));

  return (
    <Link
      to={`/dog/${dog.dog_id}`}
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-[16px] bg-gray-100 shadow-card transition-all duration-300 hover:shadow-elevated md:hover:-translate-y-1',
        className
      )}
    >
      {dog.cover_image_url ? (
        <img
          src={dog.cover_image_url}
          alt={`Dog ${dog.dog_id.slice(0, 8)}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 text-gray-300">
          <PawPrint size={48} strokeWidth={1.5} />
          <span className="mt-2 text-xs font-medium">No Photo</span>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-white/70">
            ID: {dog.dog_id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-[10px] font-medium text-white/80">
            {daysInSystem}d
          </span>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={dog.current_status} className="scale-90 origin-left" />
          {dog.condition === 'critical' && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
        </div>
      </div>
    </Link>
  );
};
