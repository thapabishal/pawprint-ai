import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogCurrentStatusView, SortOption, ProgrammeFilter, StatusFilter } from '@/types';

export function useDogs(
  page = 0,
  pageSize = 20,
  filters: {
    programme: ProgrammeFilter;
    status: StatusFilter;
    search?: string;
  } = { programme: 'all', status: 'all' },
  sortBy: SortOption = 'newest'
) {
  return useQuery({
    queryKey: ['dogs', page, pageSize, filters, sortBy],
    queryFn: async (): Promise<{ data: DogCurrentStatusView[]; count: number }> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('dog_current_status')
        .select('*', { count: 'exact' });

      // Apply Programme Filter
      if (filters.programme !== 'all') {
        query = query.eq('programme_type', filters.programme);
      }

      // Apply Status Filter
      if (filters.status === 'clinic') {
        query = query.in('current_status', ['catch', 'vaccinate', 'sterilize', 'recover']);
      } else if (filters.status === 'released') {
        query = query.eq('current_status', 'release');
      } else if (filters.status === 'critical') {
        query = query.eq('condition', 'critical');
      } else if (filters.status === 'overdue') {
        query = query.lt('next_vaccination_due', new Date().toISOString());
      }

      // Apply Search Filter (if provided)
      if (filters.search) {
        query = query.or(`dog_id.ilike.%${filters.search}%,last_notes.ilike.%${filters.search}%`);
      }

      // Apply Sorting
      if (sortBy === 'newest') {
        query = query.order('registered_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('registered_at', { ascending: true });
      } else if (sortBy === 'activity') {
        query = query.order('last_event_at', { ascending: false });
      } else if (sortBy === 'boosters') {
        // Boosters due soonest: "only shows vaccination dogs, sorted by date" (AC #6)
        query = query.eq('programme_type', 'vaccination')
                     .not('next_vaccination_due', 'is', null)
                     .order('next_vaccination_due', { ascending: true });
      }

      const { data, error, count } = await query.range(from, to);

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
