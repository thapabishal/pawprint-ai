import { useEffect } from 'react';
import type { CatchDraft } from '../types';
import { DRAFT_KEY, DRAFT_MAX_AGE_HOURS } from '../lib/constants';

export const saveDraft = (draft: CatchDraft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
};

export const loadDraft = (): CatchDraft | null => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;

    const draft: CatchDraft = JSON.parse(saved);
    const lastSaved = new Date(draft.last_saved).getTime();
    const now = new Date().getTime();
    const ageHours = (now - lastSaved) / (1000 * 60 * 60);

    if (ageHours > DRAFT_MAX_AGE_HOURS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }

    return draft;
  } catch (error) {
    console.error('Failed to load draft from localStorage:', error);
    return null;
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear draft from localStorage:', error);
  }
};

export const useDraftSave = (draft: CatchDraft) => {
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(draft);
    }, 2000);

    return () => clearInterval(interval);
  }, [draft]);
};
