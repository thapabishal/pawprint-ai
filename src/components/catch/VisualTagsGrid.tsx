import React from 'react';
import { useCatchStore } from '../../stores/catchStore';
import { cn } from '../../lib/utils';
import type { EarType, CoatColor, Marking, VisualTags } from '../../types';
import { motion } from 'framer-motion';

export const VisualTagsGrid: React.FC = () => {
  const { draft, setVisualTags } = useCatchStore();
  const tags = draft.visual_tags;

  const updateTags = (key: keyof VisualTags, value: any) => {
    setVisualTags({ ...tags, [key]: value });
  };

  const toggleMarking = (marking: Marking) => {
    const current = tags.markings || [];
    const updated = current.includes(marking)
      ? current.filter((m) => m !== marking)
      : [...current, marking];
    updateTags('markings', updated);
  };

  const earOptions: { label: string; icon: string; value: EarType }[] = [
    { label: 'Prick', icon: '👂', value: 'prick' },
    { label: 'Semi-Floppy', icon: '🐶', value: 'semi_floppy' },
    { label: 'Fully-Floppy', icon: '🐕', value: 'fully_floppy' },
    { label: 'Cropped', icon: '✂️', value: 'cropped' },
    { label: 'Torn/Notched', icon: '🏷️', value: 'torn_notched' },
  ];

  const coatOptions: { label: string; color: string; value: CoatColor }[] = [
    { label: 'Red/Brown', color: 'bg-[#B45309]', value: 'red_brown' },
    { label: 'Black', color: 'bg-black', value: 'black' },
    { label: 'White', color: 'bg-white border-border border', value: 'white' },
    { label: 'Grey', color: 'bg-gray-400', value: 'grey' },
    { label: 'Brindle', color: 'bg-yellow-700 opacity-80', value: 'brindle' },
    { label: 'Mixed', color: 'bg-gradient-to-br from-black via-brown-600 to-white', value: 'mixed' },
  ];

  const markingOptions: { label: string; icon: string; value: Marking }[] = [
    { label: 'White Chest', icon: '👕', value: 'white_chest' },
    { label: 'White Paws', icon: '🐾', value: 'white_paws' },
    { label: 'Black Mask', icon: '🎭', value: 'black_mask' },
    { label: 'Sickle Tail', icon: '🌙', value: 'sickle_tail' },
    { label: 'Curled Tail', icon: '🌀', value: 'curled_tail' },
  ];

  const isVaccination = draft.programme_type === 'vaccination';

  return (
    <div className="space-y-8">
      {/* Ears Section */}
      <section className="space-y-3 px-5">
        <label className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em] ml-1">Ear Type</label>
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-5 px-5">
          {earOptions.map((opt) => (
            <TagButton
              key={opt.value}
              label={opt.label}
              icon={<span className="text-[20px]">{opt.icon}</span>}
              isSelected={tags.ears === opt.value}
              onClick={() => updateTags('ears', opt.value)}
              isVaccination={isVaccination}
            />
          ))}
        </div>
      </section>

      {/* Coat Color Section */}
      <section className="space-y-3 px-5">
        <label className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em] ml-1">Coat Color</label>
        <div className="grid grid-cols-3 gap-3">
          {coatOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateTags('coat', opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-[20px] border-[1.5px] transition-all duration-300",
                tags.coat === opt.value
                  ? (isVaccination ? "border-accent bg-accent/5" : "border-primary bg-primary/5")
                  : "border-border bg-white"
              )}
            >
              <div className={cn("w-10 h-10 rounded-full shadow-inner", opt.color)} />
              <span className={cn("text-[11px] font-bold", tags.coat === opt.value ? "text-dark" : "text-muted")}>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Markings Section */}
      <section className="space-y-3 px-5">
        <label className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em] ml-1">Distinct Markings</label>
        <div className="flex flex-wrap gap-2">
          {markingOptions.map((opt) => (
            <TagButton
              key={opt.value}
              label={opt.label}
              icon={<span className="text-[18px]">{opt.icon}</span>}
              isSelected={tags.markings?.includes(opt.value)}
              onClick={() => toggleMarking(opt.value)}
              isVaccination={isVaccination}
              small
            />
          ))}
        </div>
      </section>
    </div>
  );
};

interface TagButtonProps {
  label: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  onClick: () => void;
  isVaccination?: boolean;
  small?: boolean;
}

const TagButton: React.FC<TagButtonProps> = ({ label, icon, isSelected, onClick, isVaccination, small }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center rounded-[20px] border-[1.5px] transition-all duration-300 shrink-0",
      small ? "px-4 py-3 min-w-[100px]" : "w-[100px] h-[100px]",
      isSelected
        ? (isVaccination ? "bg-accent/10 border-accent text-accent shadow-sm" : "bg-primary/10 border-primary text-primary shadow-sm")
        : "bg-white border-border text-body hover:border-muted"
    )}
  >
    {icon}
    <span className={cn("mt-1.5 font-bold text-center leading-tight", small ? "text-[11px]" : "text-[12px]")}>{label}</span>
  </motion.button>
);
