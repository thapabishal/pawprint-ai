import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EventType } from '@/types';

interface StatusBadgeProps {
  status: EventType | 'critical' | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  catch: { label: 'Catch', className: 'bg-status-catch/10 text-status-catch border-status-catch/20' },
  vaccinate: { label: 'Vaccinate', className: 'bg-status-vaccinate/10 text-status-vaccinate border-status-vaccinate/20' },
  sterilize: { label: 'Sterilize', className: 'bg-status-sterilize/10 text-status-sterilize border-status-sterilize/20' },
  recover: { label: 'Recover', className: 'bg-status-recover/10 text-status-recover border-status-recover/20' },
  release: { label: 'Released', className: 'bg-status-release/10 text-status-release border-status-release/20' },
  observation: { label: 'Observation', className: 'bg-status-observation/10 text-status-observation border-status-observation/20' },
  critical: { label: 'Critical', className: 'bg-status-critical/10 text-status-critical border-status-critical/20' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status.toLowerCase()] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: 'bg-muted/10 text-muted border-muted/20',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};
