import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Syringe, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgrammeType } from '@/types';

interface ModeSelectorProps {
  onSelect: (type: ProgrammeType) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[12px] font-bold rounded-full uppercase tracking-[0.1em] mb-4">
          Select Activity
        </span>
        <h1 className="text-[32px] font-extrabold text-dark leading-tight tracking-tight">
          What are we doing <br/>today?
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <ModeCard
          title="CNVR Programme"
          description="Catch, Neuter, Vaccinate, and Release"
          icon={<Scissors className="w-8 h-8" />}
          color="teal"
          onClick={() => onSelect('cnvr')}
          delay={0.1}
        />

        <ModeCard
          title="Field Vaccination"
          description="Direct on-site vaccination and release"
          icon={<Syringe className="w-8 h-8" />}
          color="amber"
          onClick={() => onSelect('vaccination')}
          delay={0.2}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-[14px] text-muted text-center max-w-[240px]"
      >
        You can always change the mode later from the header toggle.
      </motion.p>
    </div>
  );
};

interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'teal' | 'amber';
  onClick: () => void;
  delay: number;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, icon, color, onClick, delay }) => {
  const isTeal = color === 'teal';

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden group p-6 rounded-[24px] border-[1.5px] text-left transition-all duration-300",
        isTeal
          ? "bg-white border-primary/10 hover:border-primary/30 hover:shadow-teal-glow"
          : "bg-white border-accent/10 hover:border-accent/30 hover:shadow-amber-glow"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-[18px] flex items-center justify-center mb-4 transition-colors duration-300",
        isTeal ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white"
      )}>
        {icon}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-[20px] font-bold text-dark mb-1">{title}</h3>
          <p className="text-[14px] text-muted leading-snug">{description}</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isTeal ? "text-primary/30 group-hover:text-primary" : "text-accent/30 group-hover:text-accent"
        )}>
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </motion.button>
  );
};
