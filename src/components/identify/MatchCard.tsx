import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import type { MatchResult } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  result: MatchResult;
  onClick: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ result, onClick }) => {
  const { dog, composite_score, gps_distance_metres } = result;

  const getConfidenceLevel = (score: number) => {
    if (score > 0.7) return { label: 'High Confidence', color: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500/20' };
    if (score >= 0.4) return { label: 'Moderate Match', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/20' };
    return { label: 'Low Confidence', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/20' };
  };

  const level = getConfidenceLevel(composite_score);
  const catchDate = new Date(dog.events.find(e => e.event_type === 'catch')?.timestamp || dog.created_at);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full group text-left bg-white rounded-[28px] p-4 border border-border/40 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 overflow-hidden relative"
    >
      <div className="flex gap-4">
        {/* Dog Portrait Mini */}
        <div className="relative w-24 h-24 rounded-[20px] overflow-hidden bg-gray-100 flex-shrink-0 border border-white shadow-sm">
          {dog.cover_image_url ? (
            <img src={dog.cover_image_url} alt="Dog reference" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted/30">No Portrait</div>
          )}
        </div>

        {/* Info Area */}
        <div className="flex-1 min-w-0 space-y-2 py-1">
          <div className="flex justify-between items-start">
             <h4 className="text-[17px] font-extrabold text-dark tracking-tight truncate leading-tight">
                #{dog.id.slice(0, 8).toUpperCase()}
             </h4>
             <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-[0.1em]", level.bg, "text-white")}>
                {Math.round(composite_score * 100)}% Match
             </div>
          </div>

          <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-muted">
                <Calendar className="w-3 h-3" />
                <span className="text-[11px] font-bold">Caught {formatDistanceToNow(catchDate)} ago</span>
             </div>
             <div className="flex items-center gap-1.5 text-muted">
                <MapPin className="w-3 h-3" />
                <span className="text-[11px] font-bold">~{Math.round(gps_distance_metres)}m from original point</span>
             </div>
          </div>

          <p className="text-[12px] text-muted font-medium line-clamp-1 italic">
             "{dog.events[0]?.notes || 'No notes on record'}"
          </p>
        </div>
      </div>

      {/* Confidence Footer Bar */}
      <div className={cn("mt-auto p-3 rounded-[18px] flex items-center justify-between", level.bg, "bg-opacity-[0.04] border border-current border-opacity-[0.08]")}>
         <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", level.bg)} />
            <span className={cn("text-[11px] font-extrabold uppercase tracking-widest", level.color)}>{level.label}</span>
         </div>
         <ArrowRight className={cn("w-4 h-4", level.color)} />
      </div>

      {/* Animated Match Indicator */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${composite_score * 100}%` }}
        className={cn("absolute bottom-0 left-0 h-[3px]", level.bg)}
      />
    </motion.button>
  );
};
