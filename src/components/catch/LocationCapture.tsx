import React from 'react';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useCatchStore } from '../../stores/catchStore';

export const LocationCapture: React.FC = () => {
  const { gpsStatus, locationAccuracy } = useCatchStore();

  const getStatusConfig = () => {
    switch (gpsStatus) {
      case 'requesting':
        return {
          color: 'bg-amber-100 text-amber-700',
          icon: <Loader2 size={16} className="animate-spin" />,
          label: 'Requesting GPS...',
        };
      case 'good':
        return {
          color: 'bg-green-100 text-green-700',
          icon: <MapPin size={16} />,
          label: `Good GPS (${locationAccuracy}m)`,
        };
      case 'moderate':
        return {
          color: 'bg-amber-100 text-amber-700',
          icon: <MapPin size={16} />,
          label: `Moderate GPS (${locationAccuracy}m)`,
        };
      case 'failed':
        return {
          color: 'bg-amber-100 text-amber-700',
          icon: <AlertTriangle size={16} />,
          label: 'GPS Failed',
        };
      case 'idle':
      default:
        return {
          color: 'bg-gray-100 text-gray-700',
          icon: <MapPin size={16} />,
          label: 'GPS Idle',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col items-center w-full space-y-2 py-2">
      <div className={`flex items-center px-4 py-1.5 rounded-full space-x-2 h-8 ${config.color} border border-transparent ${gpsStatus === 'requesting' ? 'animate-pulse' : ''}`}>
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
      {gpsStatus === 'failed' && (
        <p className="text-xs text-amber-600 font-medium text-center">
          This is OK — you can add location notes below
        </p>
      )}
    </div>
  );
};
