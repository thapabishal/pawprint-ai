import { supabase } from './supabase';
import { STORAGE_BUCKET } from './constants';

export interface UploadResult {
  publicUrl: string;
  dogId: string;
  eventId: string | null;
}

export const storageService = {
  /**
   * Uploads a dog cover photo to Supabase Storage and updates the database.
   * This is a reusable service for both immediate and queued uploads.
   */
  async uploadDogCover(
    dogId: string,
    eventId: string | null,
    file: File | Blob
  ): Promise<UploadResult> {
    const filePath = `${dogId}/cover.webp`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true, // Allow overwriting if cover already exists
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // 3. Update dogs table
    // @ts-expect-error - Supabase generic types can be finicky in service modules
    const { error: dogUpdateError } = await (supabase.from('dogs').update as (args: unknown) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> })({
      cover_image_url: publicUrl
    }).eq('id', dogId);

    if (dogUpdateError) {
      throw new Error(`Failed to update dog cover URL: ${dogUpdateError.message}`);
    }

    // 4. Insert into dog_images table
    // @ts-expect-error - Supabase generic types can be finicky in service modules
    const { error: imageInsertError } = await (supabase.from('dog_images').insert as (args: unknown) => Promise<{ error: Error | null }>)({
      dog_id: dogId,
      event_id: eventId,
      image_url: publicUrl,
      is_cover: true,
    });

    if (imageInsertError) {
      // Log warning but don't fail the whole process if the main URL was updated
      console.warn('Failed to insert dog_images record:', imageInsertError.message);
    }

    return {
      publicUrl,
      dogId,
      eventId,
    };
  },
};
