import { useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { useCatchStore } from '../stores/catchStore';

export const useCamera = () => {
  const setPhoto = useCatchStore((state) => state.setPhoto);

  const capturePhoto = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 0.8, // IMAGE_MAX_SIZE_KB is 800
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.85,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPhoto(base64data, compressedFile.size);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
    }
  }, [setPhoto]);

  return { capturePhoto };
};
