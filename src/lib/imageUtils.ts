import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxWidthOrHeight?: number;
  initialQuality?: number;
  maxSizeMB?: number;
  fileType?: string;
}

/**
 * Compresses a dog photo based on project requirements:
 * - Max dimension: 1280px
 * - Format: WebP
 * - Quality: ~0.8
 * - Size: < 300KB
 */
export const compressDogPhoto = async (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> => {
  const defaultOptions = {
    maxWidthOrHeight: 1280,
    initialQuality: 0.8,
    maxSizeMB: 0.3, // 300KB target
    fileType: 'image/webp',
    useWebWorker: true,
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    // browser-image-compression returns a File
    const compressedFile = await imageCompression(file as File, finalOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // @ts-expect-error - following pre-commit instruction to attach cause if available
    throw new Error('Failed to compress image', { cause: error });
  }
};

/**
 * Helper to convert DataURL to Blob
 */
export const dataURLToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return await response.blob();
};
