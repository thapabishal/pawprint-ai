import React from 'react';
import { useCatchStore } from '../../stores/catchStore';
import type { Sex, AgeGroup, Condition } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface OptionProps<T> {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  value: T;
  isSelected: boolean;
  onClick: (value: T) => void;
  isCritical?: boolean;
  isVaccination?: boolean;
}

function SelectorOption<T extends string>({
  label,
  sublabel,
  icon,
  value,
  isSelected,
  onClick,
  isCritical,
  isVaccination,
}: OptionProps<T>) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => onClick(value)}
      className={cn(
        "flex-1 flex flex-col items-center justify-center min-h-[72px] rounded-[18px] border-[1.5px] transition-all duration-300 px-2 relative overflow-hidden",
        isSelected
          ? (isCritical
              ? "bg-red-50 border-red-500 text-red-600 shadow-sm"
              : isVaccination
                ? "bg-accent/10 border-accent text-accent shadow-sm"
                : "bg-primary/10 border-primary text-primary shadow-sm")
          : (isCritical
              ? "bg-white border-red-100 text-body hover:border-red-200"
              : "bg-white border-border text-body hover:border-muted")
      )}
    >
      {isSelected && (
        <motion.div
          layoutId={`vitals-bg-${label}`}
          className="absolute inset-0 z-0 bg-current opacity-[0.03]"
        />
      )}
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-[20px] mb-1">{icon}</span>
        <span className={cn("text-[11px] font-bold leading-none uppercase tracking-wide", isSelected ? "text-inherit" : "text-body")}>{label}</span>
        {sublabel && (
          <span className={cn("text-[9px] mt-1 leading-none font-medium", isSelected ? "text-inherit/80" : "text-muted")}>
            {sublabel}
          </span>
        )}
      </div>
    </motion.button>
  );
}

export const VitalsSelector: React.FC = () => {
  const { draft, setSex, setAgeGroup, setCondition } = useCatchStore();
  const { sex, age_group: ageGroup, condition, programme_type } = draft;
  const isVaccination = programme_type === 'vaccination';

  const sexOptions: { label: string; icon: string; value: Sex }[] = [
    { label: 'Male', icon: '♂️', value: 'male' },
    { label: 'Female', icon: '♀️', value: 'female' },
    { label: 'Unknown', icon: '❓', value: 'unknown' },
  ];

  const ageOptions: { label: string; sublabel?: string; icon: string; value: AgeGroup }[] = [
    { label: 'Puppy', sublabel: '< 6 mo', icon: '🍼', value: 'puppy' },
    { label: 'Adult', sublabel: '1-7 yrs', icon: '🐕', value: 'adult' },
    { label: 'Senior', sublabel: '8+ yrs', icon: '👵', value: 'senior' },
  ];

  const conditionOptions: { label: string; icon: string; value: Condition; isCritical?: boolean }[] = [
    { label: 'Healthy', icon: '✅', value: 'healthy' },
    { label: 'Injured', icon: '🩹', value: 'injured' },
    { label: 'Critical', icon: '🚨', value: 'critical', isCritical: true },
  ];

  return (
    <div className="w-full space-y-6">
      <Section title="Sex">
        <div className="flex gap-2">
          {sexOptions.map((opt) => (
            <SelectorOption
              key={opt.value}
              {...opt}
              isSelected={sex === opt.value}
              onClick={setSex}
              isVaccination={isVaccination}
            />
          ))}
        </div>
      </Section>

      <Section title="Age Group">
        <div className="flex gap-2">
          {ageOptions.map((opt) => (
            <SelectorOption
              key={opt.value}
              {...opt}
              isSelected={ageGroup === opt.value}
              onClick={setAgeGroup}
              isVaccination={isVaccination}
            />
          ))}
        </div>
      </Section>

      <Section title="Condition">
        <div className="flex gap-2">
          {conditionOptions.map((opt) => (
            <SelectorOption
              key={opt.value}
              {...opt}
              isSelected={condition === opt.value}
              onClick={setCondition}
              isVaccination={isVaccination}
            />
          ))}
        </div>
      </Section>
    </div>
  );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3 px-5">
    <label className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em] ml-1">{title}</label>
    {children}
  </div>
);
