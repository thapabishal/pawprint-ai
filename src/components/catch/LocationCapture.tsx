import React, { useEffect } from 'react';
import { MapPin, RefreshCw, Navigation } from 'lucide-react';
import { useGPS } from '../../hooks/useGPS';
import { useCatchStore } from '../../stores/catchStore';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export const LocationCapture: React.FC = () => {
  const { location, accuracy, status, error, requestLocation } = useGPS();
  const { setLocation, setGpsStatus, setGpsError, draft } = useCatchStore();

  useEffect(() => {
    if (location) {
      setLocation(location, accuracy);
    }
    setGpsStatus(status);
    setGpsError(error);
  }, [location, accuracy, status, error, setLocation, setGpsStatus, setGpsError]);

  const getAccuracyColor = (acc: number | null) => {
    if (!acc) return 'text-muted';
    if (acc < 20) return 'text-green-500';
    if (acc < 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const isVaccination = draft.programme_type === 'vaccination';
  const isLoading = status === 'requesting';

  return (
    <div className="px-5">
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => requestLocation()}
        className={cn(
          "relative group overflow-hidden bg-white rounded-[24px] border-[1.5px] border-border p-5 flex items-center gap-4 transition-all duration-300",
          isLoading ? "border-primary/30 animate-pulse" : "hover:border-primary/40"
        )}
      >
        <div className={cn(
          "w-12 h-12 rounded-[18px] flex items-center justify-center transition-colors duration-300",
          status === 'success'
            ? (isVaccination ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary")
            : "bg-gray-100 text-muted"
        )}>
          {isLoading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <MapPin className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-dark">
              {status === 'success' ? 'Location Locked' : isLoading ? 'Locating...' : 'Get GPS Location'}
            </span>
            {status === 'success' && accuracy && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-full border border-border">
                <Navigation className="w-2.5 h-2.5 text-muted rotate-45" />
                <span className={cn("text-[10px] font-bold", getAccuracyColor(accuracy))}>
                  ±{Math.round(accuracy)}m
                </span>
              </div>
            )}
          </div>
          <p className="text-[12px] text-muted font-medium mt-0.5">
            {status === 'success'
              ? `Lat: ${location?.lat.toFixed(5)}, Lng: ${location?.lng.toFixed(5)}`
              : error || 'High precision GPS recommended'}
          </p>
        </div>

        <div className="text-muted group-hover:text-primary transition-colors">
          <RefreshCw className={cn("w-5 h-5", isLoading && "hidden")} />
        </div>
      </motion.div>
    </div>
  );
};
