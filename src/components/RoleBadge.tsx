import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; bg: string; text: string; dot: string }> = {
  field_worker: {
    label: 'Field Worker',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  clinic_vet: {
    label: 'Clinic Vet',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500'
  },
  programme_manager: {
    label: 'Manager',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  admin: {
    label: 'Admin',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const config = roleConfig[role];

  if (!config) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'border-none font-semibold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </Badge>
  );
};
