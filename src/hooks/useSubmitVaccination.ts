import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCatchStore } from '../stores/catchStore';
import { useToast } from './use-toast';
import { compressDogPhoto, dataURLToBlob } from '../lib/imageUtils';
import { storageService } from '../lib/storageService';
import { UPLOAD_QUEUE_KEY } from '../lib/constants';
import type { CatchDraft } from '../types';

export interface SubmitState {
  isSubmitting: boolean;
  isOptimistic: boolean;
  error: string | null;
  successData: { dog_id: string; event_id: string } | null;
}

interface QueuedCatch extends CatchDraft {
  queued_at: string;
  retries: number;
}

interface CreateResponse {
  dog_id: string;
  event_id: string;
}

export const useSubmitVaccination = () => {
  const { toast } = useToast();
  const { draft } = useCatchStore();
  const [state, setState] = useState<SubmitState>({
    isSubmitting: false,
    isOptimistic: false,
    error: null,
    successData: null,
  });

  const clearState = useCallback(() => {
    setState({
      isSubmitting: false,
      isOptimistic: false,
      error: null,
      successData: null,
    });
  }, []);

  const uploadToQueue = useCallback((draftToQueue: CatchDraft) => {
    try {
      const queue: QueuedCatch[] = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || '[]');
      queue.push({
        ...draftToQueue,
        queued_at: new Date().toISOString(),
        retries: 0
      });
      localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to queue upload:', e);
    }
  }, []);

  const submitVaccination = useCallback(async () => {
    if (!draft.photo_dataurl) {
      toast({
        title: "Photo required",
        description: "Please capture a photo of the dog before saving.",
        variant: "destructive"
      });
      return;
    }

    setState(s => ({ ...s, isSubmitting: true, error: null }));

    try {
      const photoBlob = await dataURLToBlob(draft.photo_dataurl);
      const compressedFile = await compressDogPhoto(photoBlob);

      // 1. Create records in DB using create_onsite_vaccination
      const { data, error: rpcError } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: CreateResponse[] | null, error: { message: string } | null }>)('create_onsite_vaccination', {
        p_sex: draft.sex,
        p_age_group: draft.age_group,
        p_condition: draft.condition,
        p_visual_tags: draft.visual_tags,
        p_lat: draft.location?.lat ?? null,
        p_lng: draft.location?.lng ?? null,
        p_location_accuracy: draft.location_accuracy ?? null,
        p_vaccine_type: draft.vaccine_type,
        p_vaccine_batch: draft.vaccine_batch || null,
        p_vaccinator_name: draft.vaccinator_name || null,
        p_handler_name: draft.handler_name,
        p_notes: draft.notes
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!data || !data[0]) throw new Error('No data returned from create_onsite_vaccination');

      const { dog_id, event_id } = data[0];

      // 2. Upload photo and update metadata
      await storageService.uploadDogCover(dog_id, event_id, compressedFile);

      setState({
        isSubmitting: false,
        isOptimistic: false,
        error: null,
        successData: { dog_id, event_id }
      });

      toast({
        title: "Success",
        description: "Vaccination recorded successfully.",
      });

    } catch (err: unknown) {
      console.error('Submission error:', err);
      const error = err as Error;

      const isNetworkError = error.message === 'Failed to fetch' || !navigator.onLine;

      if (isNetworkError) {
        uploadToQueue(draft);
        setState({
          isSubmitting: false,
          isOptimistic: true,
          error: null,
          successData: { dog_id: 'pending...', event_id: 'pending...' }
        });
        toast({
          title: "Offline",
          description: "Vaccination saved locally. Will upload when online.",
        });
      } else {
        setState({
          isSubmitting: false,
          isOptimistic: false,
          error: error.message,
          successData: null
        });
        toast({
          title: "Submission failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  }, [draft, toast, uploadToQueue]);

  return {
    ...state,
    submitVaccination,
    clearState
  };
};
