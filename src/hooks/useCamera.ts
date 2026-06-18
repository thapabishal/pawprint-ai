import { useCallback, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useCatchStore } from '../stores/catchStore';
import { IMAGE_MAX_SIZE_KB } from '../lib/constants';

export const useCamera = () => {
  const setPhoto = useCatchStore((state) => state.setPhoto);
  const photoDataUrl = useCatchStore((state) => state.draft.photo_dataurl);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const capturePhoto = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    setError(null);

    const options = {
      maxSizeMB: IMAGE_MAX_SIZE_KB / 1024,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
      initialQuality: 0.85,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPhoto(base64data, compressedFile.size);
        setIsCapturing(false);
      };
      reader.onerror = () => {
        setError('Failed to read compressed image');
        setIsCapturing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Error compressing image');
      setIsCapturing(false);
    }
  }, [setPhoto]);

  const retakePhoto = useCallback(() => {
    setPhoto(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setPhoto]);

  return {
    photoDataUrl,
    isCapturing,
    error,
    capturePhoto,
    retakePhoto,
    fileInputRef,
  };
};
