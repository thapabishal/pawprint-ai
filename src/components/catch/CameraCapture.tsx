import React from 'react';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export const CameraCapture: React.FC = () => {
  const { photoDataUrl, capturePhoto, retakePhoto, fileInputRef } = useCamera();

  const handleAreaClick = () => {
    if (!photoDataUrl) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full space-y-3 px-4">
      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={capturePhoto}
      />

      {/* Capture Area */}
      <button
        onClick={handleAreaClick}
        disabled={!!photoDataUrl}
        className={cn(
          "relative w-full h-[200px] rounded-[16px] border-2 transition-all duration-200 overflow-hidden flex flex-col items-center justify-center",
          photoDataUrl
            ? "border-transparent"
            : "border-dashed border-[#D1D5DB] bg-white hover:border-[#0D7377] hover:bg-[#F0FDFA] active:scale-[0.98]"
        )}
      >
        {photoDataUrl ? (
          <>
            <img
              src={photoDataUrl}
              alt="Freshly captured photo of the dog"
              className="w-full h-full object-cover"
            />
            {/* Success Badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-full border border-[#065F46]/10">
              <Check size={12} strokeWidth={3} />
              <span className="text-[12px] font-bold">Photo</span>
            </div>
            {/* Retake Button Overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                retakePhoto();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-3 right-3 h-8 w-8 flex items-center justify-center bg-white text-[#374151] rounded-full shadow-sm active:scale-90 transition-transform"
            >
              <RotateCcw size={18} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Camera size={40} className="text-[#9CA3AF]" />
            <p className="text-[15px] font-medium text-[#6B7280]">Tap to photograph dog</p>
          </div>
        )}
      </button>

      {/* Main Action Button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full h-[60px] rounded-[12px] text-[16px] font-semibold transition-all shadow-[0_0_20px_rgba(13,115,119,0.2)] active:scale-[0.96]",
          "bg-[#0D7377] hover:bg-[#0D7377]/90 text-white"
        )}
      >
        <Camera size={20} className="mr-2" />
        {photoDataUrl ? 'Retake Photo' : 'Take Photo'}
      </Button>
    </div>
  );
};
