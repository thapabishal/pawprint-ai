import React from 'react';
import { Syringe, Scissors, HeartPulse, ArrowRight, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dog, UserRole } from '@/types';

interface ClinicActionsPanelProps {
  dog: Dog;
  role: UserRole;
  onAction: (type: 'vaccinate' | 'sterilize' | 'treat' | 'release' | 'died' | 'escaped') => void;
  isBoosterDue: boolean;
}

export const ClinicActionsPanel: React.FC<ClinicActionsPanelProps> = ({
  dog,
  role,
  onAction,
  isBoosterDue
}) => {
  if (role !== 'clinic_vet' && role !== 'admin') return null;

  const isVaccinated = dog.vaccination_status === 'vaccinated';
  const isSterilized = dog.sterilization_status === 'sterilized';

  const vaccinateDisabled = isVaccinated && !isBoosterDue;

  return (
    <div className="mx-4 mt-6 rounded-[16px] border border-border bg-white p-4 shadow-card">
      <div className="mb-1 flex flex-col">
        <h3 className="text-[15px] font-bold text-dark flex items-center gap-1.5">
          🏥 Clinic Actions
        </h3>
        <p className="text-[12px] text-muted-foreground">Log what happened during this clinic visit</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className={cn(
            "flex h-auto flex-col items-center justify-center gap-1.5 rounded-xl border py-3 transition-all",
            vaccinateDisabled ? "bg-slate-50 opacity-60" : "bg-[#ECFEFF] border-[#06B6D4] text-[#06B6D4]"
          )}
          onClick={() => onAction('vaccinate')}
          disabled={vaccinateDisabled}
        >
          <Syringe size={20} />
          <span className="text-[13px] font-bold">Vaccinate</span>
          {vaccinateDisabled && <span className="text-[9px] font-medium uppercase tracking-tight">Already vaccinated</span>}
        </Button>

        <Button
          variant="outline"
          className={cn(
            "flex h-auto flex-col items-center justify-center gap-1.5 rounded-xl border py-3 transition-all",
            isSterilized ? "bg-slate-50 opacity-60" : "bg-[#F5F3FF] border-[#8B5CF6] text-[#8B5CF6]"
          )}
          onClick={() => onAction('sterilize')}
          disabled={isSterilized}
        >
          <Scissors size={20} />
          <span className="text-[13px] font-bold">Mark Neutered</span>
          {isSterilized && <span className="text-[9px] font-medium uppercase tracking-tight">Already neutered</span>}
        </Button>

        <Button
          variant="outline"
          className="flex h-auto flex-col items-center justify-center gap-1.5 rounded-xl border border-[#F59E0B] bg-[#FFFBEB] py-3 text-[#F59E0B]"
          onClick={() => onAction('treat')}
        >
          <HeartPulse size={20} />
          <span className="text-[13px] font-bold">Medical Treatment</span>
        </Button>

        <Button
          variant="outline"
          className="flex h-[52px] col-span-2 items-center justify-center gap-2 rounded-xl border-[#10B981] bg-[#ECFDF5] text-[#10B981]"
          onClick={() => onAction('release')}
        >
          <ArrowRight size={20} />
          <span className="text-[15px] font-bold">Release Dog</span>
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-1 items-center justify-center gap-1.5 text-[#EF4444] hover:bg-red-50 hover:text-[#EF4444]"
          onClick={() => onAction('died')}
        >
          <XCircle size={16} />
          <span className="text-[12px] font-bold">Dog Died</span>
        </Button>
        <div className="h-4 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-1 items-center justify-center gap-1.5 text-[#F59E0B] hover:bg-amber-50 hover:text-[#F59E0B]"
          onClick={() => onAction('escaped')}
        >
          <AlertTriangle size={16} />
          <span className="text-[12px] font-bold">Dog Escaped</span>
        </Button>
      </div>
    </div>
  );
};
