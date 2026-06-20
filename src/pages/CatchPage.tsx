import React from 'react';
import { useCatchStore } from '../stores/catchStore';
import { useDraftSave } from '../hooks/useDraftSave';
import { CameraCapture } from '../components/catch/CameraCapture';
import { VitalsSelector } from '../components/catch/VitalsSelector';
import { VisualTagsGrid } from '../components/catch/VisualTagsGrid';
import { LocationCapture } from '../components/catch/LocationCapture';
import { CatchSuccess } from '../components/catch/CatchSuccess';
import { VaccinationSuccess } from '../components/catch/VaccinationSuccess';
import { ProgrammeToggle } from '../components/catch/ProgrammeToggle';
import { useSubmitCatch } from '../hooks/useSubmitCatch';
import { useSubmitVaccination } from '../hooks/useSubmitVaccination';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Loader2, Syringe } from 'lucide-react';
import { cn } from '../lib/utils';
import type { VaccineType } from '../types';

const CatchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    draft,
    setNotes,
    resetDraft,
    resetForNextVaccination,
    setVaccineType,
    setVaccineBatch,
    setVaccinatorName
  } = useCatchStore();

  useDraftSave(draft);

  const catchSubmission = useSubmitCatch();
  const vaccinationSubmission = useSubmitVaccination();

  const isVaccinationMode = draft.programme_type === 'vaccination';

  const currentSubmission = isVaccinationMode ? vaccinationSubmission : catchSubmission;
  const { isSubmitting, isOptimistic, successData, clearState } = currentSubmission;
  const submitAction = isVaccinationMode ? vaccinationSubmission.submitVaccination : catchSubmission.submitCatch;

  const handleCatchAnother = () => {
    if (isVaccinationMode) {
      resetForNextVaccination();
    } else {
      resetDraft();
    }
    clearState();
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
  };

  const vaccineOptions: { value: VaccineType, label: string, emoji: string }[] = [
    { value: 'rabies', label: 'Rabies', emoji: '💉' },
    { value: 'distemper', label: 'Distemper', emoji: '🔬' },
    { value: 'combo', label: 'Multi-Valent', emoji: '⚕️' },
    { value: 'booster', label: 'Booster', emoji: '🔄' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-[56px] bg-white border-b border-[#E5E7EB] z-50 flex items-center justify-between px-4">
        <h1 className="text-[18px] font-bold text-[#111827]">🐾 {isVaccinationMode ? 'On-Site Vaccination' : 'New Catch'}</h1>
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isVaccinationMode ? "bg-[#F0A500]" : "bg-[#0D7377]")} />
          <span className="text-[11px] font-medium text-[#9CA3AF]">Saving...</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-[56px] pb-[calc(68px+env(safe-area-inset-bottom)+80px)]">
        <ProgrammeToggle />

        <div className="py-2">
          <LocationCapture />
        </div>

        <CameraCapture />

        <div className="mt-4">
          <div className="px-5 mb-1">
            <h2 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Quick Vitals</h2>
          </div>
          <VitalsSelector />
        </div>

        <div className="mt-4">
          <VisualTagsGrid />
        </div>

        {/* Vaccination Details Section */}
        {isVaccinationMode && (
          <div className="mt-6 space-y-6">
            <div className="px-4">
              <div className="border-l-[3px] border-[#F0A500] pl-3">
                <h2 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Vaccination Details</h2>
              </div>
            </div>

            <div className="px-4 space-y-2">
              <label className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">Vaccine Type</label>
              <div className="grid grid-cols-2 gap-2">
                {vaccineOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setVaccineType(opt.value)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-[12px] border-[1.5px] transition-all duration-150 active:scale-[0.98]",
                      draft.vaccine_type === opt.value
                        ? "bg-[#FFF7ED] border-[#F0A500] text-[#F0A500]"
                        : "bg-white border-[#E5E7EB] text-[#374151]"
                    )}
                  >
                    <span className="text-[18px]">{opt.emoji}</span>
                    <span className="text-[13px] font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-[13px] font-medium text-[#374151]">Batch Number</label>
                  <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280] text-[10px] px-1.5 py-0 border-none font-normal">optional</Badge>
                </div>
                <input
                  type="text"
                  value={draft.vaccine_batch}
                  onChange={(e) => setVaccineBatch(e.target.value)}
                  placeholder="e.g. RV2024-001"
                  className="w-full h-[48px] px-4 text-[16px] bg-[#F9FAFB] border-[1.5px] border-[#E5E7EB] rounded-[10px] focus:outline-none focus:border-[#F0A500] focus:ring-[3px] focus:ring-[#F0A500]/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-[13px] font-medium text-[#374151]">Vaccinated by</label>
                  <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280] text-[10px] px-1.5 py-0 border-none font-normal">optional</Badge>
                </div>
                <input
                  type="text"
                  value={draft.vaccinator_name}
                  onChange={(e) => setVaccinatorName(e.target.value)}
                  placeholder="Veterinarian or technician name"
                  className="w-full h-[48px] px-4 text-[16px] bg-[#F9FAFB] border-[1.5px] border-[#E5E7EB] rounded-[10px] focus:outline-none focus:border-[#F0A500] focus:ring-[3px] focus:ring-[#F0A500]/10 transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="px-4 mt-6 space-y-2">
          <div className="flex items-center gap-2 ml-1">
            <label className="text-[13px] font-medium text-[#374151]">Notes</label>
            <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280] text-[10px] px-1.5 py-0 border-none font-normal">optional</Badge>
          </div>
          <textarea
            value={draft.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Caretaker name, landmark, injuries, anything relevant..."
            className={cn(
              "w-full min-h-[100px] p-3 text-[16px] bg-[#F9FAFB] border-[1.5px] border-[#E5E7EB] rounded-[10px] focus:outline-none transition-all placeholder:text-[#9CA3AF]",
              isVaccinationMode
                ? "focus:border-[#F0A500] focus:ring-[3px] focus:ring-[#F0A500]/10"
                : "focus:border-[#0D7377] focus:ring-[3px] focus:ring-[#0D7377]/10"
            )}
            rows={4}
          />
        </div>
      </main>

      {/* Sticky Save Area */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Shadow Overlay */}
        <div className="h-6 bg-gradient-to-t from-white to-transparent" />
        <div className="bg-white/95 backdrop-blur-sm border-t border-[#E5E7EB] px-4 pt-3 pb-[calc(68px+env(safe-area-inset-bottom)+12px)]">
          <Button
            onClick={submitAction}
            disabled={isSubmitting}
            className={cn(
              "w-full h-[56px] text-white text-[16px] font-bold rounded-[12px] active:scale-[0.96] transition-all disabled:opacity-70",
              isVaccinationMode
                ? "bg-[#F0A500] hover:bg-[#F0A500]/90 shadow-[0_0_20px_rgba(240,165,0,0.25)]"
                : "bg-[#0D7377] hover:bg-[#0D7377]/90 shadow-[0_0_20px_rgba(13,115,119,0.25)]"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isVaccinationMode ? 'Recording...' : 'Registering...'}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {isVaccinationMode && <Syringe className="w-5 h-5" />}
                <span>{isVaccinationMode ? 'Vaccinate & Release' : 'Save Catch Record'}</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Success Overlay */}
      {(successData || isOptimistic) && (
        isVaccinationMode ? (
          <VaccinationSuccess
            dogId={successData?.dog_id || 'Pending...'}
            vaccineType={draft.vaccine_type}
            onViewProfile={handleViewProfile}
            onVaccinateAnother={handleCatchAnother}
            onClose={handleCloseSuccess}
          />
        ) : (
          <CatchSuccess
            dogId={successData?.dog_id || 'Pending...'}
            hasLocation={!!draft.location}
            onViewProfile={handleViewProfile}
            onCatchAnother={handleCatchAnother}
            onClose={handleCloseSuccess}
          />
        )
      )}
    </div>
  );
};

export default CatchPage;
