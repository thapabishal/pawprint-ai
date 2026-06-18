import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { PawPrint } from 'lucide-react';
import type { DogCurrentStatus } from '@/types';

interface DogCardProps {
  dog: DogCurrentStatus;
}

export const DogCard: React.FC<DogCardProps> = ({ dog }) => {
  const daysInSystem = Math.floor(
    (new Date().getTime() - new Date(dog.last_event_at || dog.registered_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      to={`/dog/${dog.dog_id}`}
      className="group relative aspect-[3/4] overflow-hidden rounded-card bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated active:scale-[0.98]"
    >
      {dog.cover_image_url ? (
        <img
          src={dog.cover_image_url}
          alt={`Dog ${dog.dog_id.slice(0, 8)}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-surface text-muted">
          <PawPrint size={48} strokeWidth={1} className="opacity-20" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Info on Overlay */}
      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-white/70">
            #{dog.dog_id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-[10px] font-medium text-white/60">
            {daysInSystem === 0 ? 'Today' : `${daysInSystem}d`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge
            status={dog.condition === 'critical' ? 'critical' : dog.current_status}
            className="border-white/20 bg-white/10 text-white"
          />
        </div>
      </div>
    </Link>
  );
};
