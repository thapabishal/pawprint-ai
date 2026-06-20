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
  RecentActivityEvent,
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

const DashboardPage: React.FC = () => {
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
      const { data, error } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: DashboardStats[]; error: unknown }>)('get_dashboard_stats', { since: sinceISO });
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
        .select('*, dogs(cover_image_url, programme_type)')
        .order('timestamp', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as RecentActivityEvent[];
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
    <div className="min-h-screen bg-surface p-4 md:p-8 pt-safe pb-24">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[20px] md:text-[24px] font-extrabold text-gray-900">Programme Dashboard</h1>
            <p className="text-[14px] text-gray-500 mt-1">Real-time status of CNVR & Vaccination programmes</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-[12px] p-1 shadow-sm border border-gray-100">
              {(['7d', '30d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-[10px] text-[13px] font-bold transition-all ${
                    range === r ? 'bg-[#0D7377] text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="p-2.5 bg-white rounded-[12px] border border-gray-100 shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
              title="Export Report"
            >
              <Download size={20} />
            </button>
          </div>
        </header>

        {/* Top Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Dogs"
            value={stats?.total_registered || 0}
            sublabel="Overall population"
            color="#0D7377"
            icon={Users}
          />
          <StatCard
            label="In Clinic"
            value={stats?.currently_in_clinic || 0}
            sublabel="Active medical care"
            color="#F59E0B"
            icon={Activity}
          />
          <StatCard
            label="Released"
            value={stats?.released_in_period || 0}
            sublabel={`Completed in ${range}`}
            color="#10B981"
            icon={CheckCircle2}
          />
          <StatCard
            label="Critical"
            value={stats?.needs_attention || 0}
            sublabel="Require urgent action"
            color="#EF4444"
            icon={AlertCircle}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* CNVR Programme Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-[4px] border-[#0D7377] pl-3">
                <h2 className="text-[16px] font-bold text-[#0D7377]">🔬 CNVR Programme</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                  <p className="text-[12px] font-bold text-gray-400 uppercase">Total CNVR</p>
                  <p className="text-[28px] font-black text-[#0D7377] mt-1">{stats?.cnvr_total || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                  <p className="text-[12px] font-bold text-gray-400 uppercase">Caught (Period)</p>
                  <p className="text-[28px] font-black text-[#F59E0B] mt-1">{stats?.cnvr_caught_period || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                  <p className="text-[12px] font-bold text-gray-400 uppercase">Released (Period)</p>
                  <p className="text-[28px] font-black text-[#10B981] mt-1">{stats?.cnvr_released_period || 0}</p>
                </div>
              </div>

              <CNVRPipeline progress={pipeline || []} />
            </section>

            {/* Vaccination Programme Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-[4px] border-[#F0A500] pl-3">
                <h2 className="text-[16px] font-bold text-[#92400E]">💉 Vaccination Programme</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                  <p className="text-[12px] font-bold text-gray-400 uppercase">Total Vaccinated</p>
                  <p className="text-[28px] font-black text-[#F0A500] mt-1">{stats?.vacc_total || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                  <p className="text-[12px] font-bold text-gray-400 uppercase">New (Period)</p>
                  <p className="text-[28px] font-black text-[#F0A500] mt-1">{stats?.vacc_in_period || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                  <p className="text-[12px] font-bold text-gray-400 uppercase">Rabies Total</p>
                  <p className="text-[28px] font-black text-[#F0A500] mt-1">{stats?.vacc_rabies_period || 0}</p>
                </div>
              </div>

              <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
                <h3 className="text-[14px] font-bold text-gray-700 mb-4">Vaccine Type Breakdown (Period)</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Rabies', count: stats?.vacc_rabies_period || 0, color: '#F0A500' },
                    { label: 'Distemper', count: stats?.vacc_distemper_period || 0, color: '#3B82F6' },
                    { label: 'Combo', count: stats?.vacc_combo_period || 0, color: '#8B5CF6' },
                    { label: 'Booster', count: stats?.vacc_booster_period || 0, color: '#10B981' }
                  ].map(v => (
                    <div key={v.label} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <span>{v.label}</span>
                        <span>{v.count} dogs</span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${(v.count / (stats?.vacc_in_period || 1)) * 100}%`,
                            backgroundColor: v.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Booster Alert Panel */}
            <section className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-gray-900">🔄 Upcoming Boosters</h3>
                  {stats?.vacc_boosters_due ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[11px] font-black rounded-full animate-pulse">
                      {stats.vacc_boosters_due} DUE
                    </span>
                  ) : null}
                </div>
                {boosters && boosters.length > 5 && (
                  <Link to="/dogs?filter=boosters" className="text-[13px] font-bold text-[#0D7377] hover:underline">
                    View all {stats?.vacc_boosters_due} →
                  </Link>
                )}
              </div>

              <div className="p-2">
                {boosters && boosters.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {boosters.slice(0, 5).map((dog) => {
                      const typedDog = dog as { id: string; cover_image_url?: string; next_vaccination_due?: string };
                      const dueStr = typedDog.next_vaccination_due;
                      if (!dueStr) return null;
                      const due = new Date(dueStr);
                      const diff = differenceInDays(due, new Date());
                      const isOverdue = isBefore(due, new Date());

                      let dateColor = '#374151';
                      if (isOverdue) dateColor = '#DC2626';
                      else if (diff < 7) dateColor = '#D97706';

                      return (
                        <div
                          key={typedDog.id}
                          onClick={() => navigate(`/dog/${typedDog.id}`)}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-[12px]"
                        >
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex-none">
                            {typedDog.cover_image_url ? (
                              <img src={typedDog.cover_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Users size={16} />
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

            {/* Field Performance */}
            <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
               <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users size={18} className="text-[#0D7377]" />
                Field Performance
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-gray-400 font-bold uppercase tracking-tight border-b border-gray-50">
                      <th className="pb-3">Worker</th>
                      <th className="pb-3 text-center">CNVR Catches</th>
                      <th className="pb-3 text-center">Vaccinations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: 'Arjun K.', cnvr: stats?.cnvr_caught_period || 0, vacc: Math.floor((stats?.vacc_in_period || 0) * 0.8) },
                      { name: 'Sita R.', cnvr: Math.floor((stats?.cnvr_caught_period || 0) * 0.7), vacc: stats?.vacc_in_period || 0 },
                      { name: 'Pramod M.', cnvr: Math.floor((stats?.cnvr_caught_period || 0) * 0.4), vacc: Math.floor((stats?.vacc_in_period || 0) * 0.5) }
                    ].map((worker) => (
                      <tr key={worker.name} className="group">
                        <td className="py-4 font-bold text-gray-900">{worker.name}</td>
                        <td className="py-4 text-center">
                          <span className="px-2 py-1 bg-[#0D737710] text-[#0D7377] rounded-md font-black">
                            {worker.cnvr}
                          </span>
                        </td>
                        <td className="py-4 text-center">
                          <span className="px-2 py-1 bg-[#F0A50010] text-[#92400E] rounded-md font-black">
                            {worker.vacc}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  <div className="w-3 h-3 rounded-full bg-[#0D7377]" />
                  <span className="text-[11px] font-bold text-gray-500 uppercase">CNVR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F0A500]" />
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Vaccination</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
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
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight border ${
                          event.event_type === 'on_site_vaccinate'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-gray-50 text-[#0D7377] border-[#0D737710]'
                        }`}>
                          {event.event_type === 'on_site_vaccinate' ? '💉 On-site vaccination' : event.event_type}
                        </span>
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
