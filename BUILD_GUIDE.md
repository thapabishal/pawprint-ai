# 🐾 PawPrint AI — BUILD GUIDE
> Step-by-step technical setup from zero to running PWA.
> Follow in order. Do not skip steps.

---

## PREREQUISITES

Before starting, make sure you have:
- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Git installed
- [ ] A Supabase account (free at supabase.com)
- [ ] A code editor (VS Code recommended with Tailwind CSS IntelliSense extension)
- [ ] Chrome DevTools familiarity (we use it to test PWA and mobile)

---

## PHASE 0: PROJECT SCAFFOLD

### Step 0.1 — Create Vite + React + TypeScript project

```bash
npm create vite@latest pawprint-ai -- --template react-ts
cd pawprint-ai
npm install
```

### Step 0.2 — Install all dependencies

```bash
# Core UI
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Routing
npm install react-router-dom

# State management
npm install zustand @tanstack/react-query

# Forms
npm install react-hook-form zod @hookform/resolvers

# Supabase
npm install @supabase/supabase-js

# Maps
npm install react-leaflet leaflet
npm install -D @types/leaflet

# Image compression
npm install browser-image-compression

# PWA
npm install -D vite-plugin-pwa workbox-window

# Dev tools
npm install -D @types/react @types/react-dom typescript
```

### Step 0.3 — Initialise Tailwind

```bash
npx tailwindcss init -p
```

