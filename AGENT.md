# 🐾 PawPrint AI — Agent Context File
> Feed this file to your coding agent (Cursor, Windsurf, Claude Code) at the start of every session.
> It contains everything the agent needs to know about the project, stack, decisions, and rules.

---

## 1. WHAT THIS PROJECT IS

PawPrint AI is a **Progressive Web App (PWA)** for CNVR (Catch, Neuter, Vaccinate, Return) field workers in Nepal. It digitises the lifecycle of community street dogs — from first catch to final release — using GPS, photos, and structured records.

**The single most important principle:**
> The database IS the product. Every feature must work without AI. AI is an optional enhancement layer added only after a validation pilot. Never block core functionality on AI being present.

**What field workers actually do:**
1. Catch a dog → photograph it, tap physical traits, GPS auto-captures → record saved
2. Dog goes to clinic → vet needs to confirm which dog this is before release
3. Release → dog returned to exact catch territory → CNVR loop closed

---

## 2. USERS (Design for these people, not for demos)

| User | Device | Environment | Primary Need |
|------|--------|-------------|--------------|
| Field Worker | Budget Android (Redmi 10 class) | Outdoor, bright sun, one hand occupied | Catch record in < 90 seconds |
| Clinic Vet | Any phone/tablet | Indoor, good light, both hands free | Confirm dog identity at release |
| Programme Manager | Desktop browser | Office | Dashboard, coverage map, export |

**Non-negotiable UI constraints:**
- Every primary action must be reachable with **right thumb only**, phone held in one hand
- Minimum touch target: **56×56px** (not 44px — field conditions are harsh)
- Minimum font: **16px body**, **14px labels**
- High contrast everywhere — tested in direct sunlight
- Test mental model: *budget Android, cracked screen, bright sun, struggling dog in other hand*

---

## 3. TECH STACK (Do not deviate without updating this file)

```
Frontend:     React 18 + Vite + TypeScript (strict mode)
Styling:      Tailwind CSS v3 + shadcn/ui
PWA:          vite-plugin-pwa (Workbox)
Backend:      Supabase (free tier)
  Database:   PostgreSQL + PostGIS + pgvector (all extensions enabled)
  Storage:    Supabase Storage (images)
  Edge Fns:   Deno (TypeScript)
Mapping:      React-Leaflet + OpenStreetMap tiles
Icons:        Lucide React
Forms:        React Hook Form + Zod validation
State:        Zustand (global) + React Query (server state)
Image:        browser-image-compression
HTTP:         Supabase client (not raw fetch for DB)
```

**What we are NOT using:**
- No Redux, no Context API for global state (use Zustand)
- No Axios (Supabase client handles all DB; native fetch for edge functions)
- No CSS Modules, no styled-components (Tailwind only)
- No Next.js (pure Vite PWA — faster on 3G, simpler deployment)
- No paid APIs of any kind

---

## 4. PROJECT STRUCTURE

```
pawprint-ai/
├── public/
│   ├── icons/                    # PWA icons (72, 96, 128, 144, 152, 192, 384, 512px)
│   ├── manifest.json             # PWA manifest
│   └── offline.html              # Offline fallback page
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (auto-generated, do not edit)
│   │   ├── catch/                # Catch flow components
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── VitalsSelector.tsx
│   │   │   ├── VisualTagsGrid.tsx
│   │   │   ├── LocationCapture.tsx
│   │   │   └── CatchForm.tsx     # Orchestrates the full catch flow
│   │   ├── identify/             # Identify & Release components
│   │   │   ├── ScanButton.tsx
│   │   │   ├── MatchCard.tsx
│   │   │   └── IdentifyFlow.tsx
│   │   ├── dog/                  # Dog profile components
│   │   │   ├── DogHeader.tsx
│   │   │   ├── TagsSummary.tsx
│   │   │   └── Timeline.tsx
│   │   ├── map/
│   │   │   └── DogMap.tsx
│   │   └── shared/
│   │       ├── StatusBadge.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── CatchPage.tsx
│   │   ├── IdentifyPage.tsx
│   │   ├── DogProfilePage.tsx
│   │   ├── MapPage.tsx
│   │   └── DashboardPage.tsx
│   ├── hooks/
│   │   ├── useCamera.ts          # Camera access + retake logic
│   │   ├── useGPS.ts             # GPS capture with fallback
│   │   ├── useDraftSave.ts       # localStorage autosave every 2s
│   │   ├── useUploadQueue.ts     # Offline queue with retry
│   │   └── useImageCompress.ts   # browser-image-compression wrapper
│   ├── stores/
│   │   ├── catchStore.ts         # Zustand: current catch form state
│   │   └── uiStore.ts            # Zustand: UI state (active tab, modals)
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client init
│   │   ├── database.types.ts     # Auto-generated Supabase types
│   │   └── constants.ts          # GPS_SEARCH_RADIUS, EVENT_TYPES, etc.
│   ├── types/
│   │   └── index.ts              # All shared TypeScript types
│   └── App.tsx                   # Root with bottom nav
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── match-dog/            # Edge function for AI matching (Phase 2)
│           └── index.ts
├── AGENT.md                      # ← THIS FILE
├── BUILD_GUIDE.md
├── AGENDA.md
└── .env.example
```

