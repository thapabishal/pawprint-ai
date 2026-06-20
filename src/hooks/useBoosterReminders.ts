import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BoosterReminder } from '@/types';

export function useBoosterReminders() {
  return useQuery({
    queryKey: ['booster-reminders'],
    queryFn: async (): Promise<BoosterReminder[]> => {
      // First update statuses
      await supabase.rpc('update_booster_statuses');

      const { data, error } = await (supabase
        .from('booster_reminders') as any)
        .select('*, dogs(cover_image_url, visual_tags, programme_type), vaccination_event:events(vaccine_type, timestamp)')
        .in('status', ['pending', 'due_soon', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as unknown as BoosterReminder[];
    },
  });
}

export function useOverdueCount() {
  return useQuery({
    queryKey: ['overdue-count'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await (supabase
        .from('booster_reminders') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'overdue');

      if (error) throw error;
      return data?.length || 0;
    },
    // Refetch periodically or based on certain actions
    refetchInterval: 30000,
  });
}

export function useDismissReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reminderId, reason }: { reminderId: string; reason: string }) => {
      const { error } = await (supabase
        .from('booster_reminders') as any)
        .update({ status: 'dismissed', notes: reason })
        .eq('id', reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booster-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-count'] });
    },
  });
}
