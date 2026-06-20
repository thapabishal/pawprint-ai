/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogWithStatus, DogEvent } from '@/types';

export function useDog(dogId: string | undefined) {
  return useQuery({
    queryKey: ['dog', dogId],
    queryFn: async (): Promise<DogWithStatus> => {
      if (!dogId) throw new Error('Dog ID is required');

      // Casting the from call to any to bypass Supabase's complex type inference failure with joins
      const { data, error } = await (supabase
        .from('dogs')
        .select(`
          *,
          events (*),
          dog_images (*)
        `) as any)
        .eq('id', dogId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Dog not found');

      // Sort events by timestamp ascending
      const sortedEvents = (data.events || []).sort(
        (a: DogEvent, b: DogEvent) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Determine current status from last event
      const currentStatus = sortedEvents.length > 0
        ? sortedEvents[sortedEvents.length - 1].event_type
        : 'unknown';

      // Parse locations
      const catchEvent = data.events?.find((e: DogEvent) => e.event_type === 'catch' || e.event_type === 'on_site_vaccinate');
      const catchLocation = catchEvent?.location
        ? {
            lat: ((catchEvent.location as unknown as { coordinates: number[] }).coordinates[1]),
            lng: ((catchEvent.location as unknown as { coordinates: number[] }).coordinates[0])
          }
        : null;

      return {
        ...data,
        events: sortedEvents,
        images: data.dog_images || [],
        current_status: currentStatus,
        last_updated: sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].timestamp : data.updated_at,
        catch_location: catchLocation,
      } as DogWithStatus;
    },
    enabled: !!dogId,
    staleTime: 30000,
  });
}
