import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  MapPin,
  User,
  Edit2,
  ArrowRight,
  Info,
  Activity,
  Scissors,
  Syringe,
  PawPrint,
  Clock,
  HeartPulse,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useDog } from '@/hooks/useDog';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ClinicActionsPanel } from '@/components/clinic/ClinicActionsPanel';
import { EventLogger } from '@/components/clinic/EventLogger';
import type { DogEvent, EventType } from '@/types';

const DogProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: dog, isLoading, error, refetch } = useDog(id);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const [activeAction, setActiveAction] = useState<EventType | null>(null);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);

  if (isLoading) return <ProfileSkeleton />;
  if (error || !dog) return <ProfileError error={error} />;

  const daysInSystem = Math.floor(
    (new Date().getTime() - new Date(dog.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const toggleNotes = (eventId: string) => {
    setIsExpanded(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const handleAction = (type: any) => {
    setActiveAction(type);
    setIsLoggerOpen(true);
  };

  // Determine if booster is due
  // For now, if next_vaccination_due is within 30 days or past
  const isBoosterDue = dog.next_vaccination_due
    ? new Date(dog.next_vaccination_due).getTime() <= new Date().getTime() + (30 * 86400000)
    : false;

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Hero Section */}
      <div className="relative h-[260px] w-full overflow-hidden bg-gray-200">
        {dog.cover_image_url ? (
          <img
            src={dog.cover_image_url}
            alt="Dog Hero"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300">
            <PawPrint size={80} strokeWidth={1} />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Top Controls */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform active:scale-95"
        >
          <ChevronLeft size={20} className="text-dark" />
        </button>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-11 left-4 right-4 flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[12px] font-medium text-white/60">
              ID: {dog.id.toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={dog.current_status} />
              <span className="text-[12px] font-semibold text-white/80">
                • {daysInSystem} days in system
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card Overlay */}
      <div className="relative -mt-7 rounded-t-[20px] bg-white px-4 pt-5 pb-6 shadow-elevated">
        {/* Stats Row */}
        <div className="flex gap-2.5">
          <StatPill
            icon={<Activity size={16} />}
            label="Condition"
            value={dog.condition.charAt(0).toUpperCase() + dog.condition.slice(1)}
            valueClass={dog.condition === 'critical' ? 'text-red-500' : 'text-primary'}
          />
          <StatPill
            icon={<User size={16} />}
            label="Sex / Age"
            value={`${dog.sex === 'male' ? 'M' : dog.sex === 'female' ? 'F' : '?'} • ${dog.age_group.charAt(0).toUpperCase()}`}
          />
          <StatPill
            icon={<Scissors size={16} />}
            label="Sterilized"
            value={dog.sterilization_status === 'sterilized' ? 'Yes' : 'No'}
          />
        </div>

        {/* Physical Traits Card */}
        <div className="mt-6 rounded-[16px] border border-border bg-white p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-dark">Physical Traits</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted">
              <Edit2 size={14} />
            </Button>
          </div>

          <div className="space-y-3.5">
            <TraitRow label="Ear Type" value={dog.visual_tags?.ears?.replace('_', ' ')} />
            <TraitRow
                label="Coat Color"
                value={dog.visual_tags?.coat?.replace('_', ' ')}
                swatch={dog.visual_tags?.coat}
            />
            <div className="flex items-start justify-between">
              <span className="text-[13px] text-muted">Markings</span>
              <div className="flex flex-wrap justify-end gap-1.5 max-w-[60%]">
                {dog.visual_tags?.markings && dog.visual_tags.markings.length > 0 ? (
                  dog.visual_tags.markings.map((m: string) => (
                    <span key={m} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {m.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-[13px] text-slate-300">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clinic Actions Panel - Only for Clinic Vet/Admin */}
        {profile && (profile.role === 'clinic_vet' || profile.role === 'admin') && (
          <ClinicActionsPanel
            dog={dog}
            role={profile.role}
            onAction={handleAction}
            isBoosterDue={isBoosterDue}
          />
        )}

        {/* History Timeline */}
        <div className="mt-8">
          <h3 className="mb-4 text-[16px] font-bold text-dark">History</h3>
          <div className="relative space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary to-gray-200" />

            {[...dog.events].reverse().map((event) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isExpanded={isExpanded[event.id]}
                onToggle={() => toggleNotes(event.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {activeAction && (
        <EventLogger
          isOpen={isLoggerOpen}
          onOpenChange={setIsLoggerOpen}
          dogId={dog.id}
          eventType={activeAction}
          onSuccess={() => refetch()}
          catchPhotoUrl={dog.cover_image_url}
        />
      )}
    </div>
  );
};

// Sub-components
const StatPill = ({ icon, label, value, valueClass }: any) => (
  <div className="flex flex-1 flex-col items-center rounded-[10px] border border-border bg-[#F9FAFB] py-2.5 px-2 text-center">
    <div className="mb-1 text-muted opacity-60">{icon}</div>
    <span className={cn("text-[14px] font-bold leading-tight", valueClass || "text-dark")}>{value}</span>
    <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">{label}</span>
  </div>
);

const TraitRow = ({ label, value, swatch }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[13px] text-muted">{label}</span>
    <div className="flex items-center gap-2">
      {swatch && <div className="h-3.5 w-3.5 rounded-full border border-black/5" style={{ backgroundColor: getCoatColorHex(swatch) }} />}
      <span className={cn("text-[13px] font-medium capitalize", !value && "text-slate-300")}>
        {value || '—'}
      </span>
    </div>
  </div>
);

const TimelineEvent = ({ event, isExpanded, onToggle }: { event: DogEvent, isExpanded: boolean, onToggle: () => void }) => {
  const configMap: Record<string, { icon: any, color: string, label: string }> = {
    catch: { icon: Activity, color: '#F59E0B', label: 'Caught' },
    vaccinate: { icon: Syringe, color: '#06B6D4', label: 'Vaccinated' },
    sterilize: { icon: Scissors, color: '#EC4899', label: 'Sterilized' },
    recover: { icon: Clock, color: '#F59E0B', label: 'Recovery' },
    release: { icon: ArrowRight, color: '#10B981', label: 'Released' },
    observation: { icon: Activity, color: '#8B5CF6', label: 'Observed' },
    treat: { icon: HeartPulse, color: '#F59E0B', label: 'Treated' },
    died: { icon: XCircle, color: '#EF4444', label: 'Died' },
    escaped: { icon: AlertTriangle, color: '#F59E0B', label: 'Escaped' },
    on_site_vaccinate: { icon: Syringe, color: '#06B6D4', label: 'Field Vaccinated' },
  };

  const config = configMap[event.event_type] || configMap.catch;

  return (
    <div className="relative pl-7">
      {/* Dot */}
      <div
        className="absolute left-0 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white shadow-[0_0_8px_rgba(0,0,0,0.1)]"
        style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}50` }}
      />

      <div className="rounded-[12px] border border-border bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md" style={{ borderLeft: `3px solid ${config.color}` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</span>
            {event.outcome && event.outcome !== 'completed' && (
               <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                 {event.outcome.replace('_', ' ')}
               </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#9CA3AF]">
            {formatDistanceToNow(new Date(event.timestamp))} ago
          </span>
        </div>

        <div className="mt-1 text-[13px] font-bold text-slate-700">
          {format(new Date(event.timestamp), 'MMM d, yyyy • h:mm a')}
        </div>

        {event.handler_name && (
          <div className="mt-1 flex items-center gap-1 text-[12px] text-[#9CA3AF]">
            <User size={12} /> <span>by {event.handler_name}</span>
          </div>
        )}

        {event.notes && (
          <div className="mt-2">
            <p className={cn("text-[13px] italic text-body leading-relaxed", !isExpanded && "line-clamp-2")}>
              "{event.notes}"
            </p>
            {event.notes.length > 60 && (
              <button
                onClick={onToggle}
                className="mt-1 text-[12px] font-semibold text-primary"
              >
                {isExpanded ? 'Show less' : 'Show more →'}
              </button>
            )}
          </div>
        )}

        {event.location && (
          <a
            href={`https://maps.google.com/?q=${(event.location as any).coordinates[1]},${(event.location as any).coordinates[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-primary active:opacity-70"
          >
            <MapPin size={14} /> <span>View on map</span>
          </a>
        )}
      </div>
    </div>
  );
};

const getCoatColorHex = (color: string) => {
  const map: any = {
    red_brown: '#8B4513',
    black: '#000000',
    white: '#FFFFFF',
    grey: '#808080',
    brindle: '#5C4033',
    mixed: '#D2B48C',
  };
  return map[color] || '#CCCCCC';
};

const ProfileSkeleton = () => (
  <div className="animate-pulse bg-surface">
    <div className="h-[260px] bg-gray-200" />
    <div className="px-4">
      <div className="-mt-7 h-64 rounded-t-[20px] bg-white p-4 shadow-elevated">
        <div className="flex gap-2">
          <Skeleton className="h-16 flex-1 rounded-[10px]" />
          <Skeleton className="h-16 flex-1 rounded-[10px]" />
          <Skeleton className="h-16 flex-1 rounded-[10px]" />
        </div>
        <Skeleton className="mt-6 h-40 rounded-[16px]" />
      </div>
    </div>
  </div>
);

const ProfileError = ({ error }: any) => (
  <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
    <div className="mb-4 rounded-full bg-red-50 p-6 text-red-500">
        <Info size={48} />
    </div>
    <h2 className="text-xl font-bold">Something went wrong</h2>
    <p className="mt-2 text-muted">{error?.message || 'We could not load this dog profile.'}</p>
    <Button onClick={() => window.location.reload()} className="mt-6">Retry</Button>
  </div>
);

export default DogProfilePage;