Replace `tailwind.config.js` with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D7377',
          light: '#14A085',
          bg: '#E6F7F6',
        },
        status: {
          caught: '#F59E0B',
          released: '#10B981',
          critical: '#EF4444',
          observe: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

Add to `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  html { font-size: 16px; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #F9FAFB;
    color: #374151;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior: none;
  }
  /* Prevent iOS bounce scroll at app level */
  #root {
    min-height: 100dvh;
    position: relative;
    overflow: hidden;
  }
}

@layer utilities {
  /* Safe area padding for notched phones */
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
  .pt-safe { padding-top: env(safe-area-inset-top); }

  /* 56px minimum touch target */
  .touch-target {
    min-height: 56px;
    min-width: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

### Step 0.4 — Initialise shadcn/ui

```bash
npx shadcn@latest init
```

Select:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

Then add components you'll need:
```bash
npx shadcn@latest add button card dialog sheet badge tabs progress toast
```

### Step 0.5 — Configure Vite for PWA

Replace `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'offline.html'],
      manifest: {
        name: 'PawPrint AI',
        short_name: 'PawPrint',
        description: 'CNVR dog tracking for Nepal',
        theme_color: '#0D7377',
        background_color: '#F9FAFB',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Cache OpenStreetMap tiles for offline map viewing
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Cache Supabase Storage images
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dog-images',
              expiration: { maxEntries: 1000, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### Step 0.6 — Create directory structure

```bash
mkdir -p src/components/catch
mkdir -p src/components/identify
mkdir -p src/components/dog
mkdir -p src/components/map
mkdir -p src/components/shared
mkdir -p src/pages
mkdir -p src/hooks
mkdir -p src/stores
mkdir -p src/lib
mkdir -p src/types
mkdir -p supabase/migrations
mkdir -p supabase/functions/match-dog
mkdir -p public/icons
```

---

## PHASE 1: SUPABASE SETUP

### Step 1.1 — Create Supabase project

1. Go to supabase.com → New project
2. Name: `pawprint-ai`
3. Password: save it securely
4. Region: `ap-south-1` (Mumbai — closest to Nepal)
5. Wait for provisioning (~2 min)

### Step 1.2 — Enable extensions

In Supabase Dashboard → Database → Extensions, enable:
- `uuid-ossp` ✅
- `postgis` ✅
- `vector` ✅

### Step 1.3 — Run migrations

In Supabase Dashboard → SQL Editor, paste and run the full schema from `AGENT.md` Section 5.

Run the create statements in order:
1. Extensions
2. `dogs` table
3. `events` table
4. `dog_images` table
5. All indexes
6. Views

Verify in Table Editor — you should see three tables.

### Step 1.4 — Set up Storage

In Supabase Dashboard → Storage:
1. Create bucket: `dog-images`
2. Make it **public** (field workers need to view images without auth)
3. Set file size limit: 5MB
4. Allowed MIME types: `image/jpeg, image/png, image/webp`

### Step 1.5 — Row Level Security (for pilot)

For the pilot, we use simple open RLS. Run in SQL Editor:

```sql
-- Allow all operations for now (pilot with known field workers)
-- IMPORTANT: Replace with proper auth before public launch

ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for pilot" ON dogs FOR ALL USING (true);
CREATE POLICY "Allow all for pilot" ON events FOR ALL USING (true);
CREATE POLICY "Allow all for pilot" ON dog_images FOR ALL USING (true);
```

### Step 1.6 — Connect to app

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton — import this everywhere, never create a new client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

Create `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_dashboard
```

Generate TypeScript types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

---

## PHASE 2: CORE HOOKS (Build these before any UI)

These are the building blocks. Every component depends on them.

### Hook: `useDraftSave`
Autosaves catch form to localStorage every 2 seconds. Restores on mount.

```typescript
// src/hooks/useDraftSave.ts
import { useEffect, useRef } from 'react'
import type { CatchDraft } from '@/types'

const DRAFT_KEY = 'pawprint_catch_draft'
const SAVE_INTERVAL = 2000 // 2 seconds
const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

export function useDraftSave(draft: CatchDraft | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!draft) return
    intervalRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        ...draft,
        last_saved: new Date().toISOString()
      }))
    }, SAVE_INTERVAL)

    return () => clearInterval(intervalRef.current)
  }, [draft])
}

export function loadDraft(): CatchDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as CatchDraft
    const age = Date.now() - new Date(draft.last_saved).getTime()
    if (age > MAX_AGE) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
```

### Hook: `useGPS`
Captures GPS with accuracy reporting. Never throws — returns null on failure.

```typescript
// src/hooks/useGPS.ts
import { useState, useCallback } from 'react'
import type { GeoPoint } from '@/types'

type GPSStatus = 'idle' | 'requesting' | 'success' | 'failed' | 'unavailable'

interface GPSResult {
  location: GeoPoint | null
  accuracy: number | null
  status: GPSStatus
  error: string | null
  requestLocation: () => void
}

export function useGPS(): GPSResult {
  const [location, setLocation] = useState<GeoPoint | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [status, setStatus] = useState<GPSStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setError('GPS not available on this device')
      return
    }

    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setAccuracy(position.coords.accuracy)
        setStatus('success')
        setError(null)
      },
      (err) => {
        setStatus('failed')
        setError(err.message)
        // IMPORTANT: we do NOT throw — GPS failure is recoverable
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return { location, accuracy, status, error, requestLocation }
}
```

### Hook: `useCamera`
Handles camera capture and retake without losing form state.

```typescript
// src/hooks/useCamera.ts
import { useState, useRef, useCallback } from 'react'

interface CameraState {
  photoDataUrl: string | null
  isCapturing: boolean
  error: string | null
  capturePhoto: () => void
  retakePhoto: () => void
}

export function useCamera(): CameraState {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const capturePhoto = useCallback(() => {
    // Use file input with capture attribute — most reliable on Android
    if (!fileInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.setAttribute('capture', 'environment') // rear camera
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
          setPhotoDataUrl(ev.target?.result as string)
          setIsCapturing(false)
        }
        reader.readAsDataURL(file)
      }
      fileInputRef.current = input
    }
    setIsCapturing(true)
    fileInputRef.current.click()
  }, [])

  const retakePhoto = useCallback(() => {
    // Clear photo only — preserve all tags and form state
    setPhotoDataUrl(null)
    setError(null)
    capturePhoto()
  }, [capturePhoto])

  return { photoDataUrl, isCapturing, error, capturePhoto, retakePhoto }
}
```

---

## PHASE 3: UI COMPONENT PATTERNS

### Pattern: Tap-select icon grid
Used for vitals (sex, age, condition) and visual tags.

```typescript
// Pattern for tap-select grids
// Key: selectedValue state lives in PARENT, not in the grid component
// Key: onSelect callback only updates the relevant field
// Key: grid items are 56px minimum, label below icon

interface TapSelectOption<T> {
  value: T
  label: string
  icon: string // emoji or lucide icon name
}

interface TapSelectGridProps<T> {
  options: TapSelectOption<T>[]
  selected: T | null
  onSelect: (value: T) => void
  columns?: 2 | 3 | 4
}
```

### Pattern: Status badge
```typescript
// Status maps to colour — never change this mapping
const STATUS_COLORS = {
  catch:       'bg-amber-100 text-amber-800 border-amber-200',
  vaccinate:   'bg-blue-100 text-blue-800 border-blue-200',
  sterilize:   'bg-purple-100 text-purple-800 border-purple-200',
  recover:     'bg-orange-100 text-orange-800 border-orange-200',
  release:     'bg-green-100 text-green-800 border-green-200',
  observation: 'bg-gray-100 text-gray-700 border-gray-200',
} as const
```

### Pattern: Upload queue
```typescript
// Every save follows this pattern — never save directly to Supabase
// 1. Save to localStorage queue immediately (instant, no network)
// 2. Attempt Supabase upload
// 3. On success: remove from queue, show success
// 4. On fail: keep in queue, show 'will retry' message
// 5. On app open: check queue, retry anything pending
```

---

## PHASE 4: DEPLOYMENT

### Vercel (recommended — free, fast CDN)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Testing PWA on real device
1. Deploy to Vercel (get HTTPS URL)
2. Open in Chrome on Android
3. Tap "Add to Home Screen"
4. Open from home screen — should launch in standalone mode
5. Test camera, GPS, offline behaviour

### Lighthouse PWA audit
Run in Chrome DevTools → Lighthouse → PWA
Target scores:
- Performance: > 80
- PWA: 100
- Accessibility: > 90

---

## TROUBLESHOOTING

| Problem | Cause | Fix |
|---------|-------|-----|
| Camera doesn't open on Android | Missing `capture` attribute | Ensure `capture="environment"` on input |
| GPS shows "permission denied" | User denied permission | Show instructions to enable in browser settings |
| Map not loading | Missing Leaflet CSS | Import `leaflet/dist/leaflet.css` in main.tsx |
| PWA not installing | HTTP vs HTTPS | Must be served over HTTPS (Vercel does this) |
| Supabase CORS error | Wrong URL in env | Check VITE_SUPABASE_URL matches your project |
| Images not loading | Bucket not public | Set Storage bucket to public in Supabase dashboard |
| Types out of sync | Schema changed | Re-run `supabase gen types typescript` |

---

*Built for PawPrint AI — Community Dog CNVR Tracking, Nepal | 2026*
