import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchRow {
  dog_id: string;
  distance_metres: number;
  similarity_score?: number;
  current_status?: string;
  last_updated?: string;
  catch_location?: {
    type: "Point";
    coordinates: [number, number];
  } | null;
}

interface DogEvent {
  event_type: string;
  timestamp: string;
  location: {
    coordinates: [number, number];
  } | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY') || '';
    const aiEnabled = Deno.env.get('AI_ENABLED') === 'true';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json();
    const { image_base64, current_lat, current_lng, radius_metres = 2000 } = body;

    if (!current_lat || !current_lng) {
      throw new Error('Missing location data');
    }

    let matches: MatchRow[] = [];
    let method = 'gps+tags';
    let isAiSuccess = false;

    // V2: AI Enabled
    if (aiEnabled && image_base64 && hfApiKey) {
      try {
        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/BVRA/MegaDescriptor-L-384",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: image_base64 }),
          }
        );

        if (hfResponse.ok) {
          const embedding = await hfResponse.json();

          if (Array.isArray(embedding) && embedding.length === 768) {
            const { data: vectorMatches, error: vectorError } = await supabase.rpc('match_dogs_vector', {
              p_embedding: embedding,
              p_lat: current_lat,
              p_lng: current_lng,
              p_match_threshold: 0.3,
              p_match_count: 10
            });

            if (!vectorError && vectorMatches) {
              matches = vectorMatches as MatchRow[];
              method = 'ai+gps+tags';
              isAiSuccess = true;
            }
          }
        }
      } catch (err) {
        console.error('AI Processing error, falling back to GPS:', err);
      }
    }

    // V1 Fallback: GPS+Tags
    if (!isAiSuccess) {
      const { data: gpsMatches, error: gpsError } = await supabase.rpc('find_nearby_catches', {
        lat: current_lat,
        lng: current_lng,
        radius_metres
      });

      if (gpsError) throw gpsError;
      matches = (gpsMatches || []) as MatchRow[];
    }

    // Format results
    const results = await Promise.all(matches.map(async (m: MatchRow) => {
      const { data: dogData } = await supabase
        .from('dogs')
        .select(`
          *,
          images:dog_images(*),
          events(*)
        `)
        .eq('id', m.dog_id)
        .single();

      if (!dogData) return null;

      // Tag overlap scoring (placeholder)
      const tagOverlapScore = 0.0;

      // GPS Score: 1 - (distance / radius) capped at 0-1
      const gpsScore = Math.max(0, 1 - (m.distance_metres / radius_metres));

      // Composite Score calculation based on identified logic
      const compositeScore = isAiSuccess
        ? ((m.similarity_score || 0) * 0.7) + (gpsScore * 0.3)
        : (gpsScore * 0.7) + (tagOverlapScore * 0.3);

      const events = (dogData.events || []) as DogEvent[];
      const latestEvent = events.length > 0
        ? [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        : null;
      const catchEvent = events.find((e) => e.event_type === 'catch');

      return {
        dog: {
          ...dogData,
          current_status: m.current_status || latestEvent?.event_type || 'unknown',
          last_updated: m.last_updated || latestEvent?.timestamp || dogData.updated_at,
          catch_location: m.catch_location
            ? { lat: m.catch_location.coordinates[1], lng: m.catch_location.coordinates[0] }
            : catchEvent?.location
              ? { lat: catchEvent.location.coordinates[1], lng: catchEvent.location.coordinates[0] }
              : null
        },
        similarity_score: m.similarity_score || null,
        gps_distance_metres: m.distance_metres || 0,
        tag_overlap_score: tagOverlapScore,
        composite_score: compositeScore
      };
    }));

    const finalResults = results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.composite_score - a.composite_score);

    return new Response(
      JSON.stringify({
        matches: finalResults,
        method,
        ai_enabled: isAiSuccess
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
