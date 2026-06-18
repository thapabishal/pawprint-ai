import React, { useRef } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { useCatchStore } from '../../stores/catchStore';
import { useCamera } from '../../hooks/useCamera';
import { Button } from '../ui/button';

export const CameraCapture: React.FC = () => {
  const { draft } = useCatchStore();
  const { photo_dataurl: photoDataUrl, photo_size: photoSize } = draft;
  const { capturePhoto, retakePhoto } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAreaClick = () => {
    if (!photoDataUrl) {
      fileInputRef.current?.click();
    }
  };

  const getQualityColor = () => {
    if (!photoSize) return 'bg-gray-400';
    const sizeKB = photoSize / 1024;
    if (sizeKB > 500) return 'bg-green-500';
    if (sizeKB < 200) return 'bg-amber-500';
    return 'bg-green-500'; // Default to green if in between
  };

  return (
    <div className="w-full space-y-4 px-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={capturePhoto}
      />

      <div
        onClick={handleAreaClick}
        className={`relative w-full h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden ${
          photoDataUrl ? 'border-transparent' : 'border-gray-300 bg-gray-50 active:bg-gray-100'
        }`}
      >
        {photoDataUrl ? (
          <>
            <img
              src={photoDataUrl}
              alt="Dog capture"
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                retakePhoto();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm active:scale-95 transition-transform"
            >
              <RotateCcw size={16} />
              Retake
            </button>
            {/* Quality Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${getQualityColor()}`} />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">
                {photoSize && (photoSize / 1024).toFixed(0)}KB
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Camera size={48} strokeWidth={1.5} />
            <p className="font-medium">Tap to photograph dog</p>
          </div>
        )}
      </div>

      <Button
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-20 bg-[#0D7377] hover:bg-[#0D7377]/90 text-white text-lg font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
      >
        {photoDataUrl ? 'Retake Photo' : 'Take Photo'}
      </Button>
    </div>
  );
};
