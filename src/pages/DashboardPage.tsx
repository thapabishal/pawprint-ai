import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  History,
  Clock,
  MapPin,
  ChevronRight,
  Download,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays, isBefore } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  DashboardStats,
  RecentActivityEventWithHandler,
  FieldWorkerStats,
  DogCNVRProgressView,
  ProgrammeType
} from '@/types';
import { exportDashboardToPDF } from '@/lib/exportService';

const StatCard: React.FC<{
  label: string;
  value: number;
  sublabel: string;
  color: string;
  icon: React.ElementType;
  prefix?: string;
}> = ({ label, value, sublabel, color, icon: Icon, prefix }) => (
  <div className="bg-white rounded-[16px] p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
    <div
      className="absolute top-0 left-0 w-full h-1"
      style={{ backgroundColor: color }}
    />
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-[12px]" style={{ backgroundColor: `${color}10` }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    <p className="text-[13px] font-bold text-gray-500 uppercase tracking-tight">{label}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <h2 className="text-[28px] font-black text-gray-900 leading-none">
        {prefix}{value.toLocaleString()}
      </h2>
    </div>
    <p className="text-[12px] font-medium text-gray-400 mt-2 flex items-center gap-1">
      {sublabel}
    </p>
  </div>
);

const CNVRPipeline: React.FC<{ progress: DogCNVRProgressView[] }> = ({ progress }) => {
  const total = progress.length || 1;
  const stages: { label: string; count: number; color: string }[] = [
    { label: 'Caught', count: progress.filter(p => p.is_caught).length, color: '#0D7377' },
    { label: 'Sterilized', count: progress.filter(p => p.is_sterilized).length, color: '#0F8D91' },
    { label: 'Vaccinated', count: progress.filter(p => p.is_vaccinated).length, color: '#12A7AB' },
    { label: 'Released', count: progress.filter(p => p.is_released).length, color: '#10B981' }
  ];

  return (
    <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
          <Activity size={18} className="text-[#0D7377]" />
          CNVR Pipeline Progress
        </h3>
      </div>

      <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 mb-8">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className="h-full transition-all duration-700"
            style={{
              width: `${(stage.count / total) * 100}%`,
              backgroundColor: stage.color,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

const UserActivityCard: React.FC<{ worker: FieldWorkerStats; rank: number; maxEvents: number }> = ({ worker, rank, maxEvents }) => {
  const rankColors: Record<number, string> = {
    1: "#F0A500", // Gold
    2: "#9CA3AF", // Silver
    3: "#CD7F32", // Bronze
  };
  const rankColor = rankColors[rank] || "#E5E7EB";
  const progressWidth = maxEvents > 0 ? (worker.total_events / maxEvents) * 100 : 0;

  return (
    <div className="group relative bg-white p-4 rounded-[16px] border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-center gap-4 mb-3">
        <div
          className="flex-none w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white"
          style={{ backgroundColor: rankColor }}
        >
          {rank}
        </div>
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-50">
          {worker.avatar_url ? (
            <img src={worker.avatar_url} alt={worker.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-gray-400">
              {worker.full_name.split(" ").map((n: string) => n[0]).join("")}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[14px] font-bold text-gray-900 truncate">{worker.full_name}</h4>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-tight">
              {worker.role.replace("_", " ")}
            </span>
          </div>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">
            {worker.catches} catches · {worker.vaccinations} vaccinations · {worker.releases} releases
          </p>
        </div>
        <div className="text-right flex-none">
          <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-tighter">
            Active {formatDistanceToNow(new Date(worker.last_active))} ago
          </p>
        </div>
      </div>
      <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0D7377] rounded-full transition-all duration-1000"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');
  const navigate = useNavigate();

  const sinceISO = useMemo(() => {
    if (range === 'all') return new Date(0).toISOString();
    const now = new Date().getTime();
    const days = range === '7d' ? 7 : 30;
    return new Date(now - days*24*60*60*1000).toISOString();
  }, [range]);

  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats', range],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_dashboard_stats', { since: sinceISO });
      if (error) throw error;
      return data[0] as DashboardStats;
    },
    refetchInterval: 30000,
  });

  const { data: pipeline } = useQuery({
    queryKey: ['cnvr_progress'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dog_cnvr_progress').select('*');
      if (error) throw error;
      return data as DogCNVRProgressView[];
    },
    refetchInterval: 30000,
  });

  const { data: activity } = useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, dogs(cover_image_url, programme_type), handler:user_profiles(full_name, avatar_url, role)')
        .order('timestamp', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as RecentActivityEventWithHandler[];
    },
    refetchInterval: 30000,
  });

  const { data: fieldWorkerStats } = useQuery({
    queryKey: ["field_worker_stats", sinceISO],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_field_worker_stats", { since: sinceISO });
      if (error) throw error;
      return data as FieldWorkerStats[];
    },
    refetchInterval: 30000,
  });

  const { data: boosters } = useQuery({
    queryKey: ['upcoming_boosters'],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('dogs')
        .select('id, cover_image_url, vaccination_date, next_vaccination_due, catch_notes')
        .eq('vaccination_status', 'vaccinated')
        .lte('next_vaccination_due', thirtyDaysFromNow)
        .order('next_vaccination_due', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: dogLocations } = useQuery({
    queryKey: ['dog_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dog_current_status')
        .select('dog_id, programme_type, catch_location');
      if (error) throw error;
      return data as unknown as { dog_id: string; programme_type: ProgrammeType; catch_location: unknown }[];
    },
  });

  const parseLocation = (loc: unknown): [number, number] | null => {
    if (!loc) return null;
    let coords: { coordinates: [number, number] } | null;
    if (typeof loc === 'string') {
      try {
        coords = JSON.parse(loc);
      } catch { return null; }
    } else {
      coords = loc as { coordinates: [number, number] };
    }
    if (coords && coords.coordinates) {
      return [coords.coordinates[1], coords.coordinates[0]];
    }
    return null;
  };

  const handleExport = () => {
    if (stats) {
      exportDashboardToPDF(stats, range);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-black text-gray-900 tracking-tight">Operations Center</h1>
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">PawPrint AI • Kathmandu Valley</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex bg-gray-50 p-1 rounded-[14px] border border-gray-100">
              {(['7d', '30d', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRange(t)}
                  className={`px-4 py-2 rounded-[11px] text-[12px] font-bold transition-all ${
                    range === t ? 'bg-white text-[#0D7377] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="p-2.5 bg-[#0D7377] text-white rounded-[14px] hover:bg-[#095a5d] transition-all shadow-md active:scale-95"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Registered"
            value={stats?.total_registered || 0}
            sublabel="Dogs in database"
            color="#0D7377"
            icon={CheckCircle2}
          />
          <StatCard
            label="Active Cases"
            value={stats?.currently_in_clinic || 0}
            sublabel="Currently in clinic"
            color="#F0A500"
            icon={Activity}
          />
          <StatCard
            label="Released"
            value={stats?.released_in_period || 0}
            sublabel="Released this period"
            color="#10B981"
            icon={CheckCircle2}
          />
          <StatCard
            label="Urgent"
            value={stats?.needs_attention || 0}
            sublabel="Health critical"
            color="#EF4444"
            icon={AlertCircle}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CNVRPipeline progress={pipeline || []} />

            {/* Vaccination Boosters */}
            <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                  <Activity size={18} className="text-[#F0A500]" />
                  Booster Reminders
                </h3>
                <span className="px-2.5 py-1 bg-amber-50 text-[#92400E] rounded-full text-[11px] font-black uppercase tracking-tight">
                  {boosters?.length || 0} Due Soon
                </span>
              </div>

              <div className="p-2">
                {boosters && boosters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {boosters.map((dog) => {
                      const typedDog = dog as any;
                      const due = new Date(typedDog.next_vaccination_due || 0);
                      const diff = differenceInDays(due, new Date());
                      const isOverdue = isBefore(due, new Date());
                      const dateColor = isOverdue ? '#DC2626' : diff <= 7 ? '#D97706' : '#0D7377';

                      return (
                        <div
                          key={typedDog.id}
                          onClick={() => navigate(`/dogs/${typedDog.id}`)}
                          className="flex items-center gap-3 p-3 rounded-[18px] hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                        >
                          <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-gray-100 flex-none relative">
                            {typedDog.cover_image_url ? (
                              <img src={typedDog.cover_image_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                               <Activity size={16} />
                             </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate uppercase">
                              ID: {typedDog.id.split('-')[0]}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isOverdue && <AlertTriangle size={12} className="text-red-600" />}
                              <p className="text-[12px] font-medium" style={{ color: dateColor }}>
                                {isOverdue
                                  ? `Overdue ${Math.abs(diff)} days`
                                  : `Due: ${format(due, 'MMM d, yyyy')}`}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-[#10B981] font-bold text-[14px]">All vaccinations up to date ✓</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-50">
                <button
                  onClick={() => navigate('/catch', { state: { defaultProgramme: 'vaccination', defaultVaccineType: 'booster' } })}
                  className="w-full py-2.5 rounded-[12px] border-2 border-[#0D7377] text-[#0D7377] text-[13px] font-bold hover:bg-[#0D737708] transition-colors"
                >
                  Schedule Booster Camp
                </button>
              </div>
            </section>

            {/* Team Activity Section */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-[#0D7377]" />
                  Team Activity
                </h3>
                <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    {range === "7d" ? "Past 7 Days" : range === "30d" ? "Past 30 Days" : "All Time"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {fieldWorkerStats ? (
                  <>
                    {fieldWorkerStats.slice(0, 5).sort((a, b) => b.total_events - a.total_events).map((worker, index) => (
                      <UserActivityCard
                        key={worker.user_id}
                        worker={worker}
                        rank={index + 1}
                        maxEvents={Math.max(...fieldWorkerStats.map(u => u.total_events), 0)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-20">
                    <Users size={48} />
                    <p className="text-[14px] font-bold">No activity recorded yet</p>
                  </div>
                )}
              </div>

              {(profile?.role === "admin" || profile?.role === "programme_manager") && (
                <Link
                  to="/admin"
                  className="mt-6 flex items-center justify-center gap-1.5 w-full py-3 rounded-[12px] bg-gray-50 text-[13px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  View all team <ChevronRight size={14} />
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-8">
             {/* Coverage Map Section */}
            <div className="bg-white rounded-[20px] p-1 border border-gray-100 shadow-sm overflow-hidden group">
              <div className="h-[240px] w-full relative z-0">
                <MapContainer
                  center={[27.7172, 85.3240]}
                  zoom={12}
                  zoomControl={false}
                  scrollWheelZoom={false}
                  dragging={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {dogLocations?.map(dog => {
                    const pos = parseLocation(dog.catch_location);
                    if (!pos) return null;
                    return (
                      <CircleMarker
                        key={dog.dog_id}
                        center={pos}
                        radius={4}
                        fillColor={dog.programme_type === 'vaccination' ? '#F0A500' : '#0D7377'}
                        color="#fff"
                        weight={1}
                        fillOpacity={0.8}
                      />
                    );
                  })}
                </MapContainer>
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                    <p className="text-[12px] font-bold text-gray-900 flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#0D7377]" />
                      Programme Coverage
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 z-10">
                   <Link to="/map" className="bg-white px-4 py-2 rounded-full text-[12px] font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform">
                     Open Map <ChevronRight size={14} />
                   </Link>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0D7377] />
                  <span className="text-[11px] font-bold text-gray-500 uppercase">CNVR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F0A500]" />
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Vaccination</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                  <History size={18} className="text-[#0D7377]" />
                  Recent Activity
                </h3>
              </div>

              <div className="space-y-6 relative before:absolute before:left-[16px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                {activity?.map((event) => (
                  <div key={event.id} className="relative flex items-start gap-4 pl-1">
                    <div className="relative z-10 w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-none bg-gray-100">
                      {event.dogs?.cover_image_url ? (
                        <img src={event.dogs.cover_image_url} alt="Dog profile thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                          <Activity size={12} />
                        </div>
                      )}
                      {/* Programme Badge Dot */}
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                          event.dogs?.programme_type === 'vaccination' ? 'bg-[#F0A500]' : 'bg-[#0D7377]'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-[13px] font-mono font-bold text-gray-900">
                          ID: {event.dog_id.split('-')[0].toUpperCase()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(event.timestamp))} ago
                        </p>
                      </div>
                      <div className="mt-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight border ${
                            event.event_type === 'on_site_vaccinate'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-gray-50 text-[#0D7377] border-[#0D737710]'
                          }`}>
                            {event.event_type === 'on_site_vaccinate' ? '💉 On-site vaccination' : event.event_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 border border-gray-50 flex-none">
                            {event.handler?.avatar_url ? (
                              <img src={event.handler.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
                                {(event.handler?.full_name || event.handler_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-gray-500">
                            by {event.handler?.full_name || event.handler_name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
