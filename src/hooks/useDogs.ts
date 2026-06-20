import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogCurrentStatusView } from '@/types';

export function useDogs(page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['dogs', page, pageSize],
    queryFn: async (): Promise<{ data: DogCurrentStatusView[]; count: number }> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('dog_current_status')
        .select('*', { count: 'exact' })
        .order('last_event_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: (data || []) as DogCurrentStatusView[],
        count: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
}
