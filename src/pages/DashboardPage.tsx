import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  Dog,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Syringe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from '@/components/Skeletons';
import type { DashboardStats, DogCNVRProgressView } from '@/types';

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      return data[0] as DashboardStats;
    },
  });

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['cnvr-pipeline'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dog_cnvr_progress').select('*');
      if (error) throw error;
      return data as DogCNVRProgressView[];
    },
  });

  if (statsLoading || pipelineLoading) return <DashboardSkeleton />;

  const pipelineCounts = pipeline?.reduce((acc, dog) => {
    if (dog.is_released) acc.released++;
    else if (dog.is_sterilized) acc.sterilized++;
    else if (dog.is_vaccinated) acc.vaccinated++;
    else if (dog.is_caught) acc.caught++;
    return acc;
  }, { caught: 0, vaccinated: 0, sterilized: 0, released: 0 }) || { caught: 0, vaccinated: 0, sterilized: 0, released: 0 };

  const pipelineData = [
    { label: 'Caught', count: pipelineCounts.caught, color: 'amber' },
    { label: 'Vaccinated', count: pipelineCounts.vaccinated, color: 'teal' },
    { label: 'Sterilized', count: pipelineCounts.sterilized, color: 'teal' },
    { label: 'Released', count: pipelineCounts.released, color: 'green' },
  ];

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
    <div className="min-h-screen bg-[#F9FAFB] pb-[160px]">
      {/* Header Section */}
      <header className="px-6 pt-10 pb-6 bg-white border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/5 rounded-full inline-block">
            Field Overview
          </span>
          <h1 className="text-[32px] font-extrabold text-dark tracking-tighter leading-none pt-2">
            Operations Center
          </h1>
          <p className="text-[14px] text-muted font-medium pt-1">Real-time status of Kathmandu CNVR</p>
        </motion.div>
      </header>

      <div className="px-5 pt-8 space-y-8">

        {/* Main Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
           <QuickStat
              label="Total Dogs"
              value={stats?.total_registered || 0}
              icon={<Dog className="w-5 h-5" />}
              color="teal"
           />
           <QuickStat
              label="Attention"
              value={stats?.needs_attention || 0}
              icon={<Zap className="w-5 h-5" />}
              color="red"
              pulse
           />
        </section>

        {/* Activity Highlight Card */}
        <section>
           <motion.div
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="relative overflow-hidden bg-dark p-6 rounded-[32px] shadow-elevated text-white"
           >
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                      <TrendingUp className="w-6 h-6 text-primary-light" />
                   </div>
                   <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">Today's Pulse</span>
                </div>
                <div className="space-y-1">
                   <h3 className="text-[28px] font-extrabold tracking-tight">+{stats?.caught_in_period || 0}</h3>
                   <p className="text-[14px] font-medium text-white/60">New dog registrations in this period</p>
                </div>
                <div className="pt-2 flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Vaccinated</span>
                      <span className="text-[15px] font-extrabold">{stats?.vaccinated_in_period || 0}</span>
                   </div>
                   <div className="w-[1px] h-8 bg-white/10 self-center" />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Sterilized</span>
                      <span className="text-[15px] font-extrabold">{stats?.sterilized_in_period || 0}</span>
                   </div>
                </div>
             </div>
           </motion.div>
        </section>

        {/* Pipeline Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[17px] font-extrabold text-dark tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                CNVR Pipeline
              </h3>
              <ArrowUpRight className="w-4 h-4 text-muted" />
           </div>

           <div className="bg-white rounded-[28px] p-6 shadow-card border border-border/40 space-y-6">
              {pipelineData.map((step, idx) => (
                <PipelineStep
                  key={step.label}
                  label={step.label}
                  count={step.count}
                  total={stats?.total_registered || 1}
                  color={step.color}
                  delay={idx * 0.1}
                />
              ))}
           </div>
        </section>

        {/* Vaccination Breakdown */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[17px] font-extrabold text-dark tracking-tight flex items-center gap-2">
                <Syringe className="w-4 h-4 text-accent" />
                Vaccination Trends
              </h3>
           </div>

           <div className="grid grid-cols-1 gap-3">
              <TrendCard label="Rabies" value={stats?.vacc_rabies_period || 0} icon={<Zap className="w-4 h-4" />} color="amber" />
              <TrendCard label="Field Vaccinated" value={stats?.vacc_in_period || 0} icon={<Activity className="w-4 h-4" />} color="blue" />
              <TrendCard label="Multi-Valent" value={stats?.cnvr_caught_period || 0} icon={<BarChart3 className="w-4 h-4" />} color="purple" />
           </div>
        </section>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon, color, pulse }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white p-5 rounded-[24px] shadow-card border border-border/40 flex flex-col gap-3"
  >
     <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center relative",
       color === 'teal' ? "bg-primary/10 text-primary" : "bg-red-50 text-red-500"
     )}>
        {icon}
        {pulse && <div className="absolute inset-0 rounded-2xl animate-ping bg-red-500/20" />}
     </div>
     <div className="space-y-0.5">
        <span className="text-[24px] font-extrabold text-dark tracking-tight">{value}</span>
        <span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block">{label}</span>
     </div>
  </motion.div>
);

const PipelineStep = ({ label, count, total, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="space-y-2"
  >
     <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-body capitalize">{label}</span>
        <span className="text-[13px] font-bold text-dark">{count}</span>
     </div>
     <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(count / total) * 100}%` }}
          transition={{ delay: delay + 0.2, duration: 1, ease: "circOut" }}
          className={cn("h-full rounded-full",
            color === 'green' ? "bg-green-500" : color === 'amber' ? "bg-amber-500" : "bg-primary"
          )}
        />
     </div>
  </motion.div>
);

const TrendCard = ({ label, value, icon, color }: any) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-[20px] border border-border/40 shadow-sm">
     <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
          color === 'amber' ? "bg-orange-50 text-orange-500" :
          color === 'blue' ? "bg-blue-50 text-blue-500" :
          "bg-purple-50 text-purple-500"
        )}>
          {icon}
        </div>
        <span className="text-[15px] font-bold text-dark">{label}</span>
     </div>
     <span className="text-[15px] font-extrabold text-dark">{value}</span>
  </div>
);

export default DashboardPage;
