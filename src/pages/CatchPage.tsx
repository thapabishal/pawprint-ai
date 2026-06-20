import React, { useState } from 'react';
import { useCatchStore } from '../stores/catchStore';
import { useDraftSave } from '../hooks/useDraftSave';
import { CameraCapture } from '../components/catch/CameraCapture';
import { VitalsSelector } from '../components/catch/VitalsSelector';
import { VisualTagsGrid } from '../components/catch/VisualTagsGrid';
import { LocationCapture } from '../components/catch/LocationCapture';
import { CatchSuccess } from '../components/catch/CatchSuccess';
import { VaccinationSuccess } from '../components/catch/VaccinationSuccess';
import { ModeSelector } from '../components/catch/ModeSelector';
import { useSubmitCatch } from '../hooks/useSubmitCatch';
import { useSubmitVaccination } from '../hooks/useSubmitVaccination';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { VaccineType, ProgrammeType } from '../types';

const CatchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    draft,
    setNotes,
    resetDraft,
    resetForNextVaccination,
    setVaccineType,
    setVaccineBatch,
    setVaccinatorName,
    setProgrammeType
  } = useCatchStore();

  const [showModeSelector, setShowModeSelector] = useState(!draft.photo_dataurl && !draft.location);

  useDraftSave(draft);

  const catchSubmission = useSubmitCatch();
  const vaccinationSubmission = useSubmitVaccination();

  const isVaccinationMode = draft.programme_type === 'vaccination';

  const currentSubmission = isVaccinationMode ? vaccinationSubmission : catchSubmission;
  const { isSubmitting, isOptimistic, successData, clearState } = currentSubmission;
  const submitAction = isVaccinationMode ? vaccinationSubmission.submitVaccination : catchSubmission.submitCatch;

  const handleModeSelect = (type: ProgrammeType) => {
    setProgrammeType(type);
    setShowModeSelector(false);
  };

  const handleCatchAnother = () => {
    if (isVaccinationMode) {
      resetForNextVaccination();
    } else {
      resetDraft();
    }
    clearState();
    setShowModeSelector(true);
  };

  const handleViewProfile = () => {
    if (successData) {
      navigate(`/dog/${successData.dog_id}`);
    }
  };

  const handleCloseSuccess = () => {
    clearState();
    if (isVaccinationMode) {
      resetForNextVaccination();
    } else {
      resetDraft();
    }
    setShowModeSelector(true);
  };

  const vaccineOptions: { value: VaccineType, label: string, emoji: string }[] = [
    { value: 'rabies', label: 'Rabies', emoji: '💉' },
    { value: 'distemper', label: 'Distemper', emoji: '🔬' },
    { value: 'combo', label: 'Multi-Valent', emoji: '⚕️' },
    { value: 'booster', label: 'Booster', emoji: '🔄' },
  ];

  if (showModeSelector) {
    return <ModeSelector onSelect={handleModeSelect} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      <header className="fixed top-0 left-0 right-0 h-[64px] glass-card z-50 flex items-center justify-between px-4 border-b-0">
        <button onClick={() => setShowModeSelector(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-6 h-6 text-dark" /></button>
        <div className="flex flex-col items-center">
          <h1 className="text-[15px] font-extrabold text-dark tracking-tight">{isVaccinationMode ? 'On-Site Vaccination' : 'New Catch Record'}</h1>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", isVaccinationMode ? "bg-accent" : "bg-primary")} />
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{isVaccinationMode ? 'Vaccination Mode' : 'CNVR Mode'}</span>
          </div>
        </div>
        <div className="w-10 flex justify-end"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /></div>
      </header>
      <main className="flex-1 pt-[80px] pb-[160px] space-y-8">
        <section className="space-y-4">
          <div className="px-5"><h2 className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em]">Step 1: Context</h2></div>
          <div className="space-y-1"><LocationCapture /><CameraCapture /></div>
        </section>
        <section className="space-y-4">
          <div className="px-5 flex items-center justify-between"><h2 className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em]">Step 2: Quick Vitals</h2><Info className="w-4 h-4 text-muted/50" /></div>
          <VitalsSelector />
        </section>
        <section className="space-y-4">
          <div className="px-5"><h2 className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em]">Step 3: Visual Identity</h2></div>
          <VisualTagsGrid />
        </section>
        <AnimatePresence>
          {isVaccinationMode && (
            <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
              <div className="px-5"><div className="h-[1px] bg-border mb-8" /><h2 className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em]">Step 4: Vaccination Details</h2></div>
              <div className="px-5 space-y-3">
                <label className="text-[13px] font-bold text-body">Vaccine Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {vaccineOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setVaccineType(opt.value)} className={cn("flex items-center gap-3 p-4 rounded-[20px] border-[1.5px] transition-all duration-300", draft.vaccine_type === opt.value ? "bg-accent/10 border-accent text-accent shadow-sm" : "bg-white border-border text-body hover:border-muted")}>
                      <span className="text-[20px]">{opt.emoji}</span><span className="text-[13px] font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-body ml-1">Batch Number</label>
                  <input type="text" value={draft.vaccine_batch} onChange={(e) => setVaccineBatch(e.target.value)} placeholder="e.g. RV2024-001" className="w-full h-[56px] px-5 text-[16px] bg-white border-[1.5px] border-border rounded-[18px] focus:outline-none focus:border-accent transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-body ml-1">Vaccinated by</label>
                  <input type="text" value={draft.vaccinator_name} onChange={(e) => setVaccinatorName(e.target.value)} placeholder="Name" className="w-full h-[56px] px-5 text-[16px] bg-white border-[1.5px] border-border rounded-[18px] focus:outline-none focus:border-accent transition-all" />
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        <section className="px-5 space-y-3">
          <h2 className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em]">Final Step: Additional Notes</h2>
          <textarea value={draft.notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className={cn("w-full min-h-[120px] p-5 text-[16px] bg-white border-[1.5px] border-border rounded-[20px] focus:outline-none transition-all", isVaccinationMode ? "focus:border-accent" : "focus:border-primary")} rows={4} />
        </section>
      </main>
      <div className="fixed bottom-[90px] left-0 right-0 z-40 px-5 pointer-events-none">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md mx-auto pointer-events-auto">
          <Button onClick={submitAction} disabled={isSubmitting} className={cn("w-full h-[64px] text-white text-[17px] font-extrabold rounded-[22px] shadow-elevated", isVaccinationMode ? "bg-accent" : "bg-primary")}>
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (isVaccinationMode ? 'Vaccinate & Release' : 'Save Catch Record')}
          </Button>
        </motion.div>
      </div>
      {(successData || isOptimistic) && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white">
            {isVaccinationMode ? (
              <VaccinationSuccess dogId={successData?.dog_id || 'Pending...'} vaccineType={draft.vaccine_type} onViewProfile={handleViewProfile} onVaccinateAnother={handleCatchAnother} onClose={handleCloseSuccess} />
            ) : (
              <CatchSuccess dogId={successData?.dog_id || 'Pending...'} hasLocation={!!draft.location} onViewProfile={handleViewProfile} onCatchAnother={handleCatchAnother} onClose={handleCloseSuccess} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default CatchPage;
