import { create } from 'zustand';
import type { Sex, AgeGroup, Condition, GeoPoint, VisualTags, GPSStatus, CatchDraft } from '../types';

interface CatchState {
  draft: CatchDraft;
  gpsStatus: GPSStatus;
  gpsError: string | null;

  // Actions
  setPhoto: (dataUrl: string | null, size: number | null) => void;
  setSex: (sex: Sex) => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  setCondition: (condition: Condition) => void;
  setVisualTags: (tags: VisualTags) => void;
  setLocation: (location: GeoPoint | null, accuracy: number | null) => void;
  setGpsStatus: (status: GPSStatus) => void;
  setGpsError: (error: string | null) => void;
  setNotes: (notes: string) => void;
  setHandlerName: (name: string) => void;
  initDraft: () => void;
  loadSavedDraft: (draft: CatchDraft) => void;
  resetDraft: () => void;
}

const createEmptyDraft = (): CatchDraft => ({
  id: crypto.randomUUID(),
  photo_dataurl: null,
  photo_size: null,
  sex: 'unknown',
  age_group: 'unknown',
  condition: 'unknown',
  visual_tags: {},
  location: null,
  location_accuracy: null,
  notes: '',
  handler_name: '',
  created_at: new Date().toISOString(),
  last_saved: new Date().toISOString(),
});

export const useCatchStore = create<CatchState>((set) => ({
  draft: createEmptyDraft(),
  gpsStatus: 'idle',
  gpsError: null,

  setPhoto: (dataUrl, size) =>
    set((state) => ({
      draft: { ...state.draft, photo_dataurl: dataUrl, photo_size: size, last_saved: new Date().toISOString() },
    })),
  setSex: (sex) =>
    set((state) => ({
      draft: { ...state.draft, sex, last_saved: new Date().toISOString() },
    })),
  setAgeGroup: (ageGroup) =>
    set((state) => ({
      draft: { ...state.draft, age_group: ageGroup, last_saved: new Date().toISOString() },
    })),
  setCondition: (condition) =>
    set((state) => ({
      draft: { ...state.draft, condition, last_saved: new Date().toISOString() },
    })),
  setVisualTags: (tags) =>
    set((state) => ({
      draft: { ...state.draft, visual_tags: tags, last_saved: new Date().toISOString() },
    })),
  setLocation: (location, accuracy) =>
    set((state) => ({
      draft: {
        ...state.draft,
        location,
        location_accuracy: accuracy,
        last_saved: new Date().toISOString(),
      },
    })),
  setGpsStatus: (status) => set({ gpsStatus: status }),
  setGpsError: (error) => set({ gpsError: error }),
  setNotes: (notes) =>
    set((state) => ({
      draft: { ...state.draft, notes, last_saved: new Date().toISOString() },
    })),
  setHandlerName: (name) =>
    set((state) => ({
      draft: { ...state.draft, handler_name: name, last_saved: new Date().toISOString() },
    })),
  initDraft: () => set({ draft: createEmptyDraft() }),
  loadSavedDraft: (draft) => set({ draft }),
  resetDraft: () => set({ draft: createEmptyDraft(), gpsStatus: 'idle', gpsError: null }),
}));
