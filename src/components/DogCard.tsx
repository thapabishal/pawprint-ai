import React from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { PawPrint, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { DogCurrentStatusView } from '@/types';

interface DogCardProps {
  dog: DogCurrentStatusView;
  className?: string;
}

export const DogCard: React.FC<DogCardProps> = ({ dog, className }) => {
  const daysInSystem = differenceInDays(new Date(), new Date(dog.registered_at));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link
        to={`/dog/${dog.dog_id}`}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-[24px] bg-white shadow-card border border-border/50 h-full transition-all duration-300',
          className
        )}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {dog.cover_image_url ? (
            <motion.img
              layoutId={`dog-image-${dog.dog_id}`}
              src={dog.cover_image_url}
              alt={`Dog ${dog.dog_id.slice(0, 8)}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 text-gray-300">
              <PawPrint size={40} strokeWidth={1} />
              <span className="mt-2 text-[10px] font-bold uppercase tracking-widest">No Portrait</span>
            </div>
          )}

          {/* Premium Overlays */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute top-3 left-3">
             <StatusBadge status={dog.current_status} className="backdrop-blur-md bg-white/20 border-white/30 text-white shadow-sm" />
          </div>

          {dog.condition === 'critical' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-red-500 rounded-full animate-pulse shadow-lg">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
              <span className="text-[9px] font-extrabold text-white uppercase tracking-tighter">Critical</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-extrabold text-dark tracking-tight">
                #{dog.dog_id.slice(0, 8).toUpperCase()}
              </span>
              <div className="flex items-center gap-1 text-muted">
                <Calendar className="w-3 h-3" />
                <span className="text-[11px] font-bold">{daysInSystem}d</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted">
              <MapPin className="w-3 h-3" />
              <span className="text-[11px] font-medium truncate">
                {dog.last_notes?.split(',')[0] || 'Unknown Location'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
             <div className="flex gap-1">
                <div className={cn("w-2 h-2 rounded-full", dog.sex === 'male' ? "bg-blue-400" : dog.sex === 'female' ? "bg-pink-400" : "bg-gray-300")} />
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{dog.sex}</span>
             </div>
             <motion.div
               whileHover={{ x: 3 }}
               className="text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"
             >
                Profile <ArrowRight className="w-3 h-3" />
             </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
  </svg>
);
