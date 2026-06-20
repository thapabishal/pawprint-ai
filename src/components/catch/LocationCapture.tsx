import React from 'react';
import { MapPin, CheckCircle, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useGPS } from '../../hooks/useGPS';
import { cn } from '../../lib/utils';

export const LocationCapture: React.FC = () => {
  const { status, accuracy } = useGPS();

  const getStatusConfig = () => {
    switch (status) {
      case 'requesting':
        return {
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#9CA3AF]',
          icon: <MapPin size={16} className="animate-spin" />,
          label: 'Requesting...',
        };
      case 'success':
        if (accuracy !== null && accuracy <= 20) {
          return {
            bg: 'bg-[#D1FAE5]',
            text: 'text-[#065F46]',
            icon: <CheckCircle size={16} />,
            label: `±${Math.round(accuracy)}m`,
          };
        } else if (accuracy !== null && accuracy <= 50) {
          return {
            bg: 'bg-[#FEF3C7]',
            text: 'text-[#92400E]',
            icon: <AlertCircle size={16} />,
            label: `±${Math.round(accuracy)}m`,
          };
        } else {
          return {
            bg: 'bg-[#FEF3C7]',
            text: 'text-[#92400E]',
            icon: <AlertTriangle size={16} />,
            label: accuracy !== null ? `±${Math.round(accuracy)}m` : 'Poor GPS',
          };
        }
      case 'failed':
      case 'unavailable':
        return {
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
          icon: <XCircle size={16} />,
          label: 'Failed',
        };
      default:
        return {
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#9CA3AF]',
          icon: <MapPin size={16} />,
          label: 'Idle',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col items-center w-full py-2">
      <div
        className={cn(
          'inline-flex items-center px-3 h-8 rounded-full gap-1.5 transition-colors duration-300',
          config.bg,
          config.text
        )}
      >
        <span className="flex-shrink-0">{config.icon}</span>
        <span className="text-[12px] font-semibold leading-none">{config.label}</span>
      </div>
      {(status === 'failed' || status === 'unavailable') && (
        <p className="mt-1 text-[11px] text-[#6B7280] font-medium leading-none">
          Location unavailable — add notes below
        </p>
      )}
    </div>
  );
};