---

## 5. DATABASE SCHEMA (Source of truth — match exactly)

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- DOGS: Core identity record
-- ============================================================
CREATE TABLE dogs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sex                 TEXT CHECK (sex IN ('male', 'female', 'unknown')) NOT NULL DEFAULT 'unknown',
  age_group           TEXT CHECK (age_group IN ('puppy', 'adult', 'senior', 'unknown')) NOT NULL DEFAULT 'unknown',
  condition           TEXT CHECK (condition IN ('healthy', 'injured', 'critical', 'unknown')) NOT NULL DEFAULT 'unknown',
  sterilization_status TEXT CHECK (sterilization_status IN ('intact', 'sterilized', 'unknown')) NOT NULL DEFAULT 'unknown',
  visual_tags         JSONB NOT NULL DEFAULT '{}',
  -- visual_tags shape: {
  --   ears: 'prick'|'semi_floppy'|'fully_floppy'|'cropped'|'torn_notched',
  --   coat: 'red_brown'|'black'|'white'|'grey'|'brindle'|'mixed',
  --   markings: string[]  (values: 'white_chest'|'white_paws'|'black_mask'|'sickle_tail'|'curled_tail')
  -- }
  cover_image_url     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENTS: Full lifecycle log (append-only, never update)
-- ============================================================
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id          UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  event_type      TEXT CHECK (event_type IN (
                    'catch', 'vaccinate', 'sterilize',
                    'recover', 'release', 'observation'
                  )) NOT NULL,
  location        GEOMETRY(Point, 4326),    -- PostGIS: lng/lat (WGS84)
  location_accuracy FLOAT,                  -- GPS accuracy in metres
  handler_name    TEXT,                     -- Free text: field worker name
  notes           TEXT,                     -- Free text: caretaker, landmark, anything
  confirmed_match BOOLEAN DEFAULT FALSE,    -- TRUE when vet confirms identity at release
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOG_IMAGES: Photos and (future) AI embeddings
-- ============================================================
CREATE TABLE dog_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id      UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE SET NULL,
  image_url   TEXT NOT NULL,
  is_cover    BOOLEAN DEFAULT FALSE,
  embedding   vector(768),    -- NULL in V1; populated by Edge Function in V2
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
-- PostGIS spatial index for radius search at release
CREATE INDEX idx_events_location ON events USING GIST (location);

