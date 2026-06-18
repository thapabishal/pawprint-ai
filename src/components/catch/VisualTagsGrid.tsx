import React from 'react';
import { useCatchStore } from '../../stores/catchStore';
import type { EarType, CoatColor, Marking } from '../../types';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface TagCardProps {
  label: string;
  description?: string;
  swatch?: string;
  isGradient?: boolean;
  gradientClass?: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const TagCard: React.FC<TagCardProps> = ({
  label,
  description,
  swatch,
  isGradient,
  gradientClass,
  isSelected,
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-[12px] border-[1.5px] transition-all duration-150 active:scale-[0.96] text-center",
        isSelected
          ? "bg-[#E6F7F6] border-[#0D7377] text-[#0D7377]"
          : "bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]",
        className
      )}
    >
      {swatch && (
        <div
          className={cn(
            "w-6 h-6 rounded-full mb-1.5 border border-[#E5E7EB]",
            isGradient ? gradientClass : ""
          )}
          style={!isGradient ? { backgroundColor: swatch } : undefined}
        />
      )}
      <span className="text-[12px] font-semibold leading-tight">{label}</span>
      {description && (
        <span className="text-[10px] italic text-[#9CA3AF] mt-0.5 leading-tight">{description}</span>
      )}
    </button>
  );
};

const MarkingCard: React.FC<{
  label: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-start px-4 h-[56px] rounded-[12px] border-[1.5px] transition-all duration-150 active:scale-[0.96]",
        isSelected
          ? "bg-[#E6F7F6] border-[#0D7377] text-[#0D7377]"
          : "bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
      )}
    >
      <span className="text-[12px] font-semibold">{label}</span>
      <div className={cn(
        "absolute top-2 right-2 w-[18px] h-[18px] rounded-full border transition-all duration-150 flex items-center justify-center",
        isSelected
          ? "bg-[#0D7377] border-[#0D7377] scale-110"
          : "border-[#D1D5DB] bg-transparent"
      )}>
        {isSelected && <Check className="w-3 h-3 text-white stroke-[3px]" />}
      </div>
    </button>
  );
};

export const VisualTagsGrid: React.FC = () => {
  const { draft, setVisualTags } = useCatchStore();
  const tags = draft.visual_tags;

  const updateEars = (ears: EarType) => {
    setVisualTags({ ...tags, ears });
  };

  const updateCoat = (coat: CoatColor) => {
    setVisualTags({ ...tags, coat });
  };

  const toggleMarking = (marking: Marking) => {
    const currentMarkings = tags.markings || [];
    const newMarkings = currentMarkings.includes(marking)
      ? currentMarkings.filter(m => m !== marking)
      : [...currentMarkings, marking];
    setVisualTags({ ...tags, markings: newMarkings });
  };

  return (
    <div className="w-full space-y-8 px-4 py-4">
      {/* EARS */}
      <section className="space-y-3">
        <h3 className="text-[14px] font-bold text-[#111827] border-l-[3px] border-[#0D7377] pl-3">EARS</h3>
        <div className="grid grid-cols-3 gap-2">
          <TagCard
            label="Prick" description="Upright, pointed"
            isSelected={tags.ears === 'prick'} onClick={() => updateEars('prick')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Semi-floppy" description="Tips fold forward"
            isSelected={tags.ears === 'semi_floppy'} onClick={() => updateEars('semi_floppy')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Floppy" description="Hang down"
            isSelected={tags.ears === 'fully_floppy'} onClick={() => updateEars('fully_floppy')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Cropped" description="Cut short"
            isSelected={tags.ears === 'cropped'} onClick={() => updateEars('cropped')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Torn" description="Damaged edges"
            isSelected={tags.ears === 'torn_notched'} onClick={() => updateEars('torn_notched')}
            className="min-h-[64px]"
          />
        </div>
      </section>

      {/* COAT */}
      <section className="space-y-3">
        <h3 className="text-[14px] font-bold text-[#111827] border-l-[3px] border-[#0D7377] pl-3">COAT</h3>
        <div className="grid grid-cols-3 gap-2">
          <TagCard
            label="Red/Brown" description="(Common)" swatch="#C2691A"
            isSelected={tags.coat === 'red_brown'} onClick={() => updateCoat('red_brown')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Black" swatch="#1F2937"
            isSelected={tags.coat === 'black'} onClick={() => updateCoat('black')}
            className="min-h-[64px]"
          />
          <TagCard
            label="White" swatch="#F8FAFC"
            isSelected={tags.coat === 'white'} onClick={() => updateCoat('white')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Grey" swatch="#9CA3AF"
            isSelected={tags.coat === 'grey'} onClick={() => updateCoat('grey')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Brindle" isGradient gradientClass="bg-gradient-to-br from-[#8B4513] via-[#D2691E] to-[#8B4513]"
            isSelected={tags.coat === 'brindle'} onClick={() => updateCoat('brindle')}
            className="min-h-[64px]"
          />
          <TagCard
            label="Mixed" isGradient gradientClass="bg-[conic-gradient(from_0deg,#F8FAFC_0deg_180deg,#1F2937_180deg_360deg)]"
            isSelected={tags.coat === 'mixed'} onClick={() => updateCoat('mixed')}
            className="min-h-[64px]"
          />
        </div>
      </section>

      {/* MARKINGS */}
      <section className="space-y-3">
        <div className="flex flex-col">
          <h3 className="text-[14px] font-bold text-[#111827] border-l-[3px] border-[#0D7377] pl-3">MARKINGS</h3>
          <span className="text-[11px] text-[#9CA3AF] italic mt-1 ml-4">Select all that apply</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MarkingCard
            label="White Chest"
            isSelected={tags.markings?.includes('white_chest') ?? false}
            onClick={() => toggleMarking('white_chest')}
          />
          <MarkingCard
            label="White Paws"
            isSelected={tags.markings?.includes('white_paws') ?? false}
            onClick={() => toggleMarking('white_paws')}
          />
          <MarkingCard
            label="Black Mask"
            isSelected={tags.markings?.includes('black_mask') ?? false}
            onClick={() => toggleMarking('black_mask')}
          />
          <MarkingCard
            label="Sickle Tail"
            isSelected={tags.markings?.includes('sickle_tail') ?? false}
            onClick={() => toggleMarking('sickle_tail')}
          />
          <MarkingCard
            label="Curled Tail"
            isSelected={tags.markings?.includes('curled_tail') ?? false}
            onClick={() => toggleMarking('curled_tail')}
          />
        </div>
      </section>
    </div>
  );
};
