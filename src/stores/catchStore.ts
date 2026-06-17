import { create } from 'zustand';
import type { Sex, AgeGroup, Condition, GeoPoint, SterilizationStatus, VisualTags } from '../types';

interface CatchState {
  photoDataUrl: string | null;
  photoSize: number | null; // in bytes
  sex: Sex;
  ageGroup: AgeGroup;
  condition: Condition;
  sterilizationStatus: SterilizationStatus;
  visualTags: VisualTags;
  location: GeoPoint | null;
  locationAccuracy: number | null;
  handlerName: string;
  notes: string;
  gpsStatus: 'idle' | 'requesting' | 'good' | 'moderate' | 'failed';

  // Actions
  setPhoto: (dataUrl: string | null, size: number | null) => void;
  setSex: (sex: Sex) => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  setCondition: (condition: Condition) => void;
  setSterilizationStatus: (status: SterilizationStatus) => void;
  setVisualTags: (tags: VisualTags) => void;
  setLocation: (location: GeoPoint | null, accuracy: number | null) => void;
  setGpsStatus: (status: 'idle' | 'requesting' | 'good' | 'moderate' | 'failed') => void;
  setHandlerName: (name: string) => void;
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
  sterilizationStatus: 'unknown',
  visualTags: {},
  location: null,
  locationAccuracy: null,
  handlerName: '',
  notes: '',
  gpsStatus: 'idle',

  setPhoto: (dataUrl, size) => set({ photoDataUrl: dataUrl, photoSize: size }),
  setSex: (sex) => set({ sex }),
  setAgeGroup: (ageGroup) => set({ ageGroup }),
  setCondition: (condition) => set({ condition }),
  setSterilizationStatus: (status) => set({ sterilizationStatus: status }),
  setVisualTags: (tags) => set({ visualTags: tags }),
  setLocation: (location, accuracy) => set({ location, locationAccuracy: accuracy }),
  setGpsStatus: (status) => set({ gpsStatus: status }),
  setHandlerName: (name) => set({ handlerName: name }),
  setNotes: (notes) => set({ notes }),
  retakePhoto: () => set({ photoDataUrl: null, photoSize: null }),
  reset: () => set({
    photoDataUrl: null,
    photoSize: null,
    sex: 'unknown',
    ageGroup: 'unknown',
    condition: 'unknown',
    sterilizationStatus: 'unknown',
    visualTags: {},
    location: null,
    locationAccuracy: null,
    handlerName: '',
    notes: '',
    gpsStatus: 'idle',
  }),
}));
