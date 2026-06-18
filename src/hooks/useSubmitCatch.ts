import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCatchStore } from '../stores/catchStore';
import { useToast } from './use-toast';
import imageCompression from 'browser-image-compression';
import { UPLOAD_QUEUE_KEY, STORAGE_BUCKET, UPLOAD_MAX_RETRIES } from '../lib/constants';
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

  const compressImage = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return await imageCompression(blob as File, options);
  };

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
    const queue: QueuedCatch[] = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || '[]');
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

        const compressedBlob = await compressImage(item.photo_dataurl);

        // @ts-ignore
        const { data, error: rpcError } = await (supabase.rpc as any)('create_catch_event', {
          p_sex: item.sex,
          p_age_group: item.age_group,
          p_condition: item.condition,
          p_sterilization_status: 'unknown',
          p_visual_tags: item.visual_tags as any,
          p_lat: item.location?.lat ?? null,
          p_lng: item.location?.lng ?? null,
          p_location_accuracy: item.location_accuracy ?? null,
          p_handler_name: item.handler_name,
          p_notes: item.notes
        });

        if (rpcError) throw rpcError;
        if (!data || !data[0]) throw new Error('No data returned from RPC');

        const { dog_id, event_id } = data[0] as { dog_id: string, event_id: string };
        const filePath = `${dog_id}/${event_id}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        // @ts-ignore
        await (supabase.from('dogs').update as any)({ cover_image_url: publicUrl })
          .eq('id', dog_id);

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
      const compressedBlob = await compressImage(draft.photo_dataurl);

      // @ts-ignore
      const { data, error: rpcError } = await (supabase.rpc as any)('create_catch_event', {
        p_sex: draft.sex,
        p_age_group: draft.age_group,
        p_condition: draft.condition,
        p_sterilization_status: 'unknown',
        p_visual_tags: draft.visual_tags as any,
        p_lat: draft.location?.lat ?? null,
        p_lng: draft.location?.lng ?? null,
        p_location_accuracy: draft.location_accuracy ?? null,
        p_handler_name: draft.handler_name,
        p_notes: draft.notes
      });

      if (rpcError) throw rpcError;
      if (!data || !data[0]) throw new Error('No data returned from create_catch_event');

      const { dog_id, event_id } = data[0] as { dog_id: string, event_id: string };
      const filePath = `${dog_id}/${event_id}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      // @ts-ignore
      const { error: updateError } = await (supabase.from('dogs').update as any)({ cover_image_url: publicUrl })
        .eq('id', dog_id);

      if (updateError) throw updateError;

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

    } catch (err: any) {
      console.error('Submission error:', err);

      const isNetworkError = err.message === 'Failed to fetch' || !navigator.onLine;

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
          error: err.message,
          successData: null
        });
        toast({
          title: "Submission failed",
          description: err.message,
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
