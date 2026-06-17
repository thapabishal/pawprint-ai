-- ============================================================
-- PawPrint AI — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Run this in Supabase Dashboard → SQL Editor
-- Run each block in order. Do not skip any block.
-- ============================================================


-- ============================================================
-- BLOCK 1: EXTENSIONS
-- These must be enabled before creating any tables.
-- PostGIS handles GPS coordinates and radius search.
-- pgvector handles AI embeddings (null in V1, used in V2).
-- uuid-ossp generates unique IDs automatically.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extensions loaded correctly
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension failed to load. Enable it in Supabase Dashboard → Database → Extensions first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension failed to load. Enable it in Supabase Dashboard → Database → Extensions first.';
  END IF;
  RAISE NOTICE 'All extensions loaded successfully.';
END $$;


-- ============================================================
-- BLOCK 2: ENUM TYPES
-- Define allowed values for key columns.
-- Using CHECK constraints instead of Postgres ENUM types
-- so we can add values later without a table migration.
-- ============================================================

-- No separate ENUM types needed — we use TEXT + CHECK constraints
-- This makes future value additions (e.g. new event types) simple ALTER TABLE calls


-- ============================================================
-- BLOCK 3: CORE TABLE — dogs
-- One row per individual dog registered in the system.
-- This is the identity record. Status is derived from events.
-- Never delete rows — use a 'deceased' event type instead.
-- ============================================================

