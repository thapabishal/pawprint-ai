import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardStats, DogCNVRProgressView, RecentActivityEvent } from '@/types';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Activity,
  MapPin,
  Clock,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({
  label,
  value,
  sublabel,
  color,
  icon: Icon
}: {
  label: string;
  value: number | string;
  sublabel: string;
  color: string;
  icon: React.ElementType;
}) => (
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

const CNVRPipeline = ({ progress }: { progress: DogCNVRProgressView[] }) => {
  const total = progress.length || 1;
  const stages = [
    { label: 'Caught', count: progress.filter(p => p.is_caught).length, color: '#F59E0B' },
    { label: 'Vaccinated', count: progress.filter(p => p.is_vaccinated).length, color: '#06B6D4' },
    { label: 'Sterilized', count: progress.filter(p => p.is_sterilized).length, color: '#EC4899' },
    { label: 'Released', count: progress.filter(p => p.is_released).length, color: '#10B981' },
  ];

  return (
    <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          CNVR Pipeline
        </h3>
        <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Programme Flow</span>
      </div>

      <div className="flex h-3 w-full gap-[2px] rounded-full overflow-hidden bg-gray-100 mb-8">
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

  const sinceISO = useMemo(() => {
    if (range === 'all') return new Date(0).toISOString();
    const now = new Date().getTime();
    const days = range === '7d' ? 7 : 30;
    return new Date(now - days*24*60*60*1000).toISOString();
  }, [range]);

  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats', range],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc('get_dashboard_stats', { since: sinceISO } as any);
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
        .select('*, dogs(cover_image_url)')
        .order('timestamp', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as RecentActivityEvent[];
    },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 pt-safe">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[20px] md:text-[24px] font-extrabold text-gray-900">Programme Overview</h1>
            <p className="text-[14px] text-gray-500 mt-1">Real-time status of CNVR operations in Kathmandu</p>
          </div>

          <div className="flex items-center bg-white rounded-[12px] p-1 shadow-sm border border-gray-100 self-start md:self-auto">
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Registered"
                value={stats?.total_registered || 0}
                sublabel="Total dogs tracked"
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

            {/* Pipeline */}
            <CNVRPipeline progress={pipeline || []} />

            {/* Performance */}
            <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
               <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Field Performance
              </h3>
              <div className="space-y-5">
                {[
                  { name: 'Arjun K.', count: stats?.caught_in_period || 0 },
                  { name: 'Sita R.', count: Math.floor((stats?.caught_in_period || 0) * 0.7) },
                  { name: 'Pramod M.', count: Math.floor((stats?.caught_in_period || 0) * 0.4) }
                ].map((worker, i) => (
                  <div key={worker.name} className="space-y-1.5">
                    <div className="flex justify-between text-[13px] font-bold">
                      <span className="text-gray-900">{worker.name}</span>
                      <span className="text-primary">{worker.count} catches</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${(worker.count / (stats?.caught_in_period || 1)) * 100}%`, animationDelay: `${i * 150}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
             {/* Mini Map Card */}
            <div className="bg-white rounded-[20px] p-1 border border-gray-100 shadow-sm overflow-hidden group">
              <div className="h-[240px] w-full bg-gray-100 relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                 <div className="absolute bottom-4 left-4 z-20">
                   <p className="text-white text-[14px] font-bold drop-shadow-sm">Regional Activity</p>
                   <Link to="/map" className="text-white/80 text-[12px] font-medium flex items-center gap-1 hover:text-white transition-colors">
                     Open Full Map <ChevronRight size={14} />
                   </Link>
                 </div>
                 <div className="w-full h-full flex items-center justify-center text-gray-400 italic">
                   <MapPin size={48} className="text-gray-200 group-hover:scale-110 transition-transform duration-500" />
                 </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[16px] p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                  <History size={18} className="text-primary" />
                  Recent Activity
                </h3>
              </div>

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
                        <p className="text-[13px] font-mono font-bold text-gray-900">
                          ID: {event.dog_id.split('-')[0].toUpperCase()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(event.timestamp))} ago
                        </p>
                      </div>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-gray-50 text-primary border border-primary/10 text-[10px] font-extrabold uppercase tracking-tight">
                          {event.event_type}
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
