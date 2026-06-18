# PawPrint AI

PawPrint AI is a Progressive Web App (PWA) designed for CNVR (Catch-Neuter-Vaccinate-Release) dog tracking in Kathmandu, Nepal. It uses AI-powered visual matching and GPS tracking to manage community dog populations efficiently.

## Live URL
[https://pawprint-ai-nepal.vercel.app](https://pawprint-ai-nepal.vercel.app) (Placeholder)

## 5-Step Setup
1. **Clone the repository:** `git clone https://github.com/example/pawprint-ai.git`
2. **Install dependencies:** `npm install`
3. **Configure Environment:** Create `.env.local` using `.env.example` as a template.
4. **Setup Supabase:** Run the SQL schema found in `schema.sql` in your Supabase project.
5. **Start Development:** `npm run dev` or build with `npm run build`.

## Environment Variables
* `VITE_SUPABASE_URL`: Your Supabase Project URL.
* `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous API Key.

## Tech Stack
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS.
* **UI Components:** Radix UI, Lucide React, Shadcn/UI.
* **Database & Auth:** Supabase.
* **Mapping:** Leaflet, React Leaflet.
* **State Management:** Zustand, TanStack Query.
* **PWA:** VitePWA.

## License
MIT License - Copyright (c) 2026 PawPrint AI
