import React, { useState, useEffect } from 'react';
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
  Clock,
  AlertTriangle,
  Phone,
  Check
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useDog } from '@/hooks/useDog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DogWithStatus, DogEvent, CoatColor } from '@/types';

const DogProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dog, isLoading, error } = useDog(id);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setTimeout(() => setNow(Date.now()), 0);
  }, []);

  if (isLoading) return <ProfileSkeleton />;
  if (error || !dog) return <ProfileError error={error} />;

  const toggleNotes = (eventId: string) => {
    setIsExpanded((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const catchTimestamp = dog.events.find(e => e.event_type === 'catch' || e.event_type === 'on_site_vaccinate')?.timestamp || dog.created_at;
  const daysInSystem = now > 0 ? Math.floor((now - new Date(catchTimestamp).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Hero Image Section */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {dog.cover_image_url ? (
          <img
            src={dog.cover_image_url}
            alt="Dog profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200">
            <Activity size={48} className="text-slate-400" />
          </div>
        )}
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
        {/* Status Panel (Task 4 Upgrade) */}
        <StatusPanel dog={dog} daysInSystem={daysInSystem} now={now} />

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
                  dog.visual_tags.markings.map((m) => (
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

        {/* History Timeline */}
        <div className="mt-8">
          <h3 className="mb-4 text-[16px] font-bold text-dark">History</h3>
          <div className="relative space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary to-gray-200" />

            {dog.events.map((event) => (
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
    </div>
  );
};

// --- Sub-components ---

const StatusPanel = ({ dog, daysInSystem, now }: { dog: DogWithStatus, daysInSystem: number, now: number }) => {
  return (
    <div className="space-y-6">
      <ProgrammeIdentityCard dog={dog} now={now} />
      <KeyNumbersRow dog={dog} daysInSystem={daysInSystem} />
      <QuickActionsRow dog={dog} />
      {dog.programme_type === 'cnvr' && <CNVRPipelineMiniView dog={dog} />}
    </div>
  );
};

const ProgrammeIdentityCard = ({ dog, now }: { dog: DogWithStatus, now: number }) => {
  const isCNVR = dog.programme_type === 'cnvr';

  if (isCNVR) {
    const hasRelease = dog.events.some(e => e.event_type === 'release');
    const hasSterilize = dog.events.some(e => e.event_type === 'sterilize');

    let subtitle = "Caught — awaiting clinic";
    let subtitleColor = "text-muted";

    if (hasRelease) {
      subtitle = "Released ✓";
      subtitleColor = "text-emerald-500";
    } else if (hasSterilize) {
      subtitle = "In Clinic — post-surgery recovery";
    }

    return (
      <div className="relative overflow-hidden rounded-[16px] bg-[#F0FDFA] p-4 flex gap-4">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0D7377]" />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
          <Scissors size={24} className="text-[#0D7377]" />
        </div>
        <div className="flex flex-col justify-center">
          <h4 className="text-[14px] font-bold text-[#0D7377]">CNVR Programme</h4>
          <p className={cn("text-[13px] font-medium", subtitleColor)}>{subtitle}</p>
        </div>

        {/* Stage progress dots */}
        <div className="ml-auto flex items-center gap-1.5 self-center">
          {[
            { label: 'C', done: true, current: false },
            { label: 'N', done: hasSterilize, current: !hasSterilize && !hasRelease },
            { label: 'V', done: dog.events.some(e => e.event_type === 'vaccinate' || e.event_type === 'on_site_vaccinate'), current: false },
            { label: 'R', done: hasRelease, current: false }
          ].map((dot, idx, arr) => (
            <React.Fragment key={idx}>
              <div className={cn(
                "h-2 w-2 rounded-full",
                dot.done ? "bg-[#0D7377]" : dot.current ? "bg-[#0D7377] ring-2 ring-[#0D7377]/20 animate-pulse" : "bg-gray-300"
              )}>
                {dot.current && <div className="h-1 w-1 bg-white rounded-full m-0.5" />}
              </div>
              {idx < arr.length - 1 && <div className="w-2 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Vaccination Programme
  const daysUntilBooster = dog.next_vaccination_due && now > 0
    ? Math.ceil((new Date(dog.next_vaccination_due).getTime() - now) / 86400000)
    : null;
  const isOverdue = daysUntilBooster !== null && daysUntilBooster < 0;

  // Find phone number in notes
  const phoneRegex = /\+977[- ]?[0-9]{9,10}/;
  const noteWithPhone = dog.events.find(e => e.notes && phoneRegex.test(e.notes))?.notes;
  const phoneNumber = noteWithPhone?.match(phoneRegex)?.[0];

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-[#FFFBEB] p-4 flex gap-4">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F0A500]" />
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
        <Syringe size={24} className="text-[#F0A500]" />
      </div>
      <div className="flex flex-col justify-center flex-1">
        <h4 className="text-[14px] font-bold text-[#92400E]">Vaccination Programme</h4>
        <p className="text-[13px] font-medium text-muted">
          {dog.vaccination_status === 'vaccinated' && dog.vaccination_date ? `Vaccinated on ${format(new Date(dog.vaccination_date), 'MMM d')}` : 'Not vaccinated'}
        </p>
      </div>

      {daysUntilBooster !== null && (
        <div className="flex items-center gap-3">
          {isOverdue ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-red-500 font-bold text-[13px] animate-pulse">
                <AlertTriangle size={14} />
                <span>Overdue by {Math.abs(daysUntilBooster)}d</span>
              </div>
              {phoneNumber && (
                <a href={`tel:${phoneNumber}`} className="mt-1 flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Phone size={10} /> Contact caretaker
                </a>
              )}
            </div>
          ) : (
            <div className="relative h-12 w-12 flex items-center justify-center">
               <svg className="h-12 w-12 -rotate-90 transform">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 * (1 - Math.min(1, (365 - daysUntilBooster) / 365))}
                  className={cn(
                    daysUntilBooster > 60 ? "text-emerald-500" : daysUntilBooster > 30 ? "text-amber-500" : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-[13px] font-bold leading-none">{daysUntilBooster}</span>
                <span className="text-[8px] font-medium text-muted">days</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const KeyNumbersRow = ({ dog, daysInSystem }: { dog: DogWithStatus, daysInSystem: number }) => {
  const isCNVR = dog.programme_type === 'cnvr';
  const hasGPS = dog.events.some(e => e.location_accuracy !== null);
  const bestAccuracy = dog.events.some(e => e.location_accuracy !== null)
    ? Math.min(...dog.events.map(e => e.location_accuracy).filter(a => a !== null) as number[])
    : null;

  return (
    <div className="flex items-stretch rounded-xl border border-border bg-white py-3">
      <KeyNumberItem
        label="Days"
        value={daysInSystem.toString()}
        subtext={`Caught ${formatDistanceToNow(new Date(dog.events.find(e => e.event_type === 'catch' || e.event_type === 'on_site_vaccinate')?.timestamp || dog.created_at))} ago`}
      />
      <KeyNumberItem
        label="Events"
        value={dog.events.length.toString()}
      />
      {isCNVR ? (
        <KeyNumberItem
          label="Surgery"
          value={dog.sterilization_status === 'sterilized' ? 'Neutered' : 'Intact'}
          icon={dog.sterilization_status === 'sterilized' ? <Scissors size={14} className="text-[#065F46]" /> : <Scissors size={14} className="text-[#9CA3AF]" />}
          valueClass={dog.sterilization_status === 'sterilized' ? 'text-[#065F46]' : 'text-[#9CA3AF]'}
        />
      ) : (
        <KeyNumberItem
          label="Vaccination"
          value={dog.vaccination_status === 'vaccinated' ? 'Vaccinated' : 'Not vacc.'}
          icon={dog.vaccination_status === 'vaccinated' ? <Syringe size={14} className="text-[#065F46]" /> : <Syringe size={14} className="text-[#9CA3AF]" />}
          valueClass={dog.vaccination_status === 'vaccinated' ? 'text-[#065F46]' : 'text-[#9CA3AF]'}
        />
      )}
      <KeyNumberItem
        label="Location"
        value={hasGPS ? 'Saved' : 'No GPS'}
        icon={<MapPin size={14} className={hasGPS ? 'text-[#065F46]' : 'text-[#9CA3AF]'} />}
        valueClass={hasGPS ? 'text-[#065F46]' : 'text-[#9CA3AF]'}
        subtext={hasGPS ? `±${bestAccuracy}m` : undefined}
        isLast
      />
    </div>
  );
};

interface KeyNumberItemProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  valueClass?: string;
  isLast?: boolean;
}

const KeyNumberItem = ({ label, value, subtext, icon, valueClass, isLast }: KeyNumberItemProps) => (
  <div className={cn("flex-1 flex flex-col items-center px-1 text-center", !isLast && "border-r border-border")}>
    <span className="text-[11px] font-medium text-[#9CA3AF] mb-0.5">{label}</span>
    <div className="flex items-center gap-1">
      {icon}
      <span className={cn("text-[16px] font-bold", valueClass || "text-[#111827]")}>{value}</span>
    </div>
    {subtext && <span className="text-[10px] text-[#9CA3AF] leading-tight mt-0.5">{subtext}</span>}
  </div>
);

const QuickActionsRow = ({ dog }: { dog: DogWithStatus }) => {
  const navigate = useNavigate();
  const isCNVR = dog.programme_type === 'cnvr';
  const hasRelease = dog.events.some(e => e.event_type === 'release');
  const hasVaccinate = dog.events.some(e => e.event_type === 'vaccinate' || e.event_type === 'on_site_vaccinate');
  const hasSterilize = dog.events.some(e => e.event_type === 'sterilize');

  return (
    <div className="flex flex-wrap gap-2">
      {isCNVR && !hasRelease && (
        <>
          {!hasVaccinate && (
            <Button variant="outline" className="h-9 px-4 rounded-lg text-[13px] border-[#06B6D4] text-[#06B6D4] bg-transparent">
              Mark Vaccinated
            </Button>
          )}
          {!hasSterilize && (
            <Button variant="outline" className="h-9 px-4 rounded-lg text-[13px] border-[#EC4899] text-[#EC4899] bg-transparent">
              Mark Sterilized
            </Button>
          )}
          <Button
            onClick={() => navigate(`/identify?dogId=${dog.id}`)}
            className="h-9 px-4 rounded-lg text-[13px] bg-[#10B981] text-white hover:bg-[#0da673] ml-auto"
          >
            Release Dog <ArrowRight size={14} className="ml-1" />
          </Button>
        </>
      )}

      {!isCNVR && (
        <Button variant="outline" className="h-9 px-4 rounded-lg text-[13px] border-[#F0A500] text-[#F0A500] bg-transparent">
          Record Booster
        </Button>
      )}
    </div>
  );
};

const CNVRPipelineMiniView = ({ dog }: { dog: DogWithStatus }) => {
  const hasSterilize = dog.events.some(e => e.event_type === 'sterilize');
  const hasVaccinate = dog.events.some(e => e.event_type === 'vaccinate' || e.event_type === 'on_site_vaccinate');
  const hasRelease = dog.events.some(e => e.event_type === 'release');

  const steps = [
    { label: 'Caught', completed: true },
    { label: 'Neutered', completed: hasSterilize },
    { label: 'Vaccinated', completed: hasVaccinate },
    { label: 'Released', completed: hasRelease },
  ];

  return (
    <div className="mt-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-[12px] right-[12px] top-[12px] h-0.5 bg-gray-200 -z-10" />

        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5 bg-white px-1">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center border-2",
              step.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-gray-300 text-gray-300"
            )}>
              {step.completed ? <Check size={14} /> : <Clock size={12} />}
            </div>
            <span className={cn(
              "text-[10px] font-bold",
              step.completed ? "text-dark" : "text-gray-400"
            )}>
              {step.label}
            </span>

            {/* Dynamic line coloring */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "absolute h-0.5 -z-10",
                step.completed && steps[idx+1].completed ? "bg-emerald-500" : "bg-gray-200"
              )} style={{
                left: `calc(${(idx * 33.33) + 6}% + 12px)`,
                width: 'calc(27% - 12px)'
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface TraitRowProps {
  label: string;
  value?: string;
  swatch?: CoatColor;
}

const TraitRow = ({ label, value, swatch }: TraitRowProps) => (
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
  const config = {
    catch: { icon: Activity, color: '#F59E0B', label: 'Caught' },
    vaccinate: { icon: Syringe, color: '#06B6D4', label: 'Vaccinated' },
    sterilize: { icon: Scissors, color: '#EC4899', label: 'Sterilized' },
    recover: { icon: Clock, color: '#F59E0B', label: 'Recovery' },
    release: { icon: ArrowRight, color: '#10B981', label: 'Released' },
    observation: { icon: Activity, color: '#8B5CF6', label: 'Observed' },
    on_site_vaccinate: { icon: Syringe, color: '#F0A500', label: 'On-Site Vacc.' },
  }[event.event_type as string] || { icon: Activity, color: '#6B7280', label: 'Event' };

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

        {event.vaccine_type && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="bg-amber-100 text-[#92400E] text-[11px] font-bold px-2 py-0.5 rounded-full">
              {event.vaccine_type.toUpperCase()}
            </span>
            {event.vaccine_batch && (
              <span className="text-[11px] text-[#9CA3AF]">Batch: {event.vaccine_batch}</span>
            )}
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
            href={`https://maps.google.com/?q=${((event.location as unknown as { coordinates: number[] }).coordinates[1])},${((event.location as unknown as { coordinates: number[] }).coordinates[0])}`}
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
  const map: Record<string, string> = {
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

interface ProfileErrorProps {
  error: Error | null;
}

const ProfileError = ({ error }: ProfileErrorProps) => (
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