CREATE TABLE IF NOT EXISTS dogs (
  -- Primary key: UUID generated automatically
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic vitals — captured in the Catch flow via tap-to-select
  sex                   TEXT NOT NULL DEFAULT 'unknown'
                        CHECK (sex IN ('male', 'female', 'unknown')),

  age_group             TEXT NOT NULL DEFAULT 'unknown'
                        CHECK (age_group IN ('puppy', 'adult', 'senior', 'unknown')),

  condition             TEXT NOT NULL DEFAULT 'unknown'
                        CHECK (condition IN ('healthy', 'injured', 'critical', 'unknown')),

  sterilization_status  TEXT NOT NULL DEFAULT 'unknown'
                        CHECK (sterilization_status IN ('intact', 'sterilized', 'unknown')),

  -- Visual tags: stored as JSON for flexibility
  -- Shape: {
  --   "ears": "prick" | "semi_floppy" | "fully_floppy" | "cropped" | "torn_notched",
  --   "coat": "red_brown" | "black" | "white" | "grey" | "brindle" | "mixed",
  --   "markings": ["white_chest", "white_paws", "black_mask", "sickle_tail", "curled_tail"]
  -- }
  -- Any key can be absent (not recorded). Never store null — use empty object {}.
  visual_tags           JSONB NOT NULL DEFAULT '{}',

  -- URL of the primary photo (set after first image upload)
  -- NULL until catch photo is uploaded successfully
  cover_image_url       TEXT,

  -- Timestamps (UTC)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update the updated_at timestamp on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dogs_updated_at
  BEFORE UPDATE ON dogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE dogs IS 'Core identity record for each registered community dog. One row per dog, never deleted.';
COMMENT ON COLUMN dogs.visual_tags IS 'JSON object: ears (string), coat (string), markings (string[]). Keys absent if not recorded.';
COMMENT ON COLUMN dogs.cover_image_url IS 'Public URL to primary catch photo in Supabase Storage. NULL until first image uploaded.';


-- ============================================================
-- BLOCK 4: LIFECYCLE TABLE — events
-- Every thing that happens to a dog is an event.
-- This table is APPEND-ONLY. Never UPDATE or DELETE rows.
-- The most recent event determines the dog current status.
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  -- Primary key
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to dogs
  dog_id              UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,

  -- What happened
  -- catch        = first registration by field worker
  -- vaccinate    = vaccination administered at clinic
  -- sterilize    = sterilization procedure completed
  -- recover      = post-surgery recovery period started
  -- release      = dog returned to original territory
  -- observation  = field note without catch (also used for rejected match logging)
  event_type          TEXT NOT NULL
                      CHECK (event_type IN (
                        'catch',
                        'vaccinate',
                        'sterilize',
                        'recover',
                        'release',
                        'observation'
                      )),

  -- GPS location where this event occurred
  -- PostGIS geometry: POINT(longitude latitude) in WGS84 (EPSG:4326)
  -- NULL if GPS was unavailable at time of event
  -- IMPORTANT: PostGIS stores as POINT(lng lat) — note longitude comes first
  location            GEOMETRY(Point, 4326),

  -- GPS accuracy in metres (from browser Geolocation API)
  -- NULL if GPS unavailable. Values: <20m = good, 20-50m = moderate, >50m = poor
  location_accuracy   FLOAT,

  -- Who performed this action (field worker name, free text)
  -- NULL if not recorded
  handler_name        TEXT,

  -- Free text for anything relevant:
  -- Caretaker: "Ram Dai at blue gate, +977-9841xxxxxx"
  -- Landmark: "Near Swayambhu main gate, north side"
  -- Medical: "Limps on left rear leg, healing well"
  -- Rejection: "rejected_match:dog-uuid-here" (used for ML training data)
  notes               TEXT,

  -- TRUE when a vet manually confirms this dog matches a catch record at release
  -- Only set on release events. Used to distinguish confirmed from auto-logged releases.
  confirmed_match     BOOLEAN NOT NULL DEFAULT FALSE,

  -- When this event occurred (UTC)
  -- Defaults to now() but can be set manually if logging a past event
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Append-only lifecycle log. Every dog interaction is an event. Never update or delete rows.';
COMMENT ON COLUMN events.location IS 'PostGIS POINT geometry in WGS84. Stored as POINT(longitude latitude). NULL if GPS unavailable.';
COMMENT ON COLUMN events.notes IS 'Free text field. Stores caretaker info, landmarks, medical notes, and rejected match references.';
COMMENT ON COLUMN events.confirmed_match IS 'TRUE on release events where the vet manually confirmed identity. Used for ML training data quality.';


-- ============================================================
-- BLOCK 5: IMAGES TABLE — dog_images
-- Stores photo metadata and (in V2) AI embeddings.
-- The actual image files live in Supabase Storage.
-- One dog can have many images across many events.
-- ============================================================

CREATE TABLE IF NOT EXISTS dog_images (
  -- Primary key
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Which dog this image belongs to
  dog_id      UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,

  -- Which event this image was taken at (catch, release, etc.)
  -- NULL if image was uploaded outside of an event context
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,

  -- Public URL in Supabase Storage
  -- Format: {SUPABASE_URL}/storage/v1/object/public/dog-images/{dog_id}/{filename}
  image_url   TEXT NOT NULL,

  -- TRUE if this is the primary display photo (used in lists, maps, match cards)
  -- Only one image per dog should have is_cover = TRUE
  is_cover    BOOLEAN NOT NULL DEFAULT FALSE,

  -- AI embedding vector — NULL in V1, populated by Edge Function in V2
  -- Dimension 768 matches MegaDescriptor-Large output
  -- Used by pgvector for cosine similarity search at release time
  embedding   vector(768),

  -- When this image was uploaded
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dog_images IS 'Photo metadata and AI embeddings. Actual files in Supabase Storage bucket dog-images.';
COMMENT ON COLUMN dog_images.embedding IS 'MegaDescriptor-Large 768D embedding. NULL in V1. Populated by match-dog Edge Function in V2.';
COMMENT ON COLUMN dog_images.is_cover IS 'Primary display photo. Only one per dog should be TRUE. Set during catch submission.';


-- ============================================================
-- BLOCK 6: INDEXES
-- Critical for performance. Run immediately after table creation.
-- Without these, radius searches and vector lookups will time out.
-- ============================================================

-- PostGIS spatial index for radius search in Identify flow
-- This makes "find all catches within 2km of this location" fast
-- Without this: full table scan on every identify query = very slow
CREATE INDEX IF NOT EXISTS idx_events_location
  ON events USING GIST (location);

-- Standard B-Tree indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_dog_id
  ON events(dog_id);

CREATE INDEX IF NOT EXISTS idx_events_event_type
  ON events(event_type);

CREATE INDEX IF NOT EXISTS idx_events_timestamp
  ON events(timestamp DESC);

-- Composite index for the most common dashboard query:
-- "give me all catch events, newest first"
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp
  ON events(event_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_dog_images_dog_id
  ON dog_images(dog_id);

CREATE INDEX IF NOT EXISTS idx_dog_images_event_id
  ON dog_images(event_id);

-- Cover image lookup (used in dog list, map markers)
CREATE INDEX IF NOT EXISTS idx_dog_images_cover
  ON dog_images(dog_id, is_cover)
  WHERE is_cover = TRUE;

-- HNSW vector index for AI embedding similarity search (V2)
-- Created NOW so no migration is needed when AI is enabled in V2
-- It is safe to have this index with all NULL embeddings — it simply stays empty
-- m=16, ef_construction=64: good balance of speed and accuracy for our dataset size
-- vector_cosine_ops: cosine distance matches how MegaDescriptor embeddings are compared
CREATE INDEX IF NOT EXISTS idx_dog_images_embedding
  ON dog_images USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for JSONB visual_tags queries
-- Enables fast filtering: WHERE visual_tags @> '{"coat": "red_brown"}'
-- Used in Identify fallback when searching by visual traits
CREATE INDEX IF NOT EXISTS idx_dogs_visual_tags
  ON dogs USING GIN (visual_tags);

-- Text search on notes (for manual search in Identify flow)
CREATE INDEX IF NOT EXISTS idx_events_notes_text
  ON events USING GIN (to_tsvector('english', COALESCE(notes, '')));


-- ============================================================
-- BLOCK 7: VIEWS
-- Pre-computed queries used throughout the app.
-- Views are read-only — never INSERT/UPDATE through a view.
-- ============================================================

-- Current status of each dog (derived from most recent event)
-- Used in: dog list, map markers, dog profile header
-- NOTE: DISTINCT ON requires ORDER BY the same column first
CREATE OR REPLACE VIEW dog_current_status AS
SELECT DISTINCT ON (e.dog_id)
  e.dog_id,
  e.event_type                          AS current_status,
  e.timestamp                           AS last_event_at,
  e.location                            AS last_event_location,
  e.notes                               AS last_notes,
  e.handler_name                        AS last_handler,
  d.sex,
  d.age_group,
  d.condition,
  d.sterilization_status,
  d.visual_tags,
  d.cover_image_url,
  d.created_at                          AS registered_at
FROM events e
JOIN dogs d ON d.id = e.dog_id
ORDER BY e.dog_id, e.timestamp DESC;

COMMENT ON VIEW dog_current_status IS 'Latest status per dog derived from most recent event. Read-only.';


-- CNVR pipeline progress per dog
-- Shows which lifecycle stages each dog has completed
-- Used in: programme manager dashboard
CREATE OR REPLACE VIEW dog_cnvr_progress AS
SELECT
  d.id                                                          AS dog_id,
  d.created_at                                                  AS registered_at,
  MAX(CASE WHEN e.event_type = 'catch'     THEN e.timestamp END) AS caught_at,
  MAX(CASE WHEN e.event_type = 'vaccinate' THEN e.timestamp END) AS vaccinated_at,
  MAX(CASE WHEN e.event_type = 'sterilize' THEN e.timestamp END) AS sterilized_at,
  MAX(CASE WHEN e.event_type = 'release'   THEN e.timestamp END) AS released_at,
  -- TRUE/FALSE pipeline stages
  COUNT(CASE WHEN e.event_type = 'catch'     THEN 1 END) > 0   AS is_caught,
  COUNT(CASE WHEN e.event_type = 'vaccinate' THEN 1 END) > 0   AS is_vaccinated,
  COUNT(CASE WHEN e.event_type = 'sterilize' THEN 1 END) > 0   AS is_sterilized,
  COUNT(CASE WHEN e.event_type = 'release'
    AND e.confirmed_match = TRUE              THEN 1 END) > 0   AS is_released,
  -- Days in clinic (from catch to release, or catch to now if not released)
  EXTRACT(DAY FROM (
    COALESCE(
      MAX(CASE WHEN e.event_type = 'release' THEN e.timestamp END),
      NOW()
    ) - MAX(CASE WHEN e.event_type = 'catch' THEN e.timestamp END)
  ))::INTEGER                                                    AS days_in_programme
FROM dogs d
LEFT JOIN events e ON e.dog_id = d.id
GROUP BY d.id, d.created_at;

COMMENT ON VIEW dog_cnvr_progress IS 'CNVR pipeline completion per dog. Used in programme manager dashboard.';


-- ============================================================
-- BLOCK 8: STORED FUNCTIONS
-- Called via supabase.rpc() from the React app.
-- These handle PostGIS queries that the JS client cannot do directly.
-- ============================================================

-- find_nearby_catches: used in the Identify flow
-- Returns catch events within radius_metres of a given GPS point
-- Sorted by distance (nearest first) for the match result list
-- Called via: supabase.rpc('find_nearby_catches', { lat, lng, radius_metres })
CREATE OR REPLACE FUNCTION find_nearby_catches(
  lat             FLOAT,
  lng             FLOAT,
  radius_metres   FLOAT DEFAULT 2000
)
RETURNS TABLE (
  dog_id              UUID,
  event_id            UUID,
  catch_timestamp     TIMESTAMPTZ,
  handler_name        TEXT,
  notes               TEXT,
  distance_metres     FLOAT,
  location_accuracy   FLOAT,
  -- Dog fields
  sex                 TEXT,
  age_group           TEXT,
  condition           TEXT,
  sterilization_status TEXT,
  visual_tags         JSONB,
  cover_image_url     TEXT,
  -- Current status
  current_status      TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.dog_id,
    e.id                                            AS event_id,
    e.timestamp                                     AS catch_timestamp,
    e.handler_name,
    e.notes,
    -- Distance in metres using geography cast for accurate Earth-surface distance
    ST_Distance(
      e.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    )                                               AS distance_metres,
    e.location_accuracy,
    d.sex,
    d.age_group,
    d.condition,
    d.sterilization_status,
    d.visual_tags,
    d.cover_image_url,
    -- Derive current status from most recent event for this dog
    (
      SELECT ev2.event_type
      FROM events ev2
      WHERE ev2.dog_id = e.dog_id
      ORDER BY ev2.timestamp DESC
      LIMIT 1
    )                                               AS current_status
  FROM events e
  JOIN dogs d ON d.id = e.dog_id
  WHERE
    e.event_type = 'catch'
    AND e.location IS NOT NULL
    -- ST_DWithin with geography = accurate spherical distance check
    AND ST_DWithin(
      e.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_metres
    )
  ORDER BY distance_metres ASC
  LIMIT 10;
$$;

COMMENT ON FUNCTION find_nearby_catches IS
  'Returns catch events near a GPS point, sorted by distance. Used by Identify flow.
   Call via: supabase.rpc("find_nearby_catches", { lat, lng, radius_metres: 2000 })';


-- create_catch_event: atomically creates dog + catch event + links them
-- Reduces round-trips from the app (3 separate inserts → 1 RPC call)
-- Called via: supabase.rpc('create_catch_event', { ... })
CREATE OR REPLACE FUNCTION create_catch_event(
  -- Dog fields
  p_sex                   TEXT DEFAULT 'unknown',
  p_age_group             TEXT DEFAULT 'unknown',
  p_condition             TEXT DEFAULT 'unknown',
  p_sterilization_status  TEXT DEFAULT 'unknown',
  p_visual_tags           JSONB DEFAULT '{}',
  -- Event fields
  p_lat                   FLOAT DEFAULT NULL,
  p_lng                   FLOAT DEFAULT NULL,
  p_location_accuracy     FLOAT DEFAULT NULL,
  p_handler_name          TEXT DEFAULT NULL,
  p_notes                 TEXT DEFAULT NULL
)
RETURNS TABLE (
  dog_id    UUID,
  event_id  UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_dog_id    UUID;
  v_event_id  UUID;
  v_location  GEOMETRY;
BEGIN
  -- Build location geometry if coordinates provided
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
  ELSE
    v_location := NULL;
  END IF;

  -- Insert dog record
  INSERT INTO dogs (sex, age_group, condition, sterilization_status, visual_tags)
  VALUES (p_sex, p_age_group, p_condition, p_sterilization_status, p_visual_tags)
  RETURNING id INTO v_dog_id;

  -- Insert catch event
  INSERT INTO events (
    dog_id, event_type, location, location_accuracy, handler_name, notes
  )
  VALUES (
    v_dog_id, 'catch', v_location, p_location_accuracy, p_handler_name, p_notes
  )
  RETURNING id INTO v_event_id;

  -- Return both IDs (app uses these to upload image and update cover_image_url)
  RETURN QUERY SELECT v_dog_id, v_event_id;
END;
$$;

COMMENT ON FUNCTION create_catch_event IS
  'Atomically creates a dog record + catch event. Reduces app-to-DB round trips.
   Call via: supabase.rpc("create_catch_event", { p_sex, p_age_group, ... })
   Returns: { dog_id, event_id } — use these to upload image to Storage.';


-- log_release: logs a release event and marks dog as returned
-- Called via: supabase.rpc('log_release', { ... })
CREATE OR REPLACE FUNCTION log_release(
  p_dog_id            UUID,
  p_lat               FLOAT DEFAULT NULL,
  p_lng               FLOAT DEFAULT NULL,
  p_location_accuracy FLOAT DEFAULT NULL,
  p_handler_name      TEXT DEFAULT NULL,
  p_notes             TEXT DEFAULT NULL,
  p_confirmed_match   BOOLEAN DEFAULT TRUE
)
RETURNS UUID  -- returns the new event ID
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_id  UUID;
  v_location  GEOMETRY;
BEGIN
  IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
    v_location := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
  ELSE
    v_location := NULL;
  END IF;

  INSERT INTO events (
    dog_id, event_type, location, location_accuracy,
    handler_name, notes, confirmed_match
  )
  VALUES (
    p_dog_id, 'release', v_location, p_location_accuracy,
    p_handler_name, p_notes, p_confirmed_match
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION log_release IS
  'Logs a release event. confirmed_match=TRUE when vet manually confirms identity.
   Call via: supabase.rpc("log_release", { p_dog_id, p_lat, p_lng, p_confirmed_match: true })';


-- get_dashboard_stats: aggregated counts for programme manager dashboard
-- Called via: supabase.rpc('get_dashboard_stats', { since })
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  since TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
  total_registered      BIGINT,
  currently_in_clinic   BIGINT,
  released_in_period    BIGINT,
  needs_attention       BIGINT,  -- condition = critical
  caught_in_period      BIGINT,
  vaccinated_in_period  BIGINT,
  sterilized_in_period  BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    -- Total dogs ever registered
    (SELECT COUNT(*) FROM dogs)                                           AS total_registered,

    -- Currently in clinic: most recent event is NOT release
    (
      SELECT COUNT(*)
      FROM dog_current_status
      WHERE current_status != 'release'
    )                                                                     AS currently_in_clinic,

    -- Released in the period
    (
      SELECT COUNT(DISTINCT dog_id)
      FROM events
      WHERE event_type = 'release'
        AND confirmed_match = TRUE
        AND timestamp >= since
    )                                                                     AS released_in_period,

    -- Needs attention: condition is critical
    (SELECT COUNT(*) FROM dogs WHERE condition = 'critical')              AS needs_attention,

    -- Activity counts for period
    (SELECT COUNT(*) FROM events WHERE event_type = 'catch'     AND timestamp >= since) AS caught_in_period,
    (SELECT COUNT(*) FROM events WHERE event_type = 'vaccinate' AND timestamp >= since) AS vaccinated_in_period,
    (SELECT COUNT(*) FROM events WHERE event_type = 'sterilize' AND timestamp >= since) AS sterilized_in_period;
$$;

COMMENT ON FUNCTION get_dashboard_stats IS
  'Aggregated programme statistics for dashboard. Call with "since" date for period filtering.
   Call via: supabase.rpc("get_dashboard_stats", { since: "2026-01-01T00:00:00Z" })';


-- ============================================================
-- BLOCK 9: ROW LEVEL SECURITY (RLS)
-- Controls who can read/write each table.
-- PILOT SETUP: open access for known field workers.
-- IMPORTANT: Replace with proper auth policies before public launch.
-- ============================================================

-- Enable RLS on all tables (required even for open access)
ALTER TABLE dogs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_images  ENABLE ROW LEVEL SECURITY;

-- PILOT POLICY: Allow all operations for anyone with the anon key
-- This is safe for a controlled pilot where only field workers have the URL
-- Replace with proper user-based policies for production launch
-- See SUPABASE_SETUP.md Section 5 for production RLS patterns

CREATE POLICY "pilot_allow_all_dogs"
  ON dogs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "pilot_allow_all_events"
  ON events FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "pilot_allow_all_dog_images"
  ON dog_images FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "pilot_allow_all_dogs" ON dogs IS
  'PILOT ONLY: Open access. Replace with auth.uid() based policies before public launch.';


-- ============================================================
-- BLOCK 10: STORAGE CONFIGURATION NOTE
-- Run the Storage setup in Supabase Dashboard, not SQL.
-- SQL cannot create Storage buckets — use the dashboard UI.
-- See SUPABASE_SETUP.md Section 4 for exact steps.
-- ============================================================

-- Placeholder comment — Storage bucket created via Dashboard
-- Bucket name: dog-images
-- Visibility: Public
-- Max file size: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp


-- ============================================================
-- BLOCK 11: VERIFICATION QUERIES
-- Run these after the migration to confirm everything is correct.
-- Every query should return the expected result in the comment.
-- ============================================================

-- Check 1: All three tables exist
-- Expected: 3 rows
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('dogs', 'events', 'dog_images')
ORDER BY table_name;

-- Check 2: PostGIS is working
-- Expected: 1 row with "OK"
SELECT 'OK' AS postgis_check
WHERE ST_AsText(ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326)) IS NOT NULL;

-- Check 3: pgvector is working
-- Expected: 1 row with a float
SELECT '[1,2,3]'::vector(3) <=> '[1,2,4]'::vector(3) AS vector_check;

-- Check 4: All indexes exist
-- Expected: 9+ rows
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('dogs', 'events', 'dog_images')
ORDER BY tablename, indexname;

-- Check 5: Both views exist
-- Expected: 2 rows
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('dog_current_status', 'dog_cnvr_progress')
ORDER BY viewname;

-- Check 6: All RPC functions exist
-- Expected: 4 rows
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'find_nearby_catches',
    'create_catch_event',
    'log_release',
    'get_dashboard_stats'
  )
ORDER BY routine_name;

-- Check 7: Test create_catch_event RPC
-- Expected: 1 row with two UUIDs
SELECT * FROM create_catch_event(
  p_sex => 'male',
  p_age_group => 'adult',
  p_condition => 'healthy',
  p_visual_tags => '{"ears": "prick", "coat": "red_brown"}',
  p_lat => 27.7172,
  p_lng => 85.3240,
  p_notes => 'TEST RECORD — delete after verification'
);
-- After verifying, delete the test record:
-- DELETE FROM dogs WHERE id IN (SELECT id FROM dogs WHERE cover_image_url IS NULL ORDER BY created_at DESC LIMIT 1);

-- ============================================================
-- MIGRATION COMPLETE
-- If all 7 verification queries returned expected results,
-- the database is ready for the PawPrint AI application.
-- Next step: follow SUPABASE_SETUP.md to configure Storage,
-- copy the project URL and anon key to .env.local, and
-- commit this file to supabase/migrations/ in your repo.
-- ============================================================
