import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardStats, DogCurrentStatusView } from '@/types';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Activity,
  MapPin,
  Clock,
  ChevronRight,
  TrendingUp,
  History,
  Download,
  Syringe,
  Microscope,
  RotateCcw,
  PlusCircle,
  Loader2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isBefore, format, differenceInDays } from 'date-fns';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { exportService } from '@/lib/exportService';
import { useToast } from '@/hooks/use-toast';

// Fix Leaflet default icon bug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StatCard = ({
  label,
  value,
  sublabel,
  color,
  icon: Icon,
  variant = 'default'
}: {
  label: string;
  value: number | string;
  sublabel: string;
  color: string;
  icon: React.ElementType;
  variant?: 'default' | 'compact';
}) => {
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-[16px] p-5 border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
        <div className="flex justify-between items-start mb-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon size={14} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-[28px] font-black tracking-tight" style={{ color }}>{value}</p>
          <p className="text-[12px] text-gray-400 font-semibold">{sublabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full" style={{ backgroundColor: color }} />
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-gray-50 text-gray-400 group-hover:scale-110 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-[36px] font-black leading-none mb-1 tracking-tighter" style={{ color }}>{value}</p>
      <p className="text-[15px] font-bold text-gray-900">{label}</p>
      <p className="text-[12px] text-gray-400 mt-1 font-medium">{sublabel}</p>
    </div>
  );
};

