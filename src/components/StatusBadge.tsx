import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { EventType } from '@/types';

interface StatusBadgeProps {
  status: EventType | string;
  className?: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  catch: { label: 'In Clinic', color: 'text-orange-600', bg: 'bg-orange-50' },
  vaccinate: { label: 'Vaccinated', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  on_site_vaccinate: { label: 'Field Vaccinated', color: 'text-amber-600', bg: 'bg-amber-50' },
  sterilize: { label: 'Sterilized', color: 'text-pink-600', bg: 'bg-pink-50' },
  recover: { label: 'Recovery', color: 'text-orange-600', bg: 'bg-orange-50' },
  release: { label: 'Released', color: 'text-green-600', bg: 'bg-green-50' },
  observation: { label: 'Observation', color: 'text-slate-600', bg: 'bg-slate-50' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusMap[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-50' };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest border border-current opacity-90 transition-all',
        config.bg,
        config.color,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 mr-2">
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color.replace('text', 'bg'))}></span>
        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", config.color.replace('text', 'bg'))}></span>
      </span>
      {config.label}
    </motion.div>
  );
};
