import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar,
  Activity,
  UserMinus,
  UserPlus,
  ShieldCheck

} from 'lucide-react';
import { RoleBadge } from '@/components/RoleBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { UserProfile, FieldWorkerStats, UserRole } from '@/types';
import RoleChangeSheet from './RoleChangeSheet';

interface UserCardProps {
  user: UserProfile;
  stats?: FieldWorkerStats;
  isSelf: boolean;
  onUpdateRole: (userId: string, role: UserRole) => Promise<void>;
  onToggleActive: (userId: string, currentStatus: boolean) => Promise<void>;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  stats,
  isSelf,
  onUpdateRole,
  onToggleActive
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelf) return;

    if (user.is_active && !confirm(`Are you sure you want to deactivate ${user.full_name}?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await onToggleActive(user.id, user.is_active);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 border-border/50',
        !user.is_active && 'opacity-60 grayscale-[0.5] bg-muted/30'
      )}
    >
      <div
        className="cursor-pointer p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 border-2 border-white shadow-sm">
                {initials}
              </div>
            )}
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
              user.is_active ? 'bg-emerald-500' : 'bg-slate-400'
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm truncate">{user.full_name}</h4>
              {isSelf && (
                <Badge variant="outline" className="text-[9px] py-0 h-4 bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-tighter">You</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <RoleBadge role={user.role} />
              <span className="text-xs text-muted-foreground truncate">ID: {user.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
              user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            )}>
              {user.is_active ? 'Active' : 'Inactive'}
            </div>
            {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0 border-t border-border/30 bg-muted/10">
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <Phone size={14} className="text-muted-foreground" />
                <span className="font-medium">{user.phone || 'No phone set'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Joined: {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Activity size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">
                  Last Active: {stats?.last_active ? formatDistanceToNow(new Date(stats.last_active), { addSuffix: true }) : 'Never'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Programmes</p>
              <div className="flex flex-wrap gap-1">
                {user.programmes?.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[10px] py-0 px-2 bg-white border-border/50 capitalize">
                    {p}
                  </Badge>
                )) || <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 bg-white/50 p-3 rounded-xl border border-border/30">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{stats?.catches || 0}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Catches</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-lg font-bold text-[#F59E0B]">{stats?.vaccinations || 0}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Vaccines</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{stats?.releases || 0}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Releases</p>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <Button
              variant="outline"
              className="flex-1 h-9 rounded-xl text-xs font-bold gap-2 bg-white"
              onClick={() => setIsRoleSheetOpen(true)}
            >
              <ShieldCheck size={14} />
              Change Role
            </Button>

            {!isSelf && (
              <Button
                variant={user.is_active ? 'outline' : 'default'}
                className={cn(
                  'flex-1 h-9 rounded-xl text-xs font-bold gap-2',
                  user.is_active ? 'border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 bg-white' : 'bg-emerald-600 hover:bg-emerald-700'
                )}
                onClick={handleToggleActive}
                disabled={isUpdating}
              >
                {user.is_active ? (
                  <>
                    <UserMinus size={14} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    Reactivate
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      )}

      <RoleChangeSheet
        isOpen={isRoleSheetOpen}
        onClose={() => setIsRoleSheetOpen(false)}
        currentRole={user.role}
        userName={user.full_name}
        onConfirm={(newRole) => onUpdateRole(user.id, newRole)}
      />
    </Card>
  );
};

export default UserCard;