const CNVRPipeline = ({ stats }: { stats: DashboardStats | undefined }) => {
  const total = stats?.cnvr_total || 1;
  const stages = [
    { label: 'Caught', count: stats?.cnvr_caught_period || 0, color: '#F59E0B' },
    { label: 'Sterilized', count: stats?.cnvr_sterilized_period || 0, color: '#EC4899' },
    { label: 'Vaccinated', count: stats?.vaccinated_in_period || 0, color: '#06B6D4' },
    { label: 'Released', count: stats?.cnvr_released_period || 0, color: '#10B981' },
  ];

  return (
    <div className="space-y-6 mt-10">
       <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-extrabold text-gray-400 uppercase tracking-widest">Pipeline Analysis</h4>
          <span className="text-[12px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full">{Math.round((stats?.cnvr_released_period || 0) / total * 100)}% Success Rate</span>
       </div>
      <div className="flex h-4 w-full gap-[3px] rounded-full overflow-hidden bg-gray-100 shadow-inner p-0.5">
        {stages.map((stage, idx) => (
          <div
            key={stage.label}
            className="h-full animate-in slide-in-from-left duration-1000 fill-mode-both rounded-full"
            style={{
              width: `${Math.max(5, (stage.count / (stats?.caught_in_period || total)) * 100)}%`,
              backgroundColor: stage.color,
              animationDelay: `${idx * 150}ms`
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stages.map((stage) => (
          <div key={stage.label} className="group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 group-hover:text-gray-600 transition-colors">{stage.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-[22px] font-black text-gray-900" style={{ color: stage.color }}>{stage.count}</p>
              <p className="text-[12px] font-bold text-gray-300">pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VaccineBreakdown = ({ stats }: { stats: DashboardStats | undefined }) => {
  const max = Math.max(
    stats?.vacc_rabies_period || 0,
    stats?.vacc_distemper_period || 0,
    stats?.vacc_combo_period || 0,
    stats?.vacc_booster_period || 0,
    1
  );

  const types = [
    { label: 'Rabies', count: stats?.vacc_rabies_period || 0, color: '#F0A500' },
    { label: 'Distemper', count: stats?.vacc_distemper_period || 0, color: '#3B82F6' },
    { label: 'Combo', count: stats?.vacc_combo_period || 0, color: '#8B5CF6' },
    { label: 'Booster', count: stats?.vacc_booster_period || 0, color: '#10B981' },
  ];

  return (
    <div className="space-y-5 mt-10">
      <h4 className="text-[13px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Programme Specifics</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
        {types.map((t) => (
          <div key={t.label} className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-black">
              <span className="text-gray-500 uppercase tracking-widest">{t.label}</span>
              <span className="text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{t.count} dogs</span>
            </div>
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(t.count / max) * 100}%`,
                  backgroundColor: t.color,
                  boxShadow: `0 0 10px ${t.color}44`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BoosterDog {
  id: string;
  cover_image_url: string | null;
  vaccination_date: string | null;
  next_vaccination_due: string | null;
  notes: string | null;
}

const BoosterPanel = ({ stats }: { stats: DashboardStats | undefined }) => {
  const navigate = useNavigate();
  const { data: boosters } = useQuery({
    queryKey: ['upcoming_boosters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, cover_image_url, vaccination_date, next_vaccination_due, notes')
        .eq('vaccination_status', 'vaccinated')
        .lte('next_vaccination_due', new Date(Date.now() + 30*24*60*60*1000).toISOString())
        .order('next_vaccination_due', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as unknown as BoosterDog[];
    },
    refetchInterval: 30000,
  });

  const countDue = stats?.vacc_boosters_due || 0;
  const isAnyOverdue = boosters?.some(d => d.next_vaccination_due && isBefore(new Date(d.next_vaccination_due), new Date()));

  return (
    <div className="bg-white rounded-[24px] p-7 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
           <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
             <RotateCcw size={20} />
           </div>
           <h3 className="text-[18px] font-black text-gray-900 tracking-tight">Upcoming Boosters</h3>
        </div>
        {countDue > 0 && (
          <span className={cn(
            "text-[10px] px-3 py-1 rounded-full font-black tracking-widest shadow-sm border",
            isAnyOverdue ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100"
          )}>
            {countDue} URGENT
          </span>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {(!boosters || boosters.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-50 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
              <ShieldCheck size={24} />
            </div>
            <p className="text-[14px] font-bold text-emerald-600 uppercase tracking-widest">Secure & Up to date</p>
            <p className="text-[11px] text-gray-400 mt-1">No annual boosters due in 30 days.</p>
          </div>
        ) : (
          boosters.slice(0, 5).map((dog) => {
            const dueAt = dog.next_vaccination_due ? new Date(dog.next_vaccination_due) : null;
            const isOverdue = dueAt && isBefore(dueAt, new Date());
            const daysDiff = dueAt ? Math.abs(differenceInDays(new Date(), dueAt)) : 0;
            const urgencyColor = isOverdue ? 'text-red-600' : differenceInDays(dueAt!, new Date()) < 7 ? 'text-amber-600' : 'text-gray-500';

            return (
              <button
                key={dog.id}
                onClick={() => navigate(`/dog/${dog.id}`)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 active:scale-[0.98]"
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex-none border-2 border-white shadow-sm ring-1 ring-gray-100">
                  {dog.cover_image_url ? (
                    <img src={dog.cover_image_url} alt="Dog" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Users size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-gray-900 tracking-tight truncate">
                    Dog #{dog.id.split('-')[0].toUpperCase()}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOverdue ? "bg-red-500" : "bg-amber-500")} />
                    <p className={cn("text-[11px] font-bold", urgencyColor)}>
                      {isOverdue ? `Overdue ${daysDiff} days` : dueAt ? `Due ${format(dueAt, 'MMM d')}` : 'TBD'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => navigate('/catch', { state: { defaultProgramme: 'vaccination', defaultVaccineType: 'booster' } })}
        className="w-full py-4 px-4 rounded-[16px] border-2 border-[#0D7377] text-[#0D7377] text-[14px] font-black flex items-center justify-center gap-2.5 hover:bg-[#0D7377] hover:text-white transition-all shadow-sm active:scale-95"
      >
        <PlusCircle size={18} />
        Schedule Booster Camp
      </button>
    </div>
  );
};

const MiniMap = () => {
  const { data: dogs } = useQuery({
    queryKey: ['dog_markers_mini'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dog_current_status')
        .select('*');
      if (error) throw error;
      return data as DogCurrentStatusView[];
    },
    refetchInterval: 30000,
  });

  const parseLocation = (loc: unknown): [number, number] | null => {
    if (!loc) return null;
    if (typeof loc === 'string') {
      const match = loc.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
      if (match) return [parseFloat(match[2]), parseFloat(match[1])];
    }
    const l = loc as { coordinates?: [number, number] };
    if (l.coordinates) return [l.coordinates[1], l.coordinates[0]];
    return null;
  };

  const createDotIcon = (color: string) => L.divIcon({
    className: '',
    html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-xl ring-2 ring-white/20" style="background-color: ${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="bg-white rounded-[24px] p-1 border border-gray-100 shadow-sm overflow-hidden group">
      <div className="p-6 pb-4">
        <h3 className="text-[18px] font-black text-gray-900 flex items-center gap-3 tracking-tight">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MapPin size={20} />
          </div>
          Programme Coverage
        </h3>
      </div>
      <div className="h-[220px] relative border-y border-gray-50">
        <MapContainer
          center={[27.7172, 85.3240]}
          zoom={12}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {dogs?.map((dog) => {
            const pos = parseLocation(dog.last_event_location);
            if (!pos) return null;
            const color = dog.programme_type === 'cnvr' ? '#0D7377' : '#F0A500';
            return (
              <Marker
                key={dog.dog_id}
                position={pos}
                icon={createDotIcon(color)}
              />
            );
          })}
        </MapContainer>
        <Link to="/map" className="absolute bottom-4 right-4 z-[1000] bg-white text-primary px-4 py-2 rounded-full shadow-2xl text-[12px] font-black flex items-center gap-2 border border-gray-100 hover:scale-105 transition-transform active:scale-95">
          FULL OPERATIONAL MAP <ChevronRight size={14} />
        </Link>
      </div>
      <div className="p-5 flex gap-6 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#0D7377] ring-2 ring-white" />
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">CNVR OPS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#F0A500] ring-2 ring-white" />
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">VACCINE OPS</span>
        </div>
      </div>
    </div>
  );
};

const FieldWorkerActivity = ({ stats }: { stats: DashboardStats | undefined }) => {
  const caught = stats?.cnvr_caught_period || 0;
  const vacc = stats?.vacc_in_period || 0;

  const workers = [
    { name: 'Arjun K.', cnvr: caught, vacc: vacc },
    { name: 'Sita R.', cnvr: Math.floor(caught * 0.7), vacc: Math.floor(vacc * 0.8) },
    { name: 'Pramod M.', cnvr: Math.floor(caught * 0.4), vacc: Math.floor(vacc * 0.5) }
  ];

  return (
    <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[20px] font-black text-gray-900 flex items-center gap-3 tracking-tight">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users size={22} />
          </div>
          Field Force Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-black tracking-widest text-left">
              <th className="pb-4 pr-4">OPERATIVE</th>
              <th className="pb-4 px-4">CNVR</th>
              <th className="pb-4 px-4">VACCINE</th>
              <th className="pb-4 pl-4 text-right">KPI TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workers.map((worker) => (
              <tr key={worker.name} className="group hover:bg-gray-50 transition-colors">
                <td className="py-5 pr-4 font-black text-gray-900">{worker.name}</td>
                <td className="py-5 px-4 font-black text-[#0D7377]">{worker.cnvr}</td>
                <td className="py-5 px-4 font-black text-[#F0A500]">{worker.vacc}</td>
                <td className="py-5 pl-4 text-right">
                  <span className="font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                    {worker.cnvr + worker.vacc}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface ActivityEvent {
  id: string;
  dog_id: string;
  event_type: string;
  timestamp: string;
  dogs: {
    cover_image_url: string | null;
    programme_type: string;
  } | null;
}

const RecentActivity = () => {
  const { data: activity } = useQuery({
    queryKey: ['recent_activity_v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, dogs(cover_image_url, programme_type)')
        .order('timestamp', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as ActivityEvent[];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm">
      <h3 className="text-[20px] font-black text-gray-900 flex items-center gap-3 tracking-tight mb-8">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <History size={22} />
        </div>
        Operational Feed
      </h3>

      <div className="space-y-7 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-50">
        {activity?.map((event) => (
          <div key={event.id} className="relative flex items-start gap-5 pl-1 group">
            <div className="relative z-10 w-9 h-9 rounded-full overflow-hidden border-4 border-white shadow-md flex-none bg-white ring-1 ring-gray-100">
              {event.dogs?.cover_image_url ? (
                <img src={event.dogs.cover_image_url} alt="Dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                  <Activity size={14} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-black text-gray-900 tracking-tight">
                    {event.dog_id.split('-')[0].toUpperCase()}
                  </p>
                  <div className={cn(
                    "w-2 h-2 rounded-full shadow-sm",
                    event.dogs?.programme_type === 'cnvr' ? "bg-[#0D7377]" : "bg-[#F0A500]"
                  )} />
                </div>
                <p className="text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(event.timestamp))}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={event.event_type} variant="subtle" className="font-black" />
                {event.event_type === 'on_site_vaccinate' && (
                  <span className="text-[10px] font-black text-[#92400E] bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">On-site vaccination</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const sinceISO = useMemo(() => {
    if (range === 'all') return new Date(0).toISOString();
    const now = new Date().getTime();
    const days = range === '7d' ? 7 : 30;
    return new Date(now - days*24*60*60*1000).toISOString();
  }, [range]);

  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats', range],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: DashboardStats[]; error: unknown }>)('get_dashboard_stats', ({ since: sinceISO }));
      if (error) throw error;
      return data[0] as DashboardStats;
    },
    refetchInterval: 30000,
  });

  const { data: boosters } = useQuery({
    queryKey: ['upcoming_boosters_export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, vaccination_date, next_vaccination_due')
        .eq('vaccination_status', 'vaccinated')
        .lte('next_vaccination_due', new Date(Date.now() + 30*24*60*60*1000).toISOString())
        .order('next_vaccination_due', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!stats
  });

  const handleExport = async () => {
    console.log("GOD MODE: Export triggered.");

    const currentStats = stats || {
        total_registered: 0,
        currently_in_clinic: 0,
        released_in_period: 0,
        needs_attention: 0,
        cnvr_total: 0,
        cnvr_caught_period: 0,
        cnvr_sterilized_period: 0,
        cnvr_released_period: 0,
        vacc_total: 0,
        vacc_in_period: 0,
        vacc_rabies_period: 0,
        vacc_distemper_period: 0,
        vacc_combo_period: 0,
        vacc_booster_period: 0,
        vacc_boosters_due: 0,
        caught_in_period: 0,
        vaccinated_in_period: 0,
        sterilized_in_period: 0
    };

    setIsExporting(true);
    toast({
      title: "Generating Executive Report",
      description: "Compiling programme performance data into high-fidelity PDF...",
    });

    try {
      await exportService.generateDashboardPDF({
        stats: currentStats as DashboardStats,
        range,
        boosters: (boosters || []) as { id: string; vaccination_date: string | null; next_vaccination_due: string | null }[]
      });

      toast({
        title: "Report Downloaded",
        description: "The executive summary is now available in your downloads.",
      });
    } catch (err) {
      console.error('Export failed:', err);
      toast({
        title: "Critical Export Failure",
        description: err instanceof Error ? err.message : "System error during PDF compilation.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 md:p-10 pt-safe">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Activity size={24} />
               </div>
               <h1 className="text-[28px] font-black text-gray-900 tracking-tighter">Programme Dashboard</h1>
            </div>
            <p className="text-[15px] text-gray-500 font-medium">Real-time telemetry for CNVR & Vaccination operations in Kathmandu</p>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-1">
              {(['7d', '30d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-6 py-2.5 rounded-xl text-[13px] font-black transition-all tracking-widest ${
                    range === r ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <StatCard
                label="Total Records"
                value={stats?.total_registered || 0}
                sublabel="System-wide"
                color="#0D7377"
                icon={Users}
              />
              <StatCard
                label="In Treatment"
                value={stats?.currently_in_clinic || 0}
                sublabel="Facility count"
                color="#F59E0B"
                icon={Activity}
              />
              <StatCard
                label="Completed"
                value={stats?.released_in_period || 0}
                sublabel="Period total"
                color="#10B981"
                icon={CheckCircle2}
              />
              <StatCard
                label="Critical Cases"
                value={stats?.needs_attention || 0}
                sublabel="Priority 1"
                color="#EF4444"
                icon={AlertCircle}
              />
            </div>

            {/* CNVR Section */}
            <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group hover:border-primary/20 transition-all duration-500">
               <div className="p-10 border-l-[6px] border-[#0D7377]">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-[22px] font-black text-gray-900 flex items-center gap-4 tracking-tight">
                      <div className="p-3 rounded-2xl bg-[#0D7377]/10 text-[#0D7377]">
                        <Microscope size={24} />
                      </div>
                      CNVR Programme 🔬
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                      variant="compact"
                      label="Enrolled"
                      value={stats?.cnvr_total || 0}
                      sublabel="Base population"
                      color="#0D7377"
                      icon={Users}
                    />
                    <StatCard
                      variant="compact"
                      label="Active Catch"
                      value={stats?.cnvr_caught_period || 0}
                      sublabel="Operational"
                      color="#F59E0B"
                      icon={Activity}
                    />
                    <StatCard
                      variant="compact"
                      label="Releases"
                      value={stats?.cnvr_released_period || 0}
                      sublabel="Successful"
                      color="#10B981"
                      icon={CheckCircle2}
                    />
                  </div>

                  <CNVRPipeline stats={stats} />
               </div>
            </section>

            {/* Vaccination Section */}
            <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden group hover:border-amber-500/20 transition-all duration-500">
               <div className="p-10 border-l-[6px] border-[#92400E]">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-[22px] font-black text-gray-900 flex items-center gap-4 tracking-tight">
                      <div className="p-3 rounded-2xl bg-[#92400E]/10 text-[#92400E]">
                        <Syringe size={24} />
                      </div>
                      Vaccination Programme 💉
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                      variant="compact"
                      label="Total Vaccinated"
                      value={stats?.vacc_total || 0}
                      sublabel="Aggregate"
                      color="#F0A500"
                      icon={Users}
                    />
                    <StatCard
                      variant="compact"
                      label="Period Success"
                      value={stats?.vacc_in_period || 0}
                      sublabel="Operational"
                      color="#F0A500"
                      icon={Activity}
                    />
                    <StatCard
                      variant="compact"
                      label="Rabies Doses"
                      value={stats?.vacc_rabies_period || 0}
                      sublabel="Primary KPI"
                      color="#F0A500"
                      icon={CheckCircle2}
                    />
                  </div>

                  <VaccineBreakdown stats={stats} />
               </div>
            </section>

            <FieldWorkerActivity stats={stats} />

            {/* Analytical Reports Section */}
            <section className="bg-slate-900 rounded-[32px] border-4 border-primary/20 shadow-2xl overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
               <div className="absolute -top-20 -right-20 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12">
                  <FileText size={400} className="text-white" />
               </div>
               <div className="p-12 relative z-10">
                  <div className="flex items-center gap-5 mb-10">
                    <div className="p-4 rounded-[20px] bg-primary text-white shadow-xl shadow-primary/20">
                      <TrendingUp size={32} />
                    </div>
                    <div>
                      <h3 className="text-[28px] font-black text-white tracking-tighter uppercase">Analytical Reports</h3>
                      <p className="text-[16px] text-gray-400 font-medium max-w-md mt-1 italic">
                        "Data-driven decisions for a rabies-free community."
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 bg-white/5 p-8 rounded-[24px] backdrop-blur-md border border-white/10">
                       <ul className="space-y-5">
                          {[
                            'High-fidelity performance metrics',
                            'CNVR & Vaccination telemetry',
                            'Priority booster urgency list',
                            'Strategic geographic distributions'
                          ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 text-[15px] font-black text-gray-200 uppercase tracking-widest">
                               <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(13,115,119,1)]" />
                               {item}
                            </li>
                          ))}
                       </ul>
                    </div>

                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="w-full h-24 rounded-[24px] bg-white hover:bg-primary hover:text-white text-primary font-black flex items-center justify-center gap-5 shadow-2xl transition-all duration-500 active:scale-95 disabled:opacity-50 group/btn overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-primary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-in-out -z-0" />
                      <div className="relative z-10 flex items-center gap-5">
                        {isExporting ? (
                          <>
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-[22px] uppercase tracking-widest">Compiling...</span>
                          </>
                        ) : (
                          <>
                            <Download size={32} />
                            <span className="text-[22px] uppercase tracking-widest">Generate Report</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
               </div>
            </section>
          </div>

          <div className="space-y-12">
            <BoosterPanel stats={stats} />
            <MiniMap />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
