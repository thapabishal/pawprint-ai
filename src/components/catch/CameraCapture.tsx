import React, { useRef, useState } from 'react';
import { Camera, RefreshCcw, Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { useCatchStore } from '../../stores/catchStore';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';

export const CameraCapture: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { draft, setPhoto } = useCatchStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string, compressedFile.size);
        setIsProcessing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Compression error:', err);
      setIsProcessing(false);
    }
  };

  const clearPhoto = () => setPhoto(null, null);

  const isVaccination = draft.programme_type === 'vaccination';

  return (
    <div className="px-5">
      <AnimatePresence mode="wait">
        {draft.photo_dataurl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden shadow-elevated border-[1.5px] border-white group"
          >
            <img
              src={draft.photo_dataurl}
              alt="Dog preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 glass-card rounded-full flex items-center justify-center text-dark hover:scale-110 transition-transform"
              >
                <RefreshCcw className="w-5 h-5" />
              </button>
              <button
                onClick={clearPhoto}
                className="w-10 h-10 bg-red-500/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-[11px] font-bold text-dark uppercase tracking-wider">Photo Captured</span>
              </div>
              {draft.photo_size && (
                <span className="text-[10px] font-medium text-white/80">
                  ${(draft.photo_size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={cn(
                "w-full aspect-[4/3] rounded-[28px] border-[2px] border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-300",
                isVaccination
                  ? "border-accent/30 bg-accent/[0.02] hover:border-accent hover:bg-accent/[0.05]"
                  : "border-primary/30 bg-primary/[0.02] hover:border-primary hover:bg-primary/[0.05]"
              )}
            >
              <div className={cn(
                "w-20 h-20 rounded-[24px] flex items-center justify-center transition-colors duration-300",
                isVaccination ? "bg-accent text-white" : "bg-primary text-white"
              )}>
                {isProcessing ? (
                  <RefreshCcw className="w-8 h-8 animate-spin" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
              </div>
              <div className="text-center">
                <span className="text-[17px] font-bold text-dark block">Capture Photo</span>
                <span className="text-[13px] text-muted font-medium block mt-1">Identification & records</span>
              </div>

              <div className="absolute bottom-6 flex items-center gap-1.5 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/40">
                <ImageIcon className="w-4 h-4 text-muted" />
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Tap to open camera</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
    </div>
  );
};
