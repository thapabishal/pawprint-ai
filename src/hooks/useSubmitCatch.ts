import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCatchStore } from '../stores/catchStore';
import { useToast } from './use-toast';
import { compressDogPhoto, dataURLToBlob } from '../lib/imageUtils';
import { storageService } from '../lib/storageService';
import { UPLOAD_QUEUE_KEY, UPLOAD_MAX_RETRIES } from '../lib/constants';
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

interface CreateCatchResponse {
  dog_id: string;
  event_id: string;
}

export const useSubmitCatch = () => {
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

  const processQueue = useCallback(async () => {
    const queueString = localStorage.getItem(UPLOAD_QUEUE_KEY);
    if (!queueString) return;

    const queue: QueuedCatch[] = JSON.parse(queueString);
    if (queue.length === 0) return;

    const remainingQueue: QueuedCatch[] = [];
    let successCount = 0;

    for (const item of queue) {
      if (item.retries >= UPLOAD_MAX_RETRIES) {
        console.warn('Max retries reached for queued item:', item.id);
        continue;
      }

      try {
        if (!item.photo_dataurl) throw new Error('No photo in queued item');

        const photoBlob = await dataURLToBlob(item.photo_dataurl);
        const compressedFile = await compressDogPhoto(photoBlob);

        // RPC call to create dog and event record
        const { data, error: rpcError } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: CreateCatchResponse[] | null, error: { message: string } | null }>)('create_catch_event', {
          p_sex: item.sex,
          p_age_group: item.age_group,
          p_condition: item.condition,
          p_sterilization_status: 'unknown',
          p_visual_tags: item.visual_tags,
          p_lat: item.location?.lat ?? null,
          p_lng: item.location?.lng ?? null,
          p_location_accuracy: item.location_accuracy ?? null,
          p_handler_name: item.handler_name,
          p_notes: item.notes
        });

        if (rpcError) throw new Error(rpcError.message);
        if (!data || !data[0]) throw new Error('No data returned from create_catch_event');

        const { dog_id, event_id } = data[0];

        // Handle storage and database metadata updates
        await storageService.uploadDogCover(dog_id, event_id, compressedFile);

        successCount++;
      } catch (err) {
        console.error('Failed to process queued item:', err);
        remainingQueue.push({
          ...item,
          retries: item.retries + 1
        });
      }
    }

    localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(remainingQueue));
    if (successCount > 0) {
      toast({
        title: "Queue processed",
        description: `Successfully uploaded ${successCount} pending catches.`,
      });
    }
  }, [toast]);

  useEffect(() => {
    // Initial process on mount
    processQueue();

    // Listen for network restoration
    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  const submitCatch = useCallback(async () => {
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

      // 1. Create records in DB
      const { data, error: rpcError } = await (supabase.rpc as unknown as (name: string, args: unknown) => Promise<{ data: CreateCatchResponse[] | null, error: { message: string } | null }>)('create_catch_event', {
        p_sex: draft.sex,
        p_age_group: draft.age_group,
        p_condition: draft.condition,
        p_sterilization_status: 'unknown',
        p_visual_tags: draft.visual_tags,
        p_lat: draft.location?.lat ?? null,
        p_lng: draft.location?.lng ?? null,
        p_location_accuracy: draft.location_accuracy ?? null,
        p_handler_name: draft.handler_name,
        p_notes: draft.notes
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!data || !data[0]) throw new Error('No data returned from create_catch_event');

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
        description: "Catch recorded successfully.",
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
          description: "Catch saved locally. Will upload when online.",
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
    submitCatch,
    clearState
  };
};
