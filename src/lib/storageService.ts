import { supabase } from './supabase';
import { STORAGE_BUCKET } from './constants';

export interface UploadResult {
  publicUrl: string;
  dogId: string;
  eventId: string | null;
}

export const storageService = {
  /**
   * Uploads a dog photo to Supabase Storage and updates the database.
   * Uploads both a unique historical record and a constant cover.webp.
   */
  async uploadDogCover(
    dogId: string,
    eventId: string | null,
    file: File | Blob
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const coverPath = `${dogId}/cover.webp`;
    const historicalPath = eventId ? `${dogId}/${eventId}_${timestamp}.jpg` : null;

    // 1. Upload historical record if eventId is provided
    if (historicalPath) {
      const { error: histError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(historicalPath, file, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true,
        });
      if (histError) console.warn('Historical photo upload failed:', histError.message);
    }

    // 2. Upload/Update the cover photo
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(coverPath, file, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 3. Get Public URL for the cover
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(coverPath);

    // 4. Update dogs table cover URL
    // @ts-expect-error - Supabase generic types can be finicky
    const { error: dogUpdateError } = await (supabase.from('dogs').update as (args: unknown) => { eq: (col: string, val: string) => Promise<{ error: Error | null }> })({
      cover_image_url: publicUrl
    }).eq('id', dogId);

    if (dogUpdateError) {
      throw new Error(`Failed to update dog cover URL: ${dogUpdateError.message}`);
    }

    // 5. Insert into dog_images table referencing the unique path if possible, otherwise cover
    const imagePath = historicalPath || coverPath;
    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(imagePath);

    // @ts-expect-error - Supabase generic types can be finicky
    const { error: imageInsertError } = await (supabase.from('dog_images').insert as (args: unknown) => Promise<{ error: Error | null }>)({
      dog_id: dogId,
      event_id: eventId,
      image_url: imageUrl,
      is_cover: true,
    });

    if (imageInsertError) {
      console.warn('Failed to insert dog_images record:', imageInsertError.message);
    }

    return {
      publicUrl,
      dogId,
      eventId,
    };
  },
};
