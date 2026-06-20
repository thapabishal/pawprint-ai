import React from 'react';
import { CheckCircle2, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ReleaseSuccessProps {
  onDone: () => void;
  catchLocationName?: string;
  releaseLocationName?: string;
  daysInProgramme: number;
}

export const ReleaseSuccess: React.FC<ReleaseSuccessProps> = ({
  onDone,
  catchLocationName = "Unknown",
  releaseLocationName = "Current Location",
  daysInProgramme
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-[#10B981]/20 rounded-full scale-150 animate-ping opacity-25" />
        <CheckCircle2 className="w-24 h-24 text-[#10B981] relative z-10" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-black text-gray-900 mb-2">Dog Released! 🏠</h2>
      <p className="text-gray-500 mb-8 font-medium">Successfully logged at {format(new Date(), 'HH:mm')}</p>

      <div className="w-full grid grid-cols-2 gap-4 mb-10">
        <div className="bg-[#F9FAFB] p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mb-1">
            <MapPin className="w-3 h-3" /> Caught
          </div>
          <div className="text-[13px] font-bold text-gray-800 truncate">
            {catchLocationName}
          </div>
        </div>
        <div className="bg-[#F9FAFB] p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 uppercase mb-1">
            <MapPin className="w-3 h-3" /> Released
          </div>
          <div className="text-[13px] font-bold text-gray-800 truncate">
            {releaseLocationName}
          </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <div className="text-[14px] font-medium text-gray-500 mb-1">Total time in programme</div>
        <div className="text-3xl font-black text-[#0D7377]">
          {daysInProgramme} <span className="text-lg font-bold">days</span>
        </div>
      </div>

      <Button
        className="w-full h-16 bg-[#0D7377] hover:bg-[#0A5A5D] text-white rounded-[16px] text-[18px] font-bold shadow-lg shadow-teal-900/20"
        onClick={onDone}
      >
        View Full Profile <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
};

export default ReleaseSuccess;
