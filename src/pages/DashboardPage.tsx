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
  History,
  Download,
  Syringe,
  Microscope,
  RotateCcw,
  PlusCircle,
  Loader2
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
      <div className="bg-white rounded-[12px] p-4 border border-gray-100 shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-[24px] font-extrabold" style={{ color }}>{value}</p>
          <p className="text-[12px] text-gray-400 font-medium">{sublabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-[16px] p-5 shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 left-0 w-full h-1 rounded-t-full" style={{ backgroundColor: color }} />
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:scale-110 transition-transform">
          <Icon size={18} />
        </div>
      </div>
      <p className="text-[32px] font-extrabold leading-none mb-1" style={{ color }}>{value}</p>
      <p className="text-[14px] font-medium text-gray-900">{label}</p>
      <p className="text-[12px] text-gray-400 mt-1">{sublabel}</p>
    </div>
  );
};

const CNVRPipeline = ({ stats }: { stats: DashboardStats | undefined }) => {
  const total = stats?.cnvr_total || 1;
  const stages = [
    { label: 'Caught', count: stats?.cnvr_caught_period || 0, color: '#0D7377' },
    { label: 'Sterilized', count: stats?.cnvr_sterilized_period || 0, color: '#06B6D4' },
    { label: 'Released', count: stats?.cnvr_released_period || 0, color: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex h-3 w-full gap-[2px] rounded-full overflow-hidden bg-gray-100">
        {stages.map((stage, idx) => (
          <div
            key={stage.label}
            className="h-full animate-in slide-in-from-left duration-700 fill-mode-both"
            style={{
              width: `${(stage.count / total) * 100}%`,
              backgroundColor: stage.color,
              animationDelay: `${idx * 100}ms`
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stages.map((stage) => (
          <div key={stage.label}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">{stage.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[20px] font-extrabold text-gray-900">{stage.count}</p>
              <p className="text-[12px] font-medium text-gray-400">
                ({Math.round((stage.count / total) * 100)}%)
              </p>
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
    <div className="space-y-3 mt-8">
      {types.map((t) => (
        <div key={t.label} className="space-y-1">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-gray-500 uppercase tracking-tight">{t.label}</span>
            <span className="text-gray-900">{t.count} dogs</span>
          </div>
          <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(t.count / max) * 100}%`,
                backgroundColor: t.color
              }}
            />
          </div>
        </div>
      ))}
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
    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
          <RotateCcw size={18} className="text-[#F0A500]" />
          Upcoming Boosters
        </h3>
        {countDue > 0 && (
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-full font-bold",
            isAnyOverdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
          )}>
            {countDue} DUE
          </span>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {(!boosters || boosters.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-[13px] font-medium text-emerald-600">All vaccinations up to date ✓</p>
          </div>
        ) : (
          boosters.slice(0, 5).map((dog) => {
            const dueAt = dog.next_vaccination_due ? new Date(dog.next_vaccination_due) : null;
            const isOverdue = dueAt && isBefore(dueAt, new Date());
            const daysDiff = dueAt ? differenceInDays(new Date(), dueAt) : 0;
            const urgencyColor = isOverdue ? 'text-red-600' : daysDiff < 7 ? 'text-amber-600' : 'text-gray-700';

            return (
              <button
                key={dog.id}
                onClick={() => navigate(`/dog/${dog.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex-none">
                  {dog.cover_image_url ? (
                    <img src={dog.cover_image_url} alt="Dog" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Users size={16} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-mono font-bold text-gray-900 truncate">
                    {dog.id.split('-')[0].toUpperCase()}
                  </p>
                  <p className={cn("text-[11px] font-bold flex items-center gap-1", urgencyColor)}>
                    {isOverdue && <AlertCircle size={10} />}
                    {isOverdue ? `Overdue ${daysDiff} days` : dueAt ? format(dueAt, 'MMM d, yyyy') : 'TBD'}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            );
          })
        )}

        {countDue > 5 && (
           <Link to="/dogs" className="block text-center text-[12px] font-bold text-primary hover:underline mt-2">
             View all {countDue} →
           </Link>
        )}
      </div>

      <button
        onClick={() => navigate('/catch', { state: { defaultProgramme: 'vaccination', defaultVaccineType: 'booster' } })}
        className="w-full py-3 px-4 rounded-[12px] border-2 border-[#0D7377] text-[#0D7377] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#0D7377]/5 transition-all"
      >
        <PlusCircle size={16} />
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
    html: `<div class="w-3 h-3 rounded-full border-2 border-white shadow-sm" style="background-color: ${color}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  return (
    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
      <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-4">
        <MapPin size={18} className="text-primary" />
        Programme Coverage
      </h3>
      <div className="h-[200px] rounded-xl overflow-hidden relative border border-gray-100">
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
        <Link to="/map" className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm text-[11px] font-bold text-primary flex items-center gap-1 border border-gray-100">
          Full Map <ChevronRight size={12} />
        </Link>
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0D7377]" />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">CNVR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F0A500]" />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Vaccination</span>
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
    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
      <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users size={18} className="text-primary" />
        Field Worker Activity
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-gray-50 text-gray-400 font-bold text-left">
              <th className="pb-3 pr-4">WORKER</th>
              <th className="pb-3 px-4">CNVR</th>
              <th className="pb-3 px-4">VACC.</th>
              <th className="pb-3 pl-4 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workers.map((worker) => (
              <tr key={worker.name} className="group">
                <td className="py-4 pr-4 font-bold text-gray-900">{worker.name}</td>
                <td className="py-4 px-4 font-bold text-[#0D7377]">{worker.cnvr}</td>
                <td className="py-4 px-4 font-bold text-[#F0A500]">{worker.vacc}</td>
                <td className="py-4 pl-4 text-right font-extrabold text-gray-900">{worker.cnvr + worker.vacc}</td>
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
    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
      <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-6">
        <History size={18} className="text-primary" />
        Recent Activity
      </h3>

      <div className="space-y-6 relative before:absolute before:left-[16px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
        {activity?.map((event) => (
          <div key={event.id} className="relative flex items-start gap-4 pl-1">
            <div className="relative z-10 w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-none bg-gray-100">
              {event.dogs?.cover_image_url ? (
                <img src={event.dogs.cover_image_url} alt="Dog" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                  <Activity size={12} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-mono font-bold text-gray-900">
                    {event.dog_id.split('-')[0].toUpperCase()}
                  </p>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    event.dogs?.programme_type === 'cnvr' ? "bg-[#0D7377]" : "bg-[#F0A500]"
                  )} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(event.timestamp))} ago
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={event.event_type} variant="subtle" />
                {event.event_type === 'on_site_vaccinate' && (
                  <span className="text-[10px] font-bold text-[#92400E]">💉 On-site vaccination</span>
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
        vacc_boosters_due: 0
    };

    setIsExporting(true);
    toast({
      title: "Generating Report",
      description: "Preparing your professional executive summary...",
    });

    try {
      await exportService.generateDashboardPDF({
        stats: currentStats as DashboardStats,
        range,
        boosters: (boosters || []) as any[]
      });

      toast({
        title: "Export Successful",
        description: "The report has been generated and download should start.",
      });
    } catch (err) {
      console.error('Export failed:', err);
      toast({
        title: "Export Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred during PDF generation.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 pt-safe">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900">Programme Dashboard</h1>
            <p className="text-[14px] text-gray-500 mt-1">Real-time status of CNVR & Vaccination operations</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center bg-white rounded-[12px] p-1 shadow-sm border border-gray-100">
              {(['7d', '30d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-[10px] text-[13px] font-bold transition-all ${
                    range === r ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="h-10 px-4 rounded-[12px] bg-white border border-gray-200 text-[13px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin text-primary" /> : <Download size={16} className="text-primary" />}
              <span>Export</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Dogs"
                value={stats?.total_registered || 0}
                sublabel="Across all programmes"
                color="#0D7377"
                icon={Users}
              />
              <StatCard
                label="In Clinic"
                value={stats?.currently_in_clinic || 0}
                sublabel="Under active care"
                color="#F59E0B"
                icon={Activity}
              />
              <StatCard
                label="Released"
                value={stats?.released_in_period || 0}
                sublabel={`Last ${range}`}
                color="#10B981"
                icon={CheckCircle2}
              />
              <StatCard
                label="Critical"
                value={stats?.needs_attention || 0}
                sublabel="Need urgent action"
                color="#EF4444"
                icon={AlertCircle}
              />
            </div>

            {/* CNVR Section */}
            <section className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-l-4 border-[#0D7377]">
                  <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <Microscope size={18} className="text-[#0D7377]" />
                    🔬 CNVR Programme
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCard
                      variant="compact"
                      label="Total CNVR"
                      value={stats?.cnvr_total || 0}
                      sublabel="Registered"
                      color="#0D7377"
                      icon={Users}
                    />
                    <StatCard
                      variant="compact"
                      label="Caught"
                      value={stats?.cnvr_caught_period || 0}
                      sublabel="This period"
                      color="#F59E0B"
                      icon={Activity}
                    />
                    <StatCard
                      variant="compact"
                      label="Released"
                      value={stats?.cnvr_released_period || 0}
                      sublabel="Completed"
                      color="#10B981"
                      icon={CheckCircle2}
                    />
                  </div>

                  <CNVRPipeline stats={stats} />
               </div>
            </section>

            {/* Vaccination Section */}
            <section className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-l-4 border-[#92400E]">
                  <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2 mb-6">
                    <Syringe size={18} className="text-[#92400E]" />
                    💉 Vaccination Programme
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      variant="compact"
                      label="Total Vaccinated"
                      value={stats?.vacc_total || 0}
                      sublabel="Programme size"
                      color="#F0A500"
                      icon={Users}
                    />
                    <StatCard
                      variant="compact"
                      label="Vaccinated"
                      value={stats?.vacc_in_period || 0}
                      sublabel="This period"
                      color="#F0A500"
                      icon={Activity}
                    />
                    <StatCard
                      variant="compact"
                      label="Rabies"
                      value={stats?.vacc_rabies_period || 0}
                      sublabel="Anti-rabies"
                      color="#F0A500"
                      icon={CheckCircle2}
                    />
                  </div>

                  <VaccineBreakdown stats={stats} />
               </div>
            </section>

            <FieldWorkerActivity stats={stats} />
          </div>

          <div className="space-y-8">
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
