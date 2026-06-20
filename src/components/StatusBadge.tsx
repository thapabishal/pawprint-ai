import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EventType } from '@/types';

interface StatusBadgeProps {
  status: EventType | string;
  className?: string;
  variant?: 'solid' | 'outline' | 'subtle';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  catch: { label: 'Caught', color: 'text-white', bg: 'bg-[#F59E0B]' },
  vaccinate: { label: 'Vaccinated', color: 'text-white', bg: 'bg-[#06B6D4]' },
  sterilize: { label: 'Sterilized', color: 'text-white', bg: 'bg-[#EC4899]' },
  release: { label: 'Released', color: 'text-white', bg: 'bg-[#10B981]' },
  observation: { label: 'Observation', color: 'text-white', bg: 'bg-[#8B5CF6]' },
  recover: { label: 'In Recovery', color: 'text-white', bg: 'bg-[#F59E0B]' },
  critical: { label: 'Critical', color: 'text-white', bg: 'bg-[#EF4444]' },
  died: { label: 'Died', color: 'text-white', bg: 'bg-[#EF4444]' },
  escaped: { label: 'Escaped', color: 'text-white', bg: 'bg-[#F59E0B]' },
  treat: { label: 'Treated', color: 'text-white', bg: 'bg-[#F59E0B]' },
  on_site_vaccinate: { label: 'Field Vaccinated', color: 'text-white', bg: 'bg-[#06B6D4]' },
  unknown: { label: 'Unknown', color: 'text-slate-500', bg: 'bg-slate-100' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, variant = 'solid' }) => {
  const config = statusConfig[status as string] || statusConfig.unknown;

  if (variant === 'subtle') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm',
          config.bg.replace('bg-', 'bg-opacity-15 text-'),
          className
        )}
        style={{ color: config.bg.replace('bg-[', '').replace(']', '') }}
      >
        {config.label}
      </span>
    );
  }

  return (
    <Badge
      className={cn(
        'border-none font-semibold text-[10px] px-2 py-0.5 rounded-full shadow-sm',
        config.bg,
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};
