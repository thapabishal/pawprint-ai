import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

export function useAuth() {
  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    },
    staleTime: Infinity, // Profile doesn't change often
  });
}
