import React from 'react';
import { useCatchStore } from '../../stores/catchStore';
import type { Sex, AgeGroup, Condition } from '../../types';
import { cn } from '../../lib/utils';

interface OptionProps<T> {
  label: string;
  sublabel?: string;
  emoji: string;
  value: T;
  isSelected: boolean;
  onClick: (value: T) => void;
  isCritical?: boolean;
}

function SelectorOption<T extends string>({
  label,
  sublabel,
  emoji,
  value,
  isSelected,
  onClick,
  isCritical,
}: OptionProps<T>) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "flex-1 flex flex-col items-center justify-center min-h-[64px] rounded-[12px] border-[1.5px] transition-all duration-150 active:scale-[0.96]",
        isSelected
          ? (isCritical
              ? "bg-[#FEE2E2] border-[#EF4444] text-[#EF4444]"
              : "bg-[#E6F7F6] border-[#0D7377] text-[#0D7377]")
          : (isCritical
              ? "bg-[#FFF5F5] border-[#FECACA] text-[#374151] hover:bg-[#FEE2E2]/50"
              : "bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]")
      )}
    >
      <span className="text-[22px] mb-0.5">{emoji}</span>
      <span className={cn("text-[12px] font-medium leading-none", isSelected ? "text-inherit" : "text-[#374151]")}>{label}</span>
      {sublabel && (
        <span className={cn("text-[10px] mt-0.5 leading-none", isSelected ? "text-inherit/80" : "text-[#9CA3AF]")}>
          {sublabel}
        </span>
      )}
    </button>
  );
}

export const VitalsSelector: React.FC = () => {
  const { draft, setSex, setAgeGroup, setCondition } = useCatchStore();
  const { sex, age_group: ageGroup, condition } = draft;

  const sexOptions: { label: string; emoji: string; value: Sex }[] = [
    { label: 'Male', emoji: '♂️', value: 'male' },
    { label: 'Female', emoji: '♀️', value: 'female' },
    { label: 'Unknown', emoji: '❓', value: 'unknown' },
  ];

  const ageOptions: { label: string; sublabel?: string; emoji: string; value: AgeGroup }[] = [
    { label: 'Puppy', sublabel: '< 6 mo', emoji: '🍼', value: 'puppy' },
    { label: 'Adult', sublabel: '1-7 yrs', emoji: '🐕', value: 'adult' },
    { label: 'Senior', sublabel: '8+ yrs', emoji: '👵', value: 'senior' },
  ];

  const conditionOptions: { label: string; emoji: string; value: Condition; isCritical?: boolean }[] = [
    { label: 'Healthy', emoji: '✅', value: 'healthy' },
    { label: 'Injured', emoji: '🩹', value: 'injured' },
    { label: 'Critical', emoji: '🚨', value: 'critical', isCritical: true },
  ];

  return (
    <div className="w-full space-y-6 px-4 py-2">
      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Sex</label>
        <div className="flex gap-2">
          {sexOptions.map((opt) => (
            <SelectorOption
              key={opt.value}
              {...opt}
              isSelected={sex === opt.value}
              onClick={setSex}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Age Group</label>
        <div className="flex gap-2">
          {ageOptions.map((opt) => (
            <SelectorOption
              key={opt.value}
              {...opt}
              isSelected={ageGroup === opt.value}
              onClick={setAgeGroup}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Condition</label>
        <div className="flex gap-2">
          {conditionOptions.map((opt) => (
            <SelectorOption
              key={opt.value}
              {...opt}
              isSelected={condition === opt.value}
              onClick={setCondition}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
