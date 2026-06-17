import { create } from 'zustand';
import type { Sex, AgeGroup, Condition, GeoPoint } from '../types';

interface CatchState {
  photoDataUrl: string | null;
  photoSize: number | null; // in bytes
  sex: Sex;
  ageGroup: AgeGroup;
  condition: Condition;
  location: GeoPoint | null;
  locationAccuracy: number | null;
  notes: string;
  gpsStatus: 'idle' | 'requesting' | 'good' | 'moderate' | 'failed';

  // Actions
  setPhoto: (dataUrl: string | null, size: number | null) => void;
  setSex: (sex: Sex) => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  setCondition: (condition: Condition) => void;
  setLocation: (location: GeoPoint | null, accuracy: number | null) => void;
  setGpsStatus: (status: 'idle' | 'requesting' | 'good' | 'moderate' | 'failed') => void;
  setNotes: (notes: string) => void;
  retakePhoto: () => void;
  reset: () => void;
}

export const useCatchStore = create<CatchState>((set) => ({
  photoDataUrl: null,
  photoSize: null,
  sex: 'unknown',
  ageGroup: 'unknown',
  condition: 'unknown',
  location: null,
  locationAccuracy: null,
  notes: '',
  gpsStatus: 'idle',

  setPhoto: (dataUrl, size) => set({ photoDataUrl: dataUrl, photoSize: size }),
  setSex: (sex) => set({ sex }),
  setAgeGroup: (ageGroup) => set({ ageGroup }),
  setCondition: (condition) => set({ condition }),
  setLocation: (location, accuracy) => set({ location, locationAccuracy: accuracy }),
  setGpsStatus: (status) => set({ gpsStatus: status }),
  setNotes: (notes) => set({ notes }),
  retakePhoto: () => set({ photoDataUrl: null, photoSize: null }),
  reset: () => set({
    photoDataUrl: null,
    photoSize: null,
    sex: 'unknown',
    ageGroup: 'unknown',
    condition: 'unknown',
    location: null,
    locationAccuracy: null,
    notes: '',
    gpsStatus: 'idle',
  }),
}));
