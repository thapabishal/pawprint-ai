import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DogCurrentStatus, GeoPoint, EventType, Sex, AgeGroup, Condition, SterilizationStatus, VisualTags } from '@/types';

export const useDogs = (page: number = 0, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['dogs', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('dog_current_status')
        .select('*', { count: 'exact' })
        .order('last_event_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Parse PostGIS coordinates for catch_location and last_event_location
      const parsedData: DogCurrentStatus[] = (data || []).map((dog) => {
        let catch_location: GeoPoint | null = null;
        if (dog.catch_location) {
          try {
            const loc = typeof dog.catch_location === 'string' ? JSON.parse(dog.catch_location) : (dog.catch_location as unknown as { coordinates: number[] });
            if (loc && loc.coordinates) {
              catch_location = {
                lat: loc.coordinates[1],
                lng: loc.coordinates[0],
              };
            }
          } catch (e) {
            console.error('Error parsing catch location', e);
          }
        }

        let last_event_location: GeoPoint | null = null;
        if (dog.last_event_location) {
          try {
            const loc = typeof dog.last_event_location === 'string' ? JSON.parse(dog.last_event_location) : (dog.last_event_location as unknown as { coordinates: number[] });
            if (loc && loc.coordinates) {
              last_event_location = {
                lat: loc.coordinates[1],
                lng: loc.coordinates[0],
              };
            }
          } catch (e) {
            console.error('Error parsing last event location', e);
          }
        }

        return {
          dog_id: dog.dog_id,
          current_status: dog.current_status as EventType,
          last_event_at: dog.last_event_at,
          last_event_location,
          last_notes: dog.last_notes,
          last_handler: dog.last_handler,
          sex: dog.sex as Sex,
          age_group: dog.age_group as AgeGroup,
          condition: dog.condition as Condition,
          sterilization_status: dog.sterilization_status as SterilizationStatus,
          visual_tags: (dog.visual_tags as unknown as VisualTags) || {},
          cover_image_url: dog.cover_image_url,
          registered_at: dog.registered_at,
          catch_location,
          catch_location_accuracy: dog.catch_location_accuracy,
          catch_timestamp: dog.catch_timestamp,
          catch_handler: dog.catch_handler,
          catch_notes: dog.catch_notes,
        };
      });

      return {
        dogs: parsedData,
        totalCount: count || 0,
        hasMore: (count || 0) > to + 1,
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
};
