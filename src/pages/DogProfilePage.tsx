import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft,
  Activity,
  User,
  Scissors,
  Clock,
  Syringe,
  ArrowRight,
  Info,
  Edit2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { DogWithStatus, EventType } from '@/types';

const DogProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const { data: dog, isLoading, error } = useQuery({
    queryKey: ['dog', id || ''],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select(`*, dog_images (image_url, is_cover), events (*)`)
        .eq('id', id as string)
        .single();

      if (error) throw error;

      const { data: statusData } = await (supabase
        .from('dog_current_status') as any)
        .select('current_status, last_updated')
        .eq('dog_id', id as string)
        .single();

      const events = ((data as any).events || []).sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      const result: any = {
        ...(data as any),
        current_status: (statusData?.current_status || 'observation') as EventType,
        last_updated: statusData?.last_updated || (data as any).created_at,
        images: (data as any).dog_images,
        events: events
      };

      return result as DogWithStatus;
    },
  });

  const toggleNotes = (eventId: string) => {
    setIsExpanded(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  if (isLoading) return <div className="animate-pulse bg-white min-h-screen" />;
  if (error || !dog) return <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-white"><h2 className="text-2xl font-extrabold text-dark tracking-tight">Profile Error</h2></div>;

  const daysInSystem = formatDistanceToNow(new Date(dog.created_at));

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] pb-[160px]">
      <div className="relative h-[40dvh] w-full overflow-hidden">
        {dog.cover_image_url ? (
          <motion.img layoutId={`dog-image-${dog.id}`} src={dog.cover_image_url} alt="Dog cover" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300"><Info size={64} strokeWidth={1} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F9FAFB] via-transparent to-black/30" />
        <button onClick={() => navigate(-1)} className="absolute left-5 top-5 h-12 w-12 flex items-center justify-center rounded-full glass-card transition-transform"><ChevronLeft size={24} className="text-dark" /></button>
        <div className="absolute bottom-12 left-6 right-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
            <span className="text-[12px] font-extrabold text-dark/60 uppercase tracking-[0.2em]">Record Profile</span>
            <h1 className="text-[36px] font-extrabold text-dark tracking-tighter leading-none">#{dog.id.slice(0, 8).toUpperCase()}</h1>
          </motion.div>
        </div>
      </div>
      <div className="px-5 space-y-6 -mt-6 relative z-10">
        <div className="flex items-center justify-between p-4 glass-card rounded-[24px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-[14px]"><Activity size={20} className="text-primary" /></div>
            <div>
              <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block leading-none mb-1">Status</span>
              <StatusBadge status={dog.current_status} className="scale-90 origin-left" />
            </div>
          </div>
          <div className="text-right">
             <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block leading-none mb-1">Registered</span>
             <span className="text-[14px] font-bold text-dark">{daysInSystem} ago</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<User size={18} className="text-blue-500" />} label="Sex" value={dog.sex} color="blue" />
          <StatCard icon={<Clock size={18} className="text-purple-500" />} label="Age" value={dog.age_group} color="purple" />
          <StatCard icon={<Activity size={18} className={dog.condition === 'critical' ? 'text-red-500' : 'text-green-500'} />} label="Condition" value={dog.condition} color={dog.condition === 'critical' ? 'red' : 'green'} />
        </div>
        <div className="bg-white rounded-[28px] p-6 shadow-card border border-border/40">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-extrabold text-dark tracking-tight">Identity Details</h3>
              <button className="h-9 w-9 glass-card rounded-full flex items-center justify-center text-muted"><Edit2 size={16} /></button>
           </div>
           <div className="space-y-4">
              <DetailRow label="Ear Type" value={dog.visual_tags?.ears} icon="👂" />
              <DetailRow label="Coat Color" value={dog.visual_tags?.coat} icon="🎨" />
              <div className="space-y-2 pt-2">
                 <span className="text-[12px] font-bold text-muted uppercase tracking-wider ml-1">Markings</span>
                 <div className="flex flex-wrap gap-2">
                    {dog.visual_tags?.markings?.map(m => <span key={m} className="px-3 py-1.5 bg-gray-50 border border-border/50 rounded-full text-[12px] font-bold text-body">{m.replace('_', ' ')}</span>) || <span className="text-muted italic text-[13px]">No markings</span>}
                 </div>
              </div>
           </div>
        </div>
        <section className="space-y-4 pt-4">
           <div className="relative space-y-4">
             <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />
             {dog.events.map((event) => <TimelineEvent key={event.id} event={event} isExpanded={isExpanded[event.id]} onToggle={() => toggleNotes(event.id)} />)}
           </div>
        </section>
      </div>
      {dog.current_status !== 'release' && (
        <div className="fixed bottom-[90px] left-0 right-0 z-40 px-5 pointer-events-none">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md mx-auto pointer-events-auto">
            <Button onClick={() => navigate(`/identify?dogId=${dog.id}`)} className="w-full h-[64px] bg-[#10B981] hover:bg-[#0da673] text-white text-[17px] font-extrabold rounded-[22px] shadow-elevated flex items-center justify-center gap-3">
              <ArrowRight size={22} /><span>Ready for Release</span>
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-3 rounded-[20px] shadow-card border border-border/30 flex flex-col items-center text-center">
    <div className={cn("w-10 h-10 rounded-[14px] flex items-center justify-center mb-2", color === 'blue' ? "bg-blue-50" : color === 'purple' ? "bg-purple-50" : color === 'red' ? "bg-red-50" : "bg-green-50")}>{icon}</div>
    <span className="text-[13px] font-extrabold text-dark capitalize truncate w-full">{value}</span>
    <span className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{label}</span>
  </div>
);

const DetailRow = ({ label, value, icon }: any) => (
  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3"><span className="text-[16px]">{icon}</span><span className="text-[13px] font-bold text-body">{label}</span></div>
    <span className="text-[13px] font-bold text-dark capitalize">{value?.replace('_', ' ') || '—'}</span>
  </div>
);

const TimelineEvent = ({ event, isExpanded, onToggle }: any) => {
  const config = {
    catch: { icon: Activity, color: '#0D7377', label: 'Registered' },
    vaccinate: { icon: Syringe, color: '#F0A500', label: 'Vaccinated' },
    on_site_vaccinate: { icon: Syringe, color: '#F0A500', label: 'Field Vaccinated' },
    sterilize: { icon: Scissors, color: '#EC4899', label: 'Sterilized' },
    recover: { icon: Clock, color: '#F59E0B', label: 'Recovery' },
    release: { icon: ArrowRight, color: '#10B981', label: 'Released' },
    observation: { icon: Activity, color: '#8B5CF6', label: 'Observed' },
  }[event.event_type as string] || { icon: Info, color: '#6B7280', label: 'Event' };

  return (
    <div className="relative pl-12 pb-2">
      <div className="absolute left-[20px] top-1 z-10 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: config.color }} />
      <div className="bg-white rounded-[22px] p-4 border border-border/30 shadow-sm">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: config.color }}>{config.label}</span>
           <span className="text-[10px] font-bold text-muted">{format(new Date(event.timestamp), 'MMM d, h:mm a')}</span>
        </div>
        {event.notes && (
          <div className="bg-gray-50/50 rounded-[14px] p-3 mb-2">
             <p className={cn("text-[13px] text-body font-medium leading-relaxed", !isExpanded && "line-clamp-2")}>{event.notes}</p>
             {event.notes.length > 50 && (
               <button onClick={onToggle} className="text-[11px] font-extrabold text-primary mt-1 uppercase tracking-tighter">{isExpanded ? 'Hide' : 'Read more'}</button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DogProfilePage;
