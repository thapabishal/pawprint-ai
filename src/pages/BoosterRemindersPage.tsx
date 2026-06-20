import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  RefreshCw,
  CheckCircle2,

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoosterReminderCard } from '@/components/BoosterReminderCard';
import { DismissSheet } from '@/components/DismissSheet';
import { BoosterRemindersSkeleton } from '@/components/Skeletons';
import { useBoosterReminders } from '@/hooks/useBoosterReminders';
import { cn } from '@/lib/utils';
import type { BoosterReminder } from '@/types';

export const BoosterRemindersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: reminders, isLoading, refetch, isRefetching } = useBoosterReminders();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedReminder, setSelectedReminder] = useState<BoosterReminder | null>(null);
  const [isDismissOpen, setIsDismissOpen] = useState(false);

  const counts = useMemo(() => {
    if (!reminders) return { all: 0, overdue: 0, due_soon: 0, pending: 0 };
    return {
      all: reminders.length,
      overdue: reminders.filter(r => r.status === 'overdue').length,
      due_soon: reminders.filter(r => r.status === 'due_soon').length,
      pending: reminders.filter(r => r.status === 'pending').length,
    };
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    if (!reminders) return [];
    if (activeTab === 'all') return reminders;
    return reminders.filter(r => r.status === activeTab);
  }, [reminders, activeTab]);

  const handleDismiss = (reminder: BoosterReminder) => {
    setSelectedReminder(reminder);
    setIsDismissOpen(true);
  };

  if (isLoading) return <BoosterRemindersSkeleton />;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </Button>
            <h1 className="text-[20px] font-bold text-gray-900">💉 Booster Reminders</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className={cn("rounded-full hover:bg-gray-100", isRefetching && "animate-spin")}
          >
            <RefreshCw size={20} />
          </Button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-12 bg-gray-100/50 p-1 rounded-xl">
            <TabsTrigger
              value="all"
              className="flex-1 rounded-lg text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              className="flex-1 rounded-lg text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#EF4444]"
            >
              Overdue ({counts.overdue})
            </TabsTrigger>
            <TabsTrigger
              value="due_soon"
              className="flex-1 rounded-lg text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#F59E0B]"
            >
              Due Soon ({counts.due_soon})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="flex-1 rounded-lg text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Upcoming
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 pb-10">
        {filteredReminders.length > 0 ? (
          <div className="grid gap-4">
            {filteredReminders.map((reminder) => (
              <BoosterReminderCard
                key={reminder.id}
                reminder={reminder}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-[#10B981]" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">All vaccinations up to date</h3>
            <p className="text-[14px] text-gray-400 max-w-[240px]">
              No boosters due in the next 30 days for this filter.
            </p>
            {activeTab !== 'all' && (
              <Button
                variant="link"
                onClick={() => setActiveTab('all')}
                className="mt-4 text-[#0D7377] font-bold"
              >
                Show all reminders
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Dismiss Sheet */}
      <DismissSheet
        reminder={selectedReminder}
        isOpen={isDismissOpen}
        onClose={() => {
          setIsDismissOpen(false);
          setSelectedReminder(null);
        }}
      />
    </div>
  );
};

export default BoosterRemindersPage;
