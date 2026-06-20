import React from 'react';
import { Scissors, Syringe } from 'lucide-react';
import { useCatchStore } from '../../stores/catchStore';
import { cn } from '../../lib/utils';
import type { ProgrammeType } from '../../types';

export const ProgrammeToggle: React.FC = () => {
  const { draft, setProgrammeType } = useCatchStore();
  const activeType = draft.programme_type;

  const handleToggle = (type: ProgrammeType) => {
    setProgrammeType(type);
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="relative w-full h-[48px] bg-[#F3F4F6] rounded-[12px] p-1 flex items-center">
        {/* Sliding Pill */}
        <div
          className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[10px] shadow-sm transition-transform duration-200 ease-out",
            activeType === 'vaccination' ? "translate-x-[100%]" : "translate-x-0"
          )}
        />

        {/* CNVR Segment */}
        <button
          onClick={() => handleToggle('cnvr')}
          className={cn(
            "relative flex-1 h-full flex items-center justify-center gap-2 text-[14px] font-bold transition-colors duration-200 z-10",
            activeType === 'cnvr' ? "text-[#0D7377]" : "text-[#9CA3AF]"
          )}
        >
          <Scissors className="w-4 h-4" />
          <span>CNVR</span>
        </button>

        {/* Vaccination Segment */}
        <button
          onClick={() => handleToggle('vaccination')}
          className={cn(
            "relative flex-1 h-full flex items-center justify-center gap-2 text-[14px] font-bold transition-colors duration-200 z-10",
            activeType === 'vaccination' ? "text-[#F0A500]" : "text-[#9CA3AF]"
          )}
        >
          <Syringe className="w-4 h-4" />
          <span>On-Site Vaccination</span>
        </button>
      </div>

      {/* Hint Text */}
      <p className="text-[12px] text-[#9CA3AF] px-1">
        {activeType === 'cnvr'
          ? "Catch → Clinic → Neuter → Return"
          : "Catch → Vaccinate → Release same day"}
      </p>
    </div>
  );
};
