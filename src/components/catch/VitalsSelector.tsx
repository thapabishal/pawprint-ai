import React from 'react';
import { useCatchStore } from '../../stores/catchStore';
import type { Sex, AgeGroup, Condition } from '../../types';

interface OptionProps<T> {
  label: string;
  emoji: string;
  value: T;
  isSelected: boolean;
  onClick: (value: T) => void;
  isCritical?: boolean;
}

function SelectorOption<T extends string>({
  label,
  emoji,
  value,
  isSelected,
  onClick,
  isCritical,
}: OptionProps<T>) {
  const baseClasses = "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-150 h-16 active:scale-[0.97]";

  let dynamicClasses = "";
  if (isSelected) {
    if (isCritical) {
      dynamicClasses = "bg-[#FEE2E2] border-[#DC2626] text-[#DC2626] font-semibold shadow-sm";
    } else {
      dynamicClasses = "bg-[#E6F7F6] border-[#0D7377] text-[#0D7377] font-semibold shadow-sm";
    }
  } else {
    if (isCritical) {
      dynamicClasses = "bg-[#FFF5F5] border-[#FECACA] text-[#374151]";
    } else {
      dynamicClasses = "bg-white border-[#E5E7EB] text-[#374151]";
    }
  }

  return (
    <button
      onClick={() => onClick(value)}
      className={`${baseClasses} ${dynamicClasses}`}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-[13px] leading-tight">{label}</span>
    </button>
  );
}

export const VitalsSelector: React.FC = () => {
  const { sex, ageGroup, condition, setSex, setAgeGroup, setCondition } = useCatchStore();

  const sexOptions: { label: string; emoji: string; value: Sex }[] = [
    { label: 'Male', emoji: '♂️', value: 'male' },
    { label: 'Female', emoji: '♀️', value: 'female' },
    { label: 'Unknown', emoji: '❓', value: 'unknown' },
  ];

  const ageOptions: { label: string; emoji: string; value: AgeGroup }[] = [
    { label: 'Puppy', emoji: '🍼', value: 'puppy' },
    { label: 'Adult', emoji: '🐕', value: 'adult' },
    { label: 'Senior', emoji: '👵', value: 'senior' },
  ];

  const conditionOptions: { label: string; emoji: string; value: Condition; isCritical?: boolean }[] = [
    { label: 'Healthy', emoji: '✅', value: 'healthy' },
    { label: 'Injured', emoji: '🩹', value: 'injured' },
    { label: 'Critical', emoji: '🚨', value: 'critical', isCritical: true },
  ];

  return (
    <div className="w-full space-y-6 px-4 py-2">
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Sex</label>
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

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Age Group</label>
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

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Condition</label>
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
