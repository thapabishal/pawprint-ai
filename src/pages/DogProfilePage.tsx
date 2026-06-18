import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDog } from '@/hooks/useDog';
import { StatusBadge } from '@/components/dog/StatusBadge';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  User,
  ArrowRight,
  PawPrint,
  Clock,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DogEvent } from '@/types';

const formatRelativeTime = (date: string) => {
  const diff = new Date().getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const TimelineItem: React.FC<{ event: DogEvent; isLast: boolean }> = ({ event, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const notes = event.notes || '';
  const isTruncated = notes.length > 100;
  const displayedNotes = isExpanded || !isTruncated ? notes : `${notes.substring(0, 100)}...`;

  const getEventColor = (type: string) => {
    switch (type) {
      case 'catch': return 'bg-status-catch ring-status-catch';
      case 'vaccinate': return 'bg-status-vaccinate ring-status-vaccinate';
      case 'sterilize': return 'bg-status-sterilize ring-status-sterilize';
      case 'release': return 'bg-status-release ring-status-release';
      case 'critical': return 'bg-status-critical ring-status-critical';
      default: return 'bg-status-observation ring-status-observation';
    }
  };

  return (
    <div className="relative flex gap-4 pb-8">
      {!isLast && (
        <div className="absolute left-[7px] top-4 h-full w-[2px] bg-gradient-to-b from-primary to-border" />
      )}

      {/* Circle dot */}
      <div className={cn(
        "relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white shadow-sm ring-2 ring-transparent transition-all",
        getEventColor(event.event_type)
      )} />

      {/* Event Card */}
      <div className="flex-1 rounded-xl border border-border bg-white p-4 shadow-sm transition-all border-l-[3px] border-l-primary">
        <div className="flex items-start justify-between mb-2">
          <StatusBadge status={event.event_type} className="h-5" />
          <span className="text-[12px] text-muted font-medium flex items-center gap-1">
            <Clock size={12} /> {formatRelativeTime(event.timestamp)}
          </span>
        </div>

        <div className="text-[13px] text-gray-600 font-medium mb-1">
          {new Date(event.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        {event.handler_name && (
          <div className="text-[12px] text-muted mb-2">
            by {event.handler_name}
          </div>
        )}

        {notes && (
          <div className="text-[13px] text-body italic leading-relaxed mb-3">
            {displayedNotes}
            {isTruncated && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary font-semibold ml-1 hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more →'}
              </button>
            )}
          </div>
        )}

        {event.location && (
          <a
            href={`https://maps.google.com/?q=${event.location.lat},${event.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-primary font-semibold hover:underline"
          >
            <MapPin size={14} /> View on map
          </a>
        )}
      </div>
    </div>
  );
};

const DogProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: dog, isLoading } = useDog(id);

  if (isLoading) {
    return <div className="h-screen w-full flex flex-col">
      <Skeleton className="h-[260px] w-full" />
      <div className="px-4 -mt-7 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>;
  }

  if (!dog) return <div className="p-8 text-center">Dog not found</div>;

  const daysInSystem = Math.floor(
    (new Date().getTime() - new Date(dog.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Hero Section */}
      <div className="relative h-[260px] w-full overflow-hidden">
        {dog.cover_image_url ? (
          <img
            src={dog.cover_image_url}
            alt="Dog Hero"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
            <PawPrint size={64} strokeWidth={1} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-dark shadow-md backdrop-blur-sm active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Hero Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="font-mono text-[12px] text-white/60 mb-1 tracking-wider uppercase">
              #{dog.id.slice(0, 8)}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={dog.current_status} className="bg-white/20 text-white border-white/30" />
              <span className="text-[12px] text-white/80 font-medium">
                {daysInSystem} days in system
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card Overlay */}
      <div className="relative z-10 -mt-7 px-4">
        <div className="rounded-[20px] bg-white p-5 shadow-elevated">
          <div className="flex items-center justify-around gap-2">
            <div className="flex flex-1 flex-col items-center rounded-xl bg-surface border border-border py-3 px-2 text-center">
              <User size={16} className="text-muted mb-1" />
              <span className="text-[14px] font-semibold text-dark capitalize">{dog.sex}</span>
              <span className="text-[10px] text-muted font-medium uppercase tracking-tight">Sex</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-xl bg-surface border border-border py-3 px-2 text-center">
              <Calendar size={16} className="text-muted mb-1" />
              <span className="text-[14px] font-semibold text-dark capitalize">{dog.age_group}</span>
              <span className="text-[10px] text-muted font-medium uppercase tracking-tight">Age</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-xl bg-surface border border-border py-3 px-2 text-center">
              <PawPrint size={16} className="text-muted mb-1" />
              <span className="text-[14px] font-semibold text-dark capitalize">{dog.sterilization_status}</span>
              <span className="text-[10px] text-muted font-medium uppercase tracking-tight">Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Traits Card */}
      <div className="mt-4 px-4">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-dark border-l-4 border-primary pl-2">Physical Traits</h3>
            <Button variant="ghost" size="sm" className="h-8 text-muted">
              <Edit2 size={14} className="mr-1" /> Edit
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <span className="text-[13px] text-muted font-medium">Ear Type</span>
              <span className="text-[14px] font-semibold text-dark capitalize">{dog.visual_tags?.ears || '—'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
              <span className="text-[13px] text-muted font-medium">Coat Color</span>
              <div className="flex items-center gap-2">
                {dog.visual_tags?.coat && (
                  <div className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: '#D1D5DB' }} />
                )}
                <span className="text-[14px] font-semibold text-dark capitalize">{dog.visual_tags?.coat || '—'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-1">
              <span className="text-[13px] text-muted font-medium">Markings</span>
              <div className="flex flex-wrap gap-1.5">
                {dog.visual_tags?.markings && dog.visual_tags.markings.length > 0 ? (
                  dog.visual_tags.markings.map((m: string) => (
                    <span key={m} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-bold capitalize">
                      {m.replace('_', ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-[14px] font-semibold text-gray-300">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mt-6 px-4">
        <h3 className="text-[16px] font-bold text-dark mb-4 pl-1">History</h3>
        <div className="flex flex-col">
          {dog.events.map((event: DogEvent, idx: number) => (
            <TimelineItem
              key={event.id}
              event={event}
              isLast={idx === dog.events.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Release Button */}
      {dog.current_status !== 'release' && (
        <div className="fixed bottom-[80px] left-0 right-0 px-4 z-40">
          <Button
            asChild
            className="w-full h-[52px] bg-[#10B981] hover:bg-[#0D9A6C] text-white text-[15px] font-bold rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all active:scale-[0.98]"
          >
            <Link to={`/identify?dogId=${dog.id}`}>
              Release This Dog <ArrowRight size={18} className="ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default DogProfilePage;