-- Standard indexes for common queries
CREATE INDEX idx_events_dog_id ON events(dog_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_dog_images_dog_id ON dog_images(dog_id);

-- HNSW vector index (created now, used when embeddings are populated in V2)
-- cosine distance matches how MegaDescriptor embeddings should be compared
CREATE INDEX idx_dog_images_embedding ON dog_images
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for JSONB visual_tags queries
CREATE INDEX idx_dogs_visual_tags ON dogs USING GIN (visual_tags);

-- ============================================================
-- HELPER VIEWS
-- ============================================================
-- Latest status of each dog (derived from most recent event)
CREATE VIEW dog_current_status AS
SELECT DISTINCT ON (dog_id)
  dog_id,
  event_type AS current_status,
  timestamp AS last_updated,
  location,
  notes
FROM events
ORDER BY dog_id, timestamp DESC;
```

---

## 6. TYPESCRIPT TYPES (Use these everywhere — never use `any`)

```typescript
// src/types/index.ts

export type Sex = 'male' | 'female' | 'unknown';
export type AgeGroup = 'puppy' | 'adult' | 'senior' | 'unknown';
export type Condition = 'healthy' | 'injured' | 'critical' | 'unknown';
export type SterilizationStatus = 'intact' | 'sterilized' | 'unknown';
export type EarType = 'prick' | 'semi_floppy' | 'fully_floppy' | 'cropped' | 'torn_notched';
export type CoatColor = 'red_brown' | 'black' | 'white' | 'grey' | 'brindle' | 'mixed';
export type Marking = 'white_chest' | 'white_paws' | 'black_mask' | 'sickle_tail' | 'curled_tail';
export type EventType = 'catch' | 'vaccinate' | 'sterilize' | 'recover' | 'release' | 'observation';

export interface VisualTags {
  ears?: EarType;
  coat?: CoatColor;
  markings?: Marking[];
}

export interface Dog {
  id: string;
  sex: Sex;
  age_group: AgeGroup;
  condition: Condition;
  sterilization_status: SterilizationStatus;
  visual_tags: VisualTags;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogEvent {
  id: string;
  dog_id: string;
  event_type: EventType;
  location: GeoPoint | null;
  location_accuracy: number | null;
  handler_name: string | null;
  notes: string | null;
  confirmed_match: boolean;
  timestamp: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DogImage {
  id: string;
  dog_id: string;
  event_id: string | null;
  image_url: string;
  is_cover: boolean;
  embedding: number[] | null;
  created_at: string;
}

export interface DogWithStatus extends Dog {
  current_status: EventType;
  last_updated: string;
  catch_location: GeoPoint | null;
  images: DogImage[];
  events: DogEvent[];
}

// Catch form draft — stored in localStorage
export interface CatchDraft {
  id: string;               // local draft ID
  photo_dataurl: string | null;
  sex: Sex;
  age_group: AgeGroup;
  condition: Condition;
  visual_tags: VisualTags;
  location: GeoPoint | null;
  location_accuracy: number | null;
  notes: string;
  created_at: string;       // draft started
  last_saved: string;       // last localStorage save
}

// Match result from identify flow
export interface MatchResult {
  dog: DogWithStatus;
  similarity_score: number | null;  // null if AI not available (V1)
  gps_distance_metres: number;
  tag_overlap_score: number;        // 0-1: how many visual tags match
  composite_score: number;          // weighted combination
}
```

---

## 7. DESIGN SYSTEM

### Colour Palette
```css
/* Primary — Teal (trust, nature, NGO) */
--color-primary:        #0D7377;
--color-primary-light:  #14A085;
--color-primary-bg:     #E6F7F6;

/* Status colours */
--color-caught:   #F59E0B;  /* Amber  — in process */
--color-released: #10B981;  /* Green  — success */
--color-critical: #EF4444;  /* Red    — needs attention */
--color-observe:  #6B7280;  /* Grey   — observation only */

/* Neutral scale */
--color-dark:     #111827;
--color-body:     #374151;
--color-muted:    #6B7280;
--color-border:   #E5E7EB;
--color-surface:  #F9FAFB;
--color-white:    #FFFFFF;
```

### Typography
```
Font:       Inter (Google Fonts — loads fast, excellent mobile rendering)
Body:       16px / 400 weight / #374151
Label:      14px / 500 weight / #6B7280
Heading:    20-24px / 700 weight / #111827
Hero:       28-32px / 800 weight / #111827
```

### Component Rules
```
Border radius:    12px cards, 8px buttons, 6px tags, 999px badges
Shadow:           shadow-sm for cards, shadow-md for floating elements
Tap targets:      min 56px height, min 56px width
Spacing unit:     4px base (Tailwind default)
Bottom nav:       64px height, safe-area-inset-bottom padding
Top safe area:    env(safe-area-inset-top) for status bar
```

### The Catch Flow — Special Rules
The Catch flow is the most critical UI in the entire app. Rules:
1. **Camera button**: full-width bottom, minimum 80px height, never behind keyboard
2. **Tag selectors**: icon + label, grid layout, 56px minimum tap target
3. **Selected state**: filled background (primary colour), NOT just a border change
4. **Auto-save indicator**: subtle pulsing dot, top-right corner, never blocks content
5. **GPS indicator**: shows accuracy in metres, green if <20m, amber if <50m, red if >50m or failed
6. **Photo preview**: thumbnail visible at all times once captured, tap to retake
7. **Save button**: sticky bottom, always visible, shows upload progress inline

---

## 8. KEY BEHAVIOURS (Implement all of these from day 1)

### Forgiving UI
```typescript
// Draft autosave — runs on every form field change
// Saves to localStorage key: 'pawprint_catch_draft'
// Restored on page mount if draft exists and is < 24 hours old
const DRAFT_KEY = 'pawprint_catch_draft';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Photo retake — NEVER clears already-selected tags
// Camera component emits new photo; parent updates photo only
// Tags, GPS, notes are preserved

// GPS failure — save without GPS, show warning, do NOT block save
// Show: "Location unavailable — record will be saved without GPS"
```

### Upload Queue
```typescript
// Offline queue — stored in localStorage key: 'pawprint_upload_queue'
// On save: add to queue immediately → attempt upload → if fails: stays in queue
// On app open: check queue → retry any pending items
// On network restore: auto-retry (navigator.onLine event)
// Max retries: 5 (after 5 fails: flag as 'needs_manual_review')
```

### Image Compression
```typescript
// Always compress before upload
// Target: < 800KB (not 1MB — Supabase Storage free tier has bandwidth limits)
// Max dimensions: 1920×1920 (sufficient for identification)
// Format: JPEG, quality: 0.85
// Library: browser-image-compression
```

---

## 9. SUPABASE EDGE FUNCTION — AI MATCHING (Phase 2 placeholder)

```typescript
// supabase/functions/match-dog/index.ts
// This function is stubbed in V1 — returns empty results
// In V2 it calls HuggingFace MegaDescriptor for embeddings

// ENDPOINT: POST /functions/v1/match-dog
// REQUEST: { image_base64: string, current_location: GeoPoint, radius_km: number }
// RESPONSE: { matches: MatchResult[], method: 'ai+gps+tags' | 'gps+tags' }

// V1 fallback logic (implement first):
// 1. Extract current GPS from request
// 2. Query events table for all catch events within radius_km
// 3. Join with dogs + visual_tags
// 4. Compute tag_overlap_score in SQL
// 5. Return sorted by (gps_distance × 0.6 + tag_overlap × 0.4)
// 6. No AI in V1 — composite_score uses only GPS + tags
```

---

## 10. ENVIRONMENT VARIABLES

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# .env.example (commit this)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 11. AGENT RULES (Follow these without exception)

1. **TypeScript strict mode always** — no `any`, no `as unknown as X` escape hatches
2. **Mobile first always** — write mobile CSS first, desktop is the override
3. **Never block on GPS** — GPS failure = save without location + warning, never an error state
4. **Never block on network** — every save goes to localStorage queue first
5. **Tailwind only** — no inline styles except for dynamic values (e.g. map heights)
6. **shadcn/ui for all standard components** — do not build your own Button, Dialog, etc.
7. **Lucide React for all icons** — no other icon library
8. **Comments on every non-obvious function** — this codebase will be handed to field NGO developers
9. **No console.log in production code** — use a logger utility
10. **Test on 375px viewport** — that is the minimum supported width
11. **Supabase client is a singleton** — import from `src/lib/supabase.ts` everywhere
12. **All DB queries in custom hooks** — never call supabase directly from components

---

## 12. COMMANDS

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Preview PWA build
npm run preview

# Generate Supabase types
npx supabase gen types typescript --project-id YOUR_ID > src/lib/database.types.ts

# Run Supabase locally (optional for testing)
npx supabase start
```

---

## 13. WHAT IS DONE vs TODO

Track this as you build. Update after each session.

### Done ✅
- [ ] PRD v2.0
- [ ] Agent context file (this file)
- [ ] Build guide
- [ ] Agenda + day-by-day prompts
- [ ] Colab ML notebook

### In Progress 🔄
- [ ] Project scaffold

### Not Started ⬜
- [ ] Supabase project setup
- [ ] Database schema migration
- [ ] React PWA shell
- [ ] Catch flow
- [ ] Dog profile
- [ ] Identify & Release flow
- [ ] Map view
- [ ] Dashboard
- [ ] Edge function (V2 AI)

---

*Last updated: June 2026 | PawPrint AI v1.0 MVP*
