import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  Stethoscope,
  Layout,
  RefreshCcw,
  Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserProfile, FieldWorkerStats, UserRole } from '@/types';
import UserCard from '@/components/admin/UserCard';
import AddUserGuide from '@/components/admin/AddUserGuide';

const AdminPage: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<FieldWorkerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      setUsers(userData as UserProfile[]);

      // Fetch stats for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: statsData, error: statsError } = await supabase
        .rpc('get_field_worker_stats', { since: thirtyDaysAgo.toISOString() });

      if (statsError) throw statsError;
      setStats(statsData as FieldWorkerStats[]);
    } catch (error: unknown) {
      console.error('Error fetching admin data:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error fetching data",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast({
        title: currentStatus ? "Account deactivated" : "Account reactivated",
        description: `User is now ${!currentStatus ? 'active' : 'inactive'}.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const roleCounts = {
    field_worker: users.filter(u => u.role === 'field_worker').length,
    clinic_vet: users.filter(u => u.role === 'clinic_vet').length,
    programme_manager: users.filter(u => u.role === 'programme_manager').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  // Activity chart data: top 10 most active users
  const activeStats = [...stats]
    .sort((a, b) => b.total_events - a.total_events)
    .slice(0, 10);

  const maxEvents = activeStats.length > 0 ? Math.max(...activeStats.map(s => s.total_events)) : 0;

  const roleColors: Record<UserRole, string> = {
    field_worker: 'bg-emerald-500',
    clinic_vet: 'bg-purple-500',
    programme_manager: 'bg-amber-500',
    admin: 'bg-red-500',
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-lg border-b border-border/40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Settings className="text-primary" size={24} />
              Team Management
            </h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">PawPrint AI V3 Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn("h-10 w-10 rounded-full transition-transform", refreshing && "animate-spin")}
              onClick={fetchData}
              disabled={refreshing}
            >
              <RefreshCcw size={18} />
            </Button>
            <Button
              className="h-10 px-4 rounded-full font-bold gap-2"
              onClick={() => setShowGuide(!showGuide)}
            >
              <Plus size={18} />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {showGuide && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-300">
            <AddUserGuide />
          </section>
        )}

        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-none bg-white shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Field Workers</span>
                </div>
                <p className="text-3xl font-black">{roleCounts.field_worker}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-white shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Stethoscope size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Clinic Vets</span>
                </div>
                <p className="text-3xl font-black">{roleCounts.clinic_vet}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-white shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Layout size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Managers</span>
                </div>
                <p className="text-3xl font-black">{roleCounts.programme_manager}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-white shadow-sm rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <Users size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Team</span>
                </div>
                <p className="text-3xl font-black">{users.length}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold">Team Members</h2>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{users.length} Total</span>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                stats={stats.find(s => s.user_id === user.id)}
                isSelf={user.id === profile?.id}
                onUpdateRole={handleUpdateRole}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </section>

        {/* Activity Chart */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold">Team Activity</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
              <BarChart3 size={12} />
              Last 30 Days
            </div>
          </div>

          <Card className="border-none bg-white shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              {activeStats.length > 0 ? (
                <div className="space-y-6">
                  {activeStats.map((userStats) => {
                    const width = maxEvents > 0 ? (userStats.total_events / maxEvents) * 100 : 0;
                    const initials = userStats.full_name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <div key={userStats.user_id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {userStats.avatar_url ? (
                              <img src={userStats.avatar_url} className="h-6 w-6 rounded-full" alt="" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                {initials}
                              </div>
                            )}
                            <span className="font-bold text-xs truncate max-w-[120px]">{userStats.full_name}</span>
                          </div>
                          <span className="font-black text-xs">{userStats.total_events} events</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-1000", roleColors[userStats.role] || 'bg-primary')}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <div className="flex gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                          <span>{userStats.catches} catches</span>
                          <span>{userStats.vaccinations} vaccines</span>
                          <span>{userStats.releases} releases</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <BarChart3 size={24} />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">No activity recorded in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
