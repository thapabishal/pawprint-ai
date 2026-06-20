import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { GPS_SEARCH_RADIUS_KM, GPS_SEARCH_RADIUS_EXPANDED_KM } from '@/lib/constants';
import type {
  GeoPoint,
  MatchResult,
  DogWithStatus,
  Sex,
  AgeGroup,
  Condition,
  SterilizationStatus,
  VisualTags,
  EventType,
  DogEvent,
  ProgrammeType,
  VaccinationStatus,
  VaccineType
} from '@/types';
import type { Database } from '@/lib/database.types';

type RawNearbyCatch = Database['public']['Functions']['find_nearby_catches']['Returns'][number];
type RawDogRow = Database['public']['Tables']['dogs']['Row'];
type RawEventRow = Database['public']['Tables']['events']['Row'];

interface RawDogWithEvents extends RawDogRow {
  events: RawEventRow[];
}

export const useIdentify = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const identifyDog = useCallback(async (location: GeoPoint | null) => {
    if (!location) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let radius = GPS_SEARCH_RADIUS_KM * 1000;
      const { data, error: searchError } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: RawNearbyCatch[] | null, error: Error | null }>)('find_nearby_catches', {
        lat: location.lat,
        lng: location.lng,
        radius_metres: radius
      });

      if (searchError) throw searchError;

      let finalData = data;

      if (!finalData || finalData.length === 0) {
        radius = GPS_SEARCH_RADIUS_EXPANDED_KM * 1000;
        const { data: expandedData, error: expandedError } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: RawNearbyCatch[] | null, error: Error | null }>)('find_nearby_catches', {
          lat: location.lat,
          lng: location.lng,
          radius_metres: radius
        });
        if (expandedError) throw expandedError;
        finalData = expandedData;
      }

      if (finalData) {
        const mappedResults: MatchResult[] = finalData.map((item) => {
          const gps_score = Math.max(0, Math.min(1, 1 - (item.distance_metres / radius)));
          const tag_overlap = 0; // V2: collect clinic dog tags before search
          const composite_score = gps_score * 0.7 + tag_overlap * 0.3;

          const catchEvent: DogEvent = {
            id: item.event_id,
            dog_id: item.dog_id,
            event_type: 'catch',
            location: null,
            location_accuracy: item.location_accuracy,
            handler_name: item.handler_name,
            notes: item.notes,
            confirmed_match: true,
            timestamp: item.catch_timestamp
          };

          const dog: DogWithStatus = {
            id: item.dog_id,
            sex: item.sex as Sex,
            age_group: item.age_group as AgeGroup,
            condition: item.condition as Condition,
            sterilization_status: item.sterilization_status as SterilizationStatus,
            visual_tags: (item.visual_tags as unknown) as VisualTags,
            cover_image_url: item.cover_image_url,
            created_at: item.catch_timestamp,
            updated_at: item.catch_timestamp,
            current_status: item.current_status as EventType,
            last_updated: item.catch_timestamp,
            catch_location: null,
            images: [],
            events: [catchEvent],
            programme_type: 'cnvr' as ProgrammeType, // Default for nearby catches in search context
            vaccination_status: 'unknown' as VaccinationStatus,
            vaccination_date: null,
            next_vaccination_due: null
          };

          return {
            dog,
            similarity_score: null,
            gps_distance_metres: item.distance_metres,
            tag_overlap_score: tag_overlap,
            composite_score
          };
        });

        const sortedResults = mappedResults
          .sort((a, b) => b.composite_score - a.composite_score)
          .slice(0, 5);

        setResults(sortedResults);
      } else {
        setResults([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDogById = useCallback(async (dogId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('dogs')
        .select(`
          *,
          events (*)
        `)
        .eq('id', dogId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const rawDog = data as unknown as RawDogWithEvents;
        const sortedEvents = [...(rawDog.events || [])].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const current_status = sortedEvents[0]?.event_type || 'unknown';

        const dog: DogWithStatus = {
          id: rawDog.id,
          sex: rawDog.sex as Sex,
          age_group: rawDog.age_group as AgeGroup,
          condition: rawDog.condition as Condition,
          sterilization_status: rawDog.sterilization_status as SterilizationStatus,
          visual_tags: (rawDog.visual_tags as unknown) as VisualTags,
          cover_image_url: rawDog.cover_image_url,
          created_at: rawDog.created_at,
          updated_at: rawDog.updated_at,
          current_status: current_status as EventType,
          last_updated: sortedEvents[0]?.timestamp || rawDog.updated_at,
          catch_location: null,
          images: [],
          programme_type: rawDog.programme_type as ProgrammeType,
          vaccination_status: rawDog.vaccination_status as VaccinationStatus,
          vaccination_date: rawDog.vaccination_date,
          next_vaccination_due: rawDog.next_vaccination_due,
          events: (rawDog.events || []).map((e) => ({
            ...e,
            event_type: e.event_type as EventType,
            vaccine_type: e.vaccine_type as VaccineType | null,
            location: null
          }))
        };

        const result: MatchResult = {
          dog,
          similarity_score: null,
          gps_distance_metres: 0,
          tag_overlap_score: 0,
          composite_score: 1.0
        };

        setResults([result]);
        return result;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  const manualSearch = useCallback(async (searchTerm: string, tags?: VisualTags) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('dogs')
        .select(`
          *,
          events (*)
        `);

      if (searchTerm) {
        query = query.ilike('id', `%${searchTerm}%`);
      }

      if (tags) {
        if (tags.ears) query = query.eq('visual_tags->>ears', tags.ears);
        if (tags.coat) query = query.eq('visual_tags->>coat', tags.coat);
      }

      const { data, error: searchError } = await query.limit(10);
      if (searchError) throw searchError;

      if (data) {
        const rawDogs = data as unknown as RawDogWithEvents[];
        const mappedResults: MatchResult[] = rawDogs.map((item) => {
          const sortedEvents = [...(item.events || [])].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          const current_status = sortedEvents[0]?.event_type || 'unknown';

          const dog: DogWithStatus = {
            id: item.id,
            sex: item.sex as Sex,
            age_group: item.age_group as AgeGroup,
            condition: item.condition as Condition,
            sterilization_status: item.sterilization_status as SterilizationStatus,
            visual_tags: (item.visual_tags as unknown) as VisualTags,
            cover_image_url: item.cover_image_url,
            created_at: item.created_at,
            updated_at: item.updated_at,
            current_status: current_status as EventType,
            last_updated: sortedEvents[0]?.timestamp || item.updated_at,
            catch_location: null,
            images: [],
            programme_type: item.programme_type as ProgrammeType,
            vaccination_status: item.vaccination_status as VaccinationStatus,
            vaccination_date: item.vaccination_date,
            next_vaccination_due: item.next_vaccination_due,
            events: (item.events || []).map(e => ({
              ...e,
              event_type: e.event_type as EventType,
              vaccine_type: e.vaccine_type as VaccineType | null,
              location: null
            }))
          };

          return {
            dog,
            similarity_score: null,
            gps_distance_metres: 0,
            tag_overlap_score: 0,
            composite_score: 0.5
          };
        });

        setResults(mappedResults);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const releaseDog = useCallback(async (dogId: string, location: GeoPoint | null, accuracy: number | null, handlerName: string, notes: string) => {
    const { data, error: releaseError } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: string | null, error: Error | null }>)('log_release', {
      p_dog_id: dogId,
      p_lat: location?.lat,
      p_lng: location?.lng,
      p_location_accuracy: accuracy,
      p_handler_name: handlerName,
      p_notes: notes,
      p_confirmed_match: true
    });

    if (releaseError) throw releaseError;
    return data;
  }, []);

  const rejectMatch = useCallback(async (dogId: string) => {
    const { error: rejectError } = await (supabase.from('events') as unknown as { insert: (args: unknown) => Promise<{ error: Error | null }> }).insert({
      dog_id: dogId,
      event_type: 'observation',
      notes: 'rejected_match:' + dogId,
      timestamp: new Date().toISOString(),
      confirmed_match: false
    });

    if (rejectError) throw rejectError;
  }, []);

  return {
    loading,
    results,
    error,
    identifyDog,
    fetchDogById,
    manualSearch,
    releaseDog,
    rejectMatch
  };
};
