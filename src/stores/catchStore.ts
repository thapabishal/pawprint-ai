// src/stores/catchStore.ts
import { create } from 'zustand'
import type { CatchDraft, Sex, AgeGroup, Condition, VisualTags, GeoPoint } from '@/types'
import { loadDraft, clearDraft } from '@/hooks/useDraftSave'

interface CatchState {
  draft: CatchDraft
  setPhoto: (dataUrl: string | null) => void
  setSex: (sex: Sex) => void
  setAgeGroup: (age: AgeGroup) => void
  setCondition: (condition: Condition) => void
  setVisualTags: (tags: VisualTags) => void
  setLocation: (location: GeoPoint | null, accuracy: number | null) => void
  setNotes: (notes: string) => void
  resetDraft: () => void
  loadSavedDraft: () => void
}

const createInitialDraft = (): CatchDraft => ({
  id: crypto.randomUUID(),
  photo_dataurl: null,
  sex: 'unknown',
  age_group: 'unknown',
  condition: 'unknown',
  visual_tags: {},
  location: null,
  location_accuracy: null,
  notes: '',
  created_at: new Date().toISOString(),
  last_saved: new Date().toISOString(),
})

export const useCatchStore = create<CatchState>((set) => ({
  draft: createInitialDraft(),

  setPhoto: (photo_dataurl) =>
    set((state) => ({
      draft: { ...state.draft, photo_dataurl, last_saved: new Date().toISOString() },
    })),

  setSex: (sex) =>
    set((state) => ({
      draft: { ...state.draft, sex, last_saved: new Date().toISOString() },
    })),

  setAgeGroup: (age_group) =>
    set((state) => ({
      draft: { ...state.draft, age_group, last_saved: new Date().toISOString() },
    })),

  setCondition: (condition) =>
    set((state) => ({
      draft: { ...state.draft, condition, last_saved: new Date().toISOString() },
    })),

  setVisualTags: (visual_tags) =>
    set((state) => ({
      draft: { ...state.draft, visual_tags, last_saved: new Date().toISOString() },
    })),

  setLocation: (location, location_accuracy) =>
    set((state) => ({
      draft: {
        ...state.draft,
        location,
        location_accuracy,
        last_saved: new Date().toISOString(),
      },
    })),

  setNotes: (notes) =>
    set((state) => ({
      draft: { ...state.draft, notes, last_saved: new Date().toISOString() },
    })),

  resetDraft: () => {
    clearDraft()
    set({ draft: createInitialDraft() })
  },

  loadSavedDraft: () => {
    const saved = loadDraft()
    if (saved) {
      set({ draft: saved })
    }
  },
}))
