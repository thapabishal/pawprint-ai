import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogWithStatus, GeoPoint, DogEvent, DogImage, EventType, Sex, AgeGroup, Condition, SterilizationStatus, VisualTags } from '@/types';
import type { Database } from '@/lib/database.types';

type DbEvent = Database['public']['Tables']['events']['Row'];

export const useDog = (dogId: string | undefined) => {
  return useQuery({
    queryKey: ['dog', dogId],
    queryFn: async (): Promise<DogWithStatus> => {
      if (!dogId) throw new Error('Dog ID is required');

      const { data, error } = await supabase
        .from('dogs')
        .select('*, events(*), dog_images(*)')
        .eq('id', dogId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Dog not found');

      // Sort events ascending
      const rawEvents = (data.events as unknown as DbEvent[]) || [];
      const sortedEvents = [...rawEvents].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Parse PostGIS coordinates for events
      const parsedEvents: DogEvent[] = sortedEvents.map((event) => {
        let location: GeoPoint | null = null;
        if (event.location) {
          try {
            const loc = typeof event.location === 'string' ? JSON.parse(event.location) : (event.location as unknown as { coordinates: number[] });
            if (loc && loc.coordinates) {
              location = {
                lat: loc.coordinates[1],
                lng: loc.coordinates[0],
              };
            }
          } catch (e) {
            console.error('Error parsing location', e);
          }
        }
        return {
          id: event.id,
          dog_id: event.dog_id,
          event_type: event.event_type as EventType,
          location,
          location_accuracy: event.location_accuracy,
          handler_name: event.handler_name,
          notes: event.notes,
          confirmed_match: event.confirmed_match,
          timestamp: event.timestamp
        };
      });

      const current_status = parsedEvents.length > 0
        ? parsedEvents[parsedEvents.length - 1].event_type
        : 'observation';

      const catch_event = parsedEvents.find((e) => e.event_type === 'catch');

      return {
        id: data.id,
        sex: data.sex as Sex,
        age_group: data.age_group as AgeGroup,
        condition: data.condition as Condition,
        sterilization_status: data.sterilization_status as SterilizationStatus,
        visual_tags: (data.visual_tags as unknown as VisualTags) || {},
        cover_image_url: data.cover_image_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        events: parsedEvents,
        images: (data.dog_images as unknown as DogImage[]) || [],
        current_status,
        last_updated: data.updated_at,
        catch_location: catch_event?.location || null,
      };
    },
    enabled: !!dogId,
    staleTime: 30000,
  });
};
