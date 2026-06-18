import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_BUCKET, UPLOAD_QUEUE_KEY } from '@/lib/constants';
import type { CatchDraft, Sex, AgeGroup, Condition } from '@/types';

interface QueuedUpload extends CatchDraft {
  retries: number;
  last_error?: string;
}

export const useSubmitCatch = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (dogId: string, eventId: string, dataUrl: string) => {
    const blob = await fetch(dataUrl).then(r => r.blob());
    const fileName = `${dogId}/${eventId}_${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    // Update dog cover image and create dog_image record
    await supabase.from('dogs').update({ cover_image_url: publicUrl }).eq('id', dogId);
    await supabase.from('dog_images').insert({
      dog_id: dogId,
      event_id: eventId,
      image_url: publicUrl,
      is_cover: true
    });

    return publicUrl;
  };

  const submitCatch = async (draft: CatchDraft) => {
    setIsSubmitting(true);
    try {
      // 1. Create dog and event via RPC
      const { data, error: rpcError } = await supabase.rpc('create_catch_event', {
        p_sex: draft.sex as Sex,
        p_age_group: draft.age_group as AgeGroup,
        p_condition: draft.condition as Condition,
        p_visual_tags: draft.visual_tags as unknown as Record<string, unknown>,
        p_location: draft.location ? `POINT(${draft.location.lng} ${draft.location.lat})` : null,
        p_location_accuracy: draft.location_accuracy,
        p_handler_name: draft.handler_name,
        p_notes: draft.notes
      });

      if (rpcError) throw rpcError;

      const { dog_id, event_id } = data as { dog_id: string; event_id: string };

      // 2. Upload image if exists
      if (draft.photo_dataurl) {
        try {
          await uploadImage(dog_id, event_id, draft.photo_dataurl);
        } catch (uploadError) {
          console.error('Image upload failed, queuing for retry', uploadError);
          queueUpload({ ...draft, id: dog_id, retries: 0 });
          toast({
            title: "Catch saved, but photo failed",
            description: "We'll retry uploading the photo when you're back online.",
          });
        }
      }

      return { dog_id, event_id };
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Submission failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const queueUpload = (queued: QueuedUpload) => {
    const queue: QueuedUpload[] = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || '[]');
    queue.push(queued);
    localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queue));
  };

  return { submitCatch, isSubmitting };
};
