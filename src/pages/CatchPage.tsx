import React from 'react';
import { useCatchStore } from '../stores/catchStore';
import { useDraftSave } from '../hooks/useDraftSave';
import { CameraCapture } from '../components/catch/CameraCapture';
import { VitalsSelector } from '../components/catch/VitalsSelector';
import { LocationCapture } from '../components/catch/LocationCapture';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const CatchPage: React.FC = () => {
  const { draft, setNotes } = useCatchStore();
  useDraftSave(draft);

  const handleSave = () => {
    // Logic for saving will be implemented later, for now just a stub
    console.log('Saving catch:', draft);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-[56px] bg-white border-b border-[#E5E7EB] z-50 flex items-center justify-between px-4">
        <h1 className="text-[18px] font-bold text-[#111827]">🐾 New Catch</h1>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#0D7377] animate-pulse" />
          <span className="text-[11px] font-medium text-[#9CA3AF]">Saving...</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-[56px] pb-[calc(68px+env(safe-area-inset-bottom)+80px)]">
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

        {/* Notes Section */}
        <div className="px-4 mt-4 space-y-2">
          <div className="flex items-center gap-2 ml-1">
            <label className="text-[13px] font-medium text-[#374151]">Notes</label>
            <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280] text-[10px] px-1.5 py-0 border-none font-normal">optional</Badge>
          </div>
          <textarea
            value={draft.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Caretaker name, landmark, injuries, anything relevant..."
            className="w-full min-h-[100px] p-3 text-[16px] bg-[#F9FAFB] border-[1.5px] border-[#E5E7EB] rounded-[10px] focus:outline-none focus:border-[#0D7377] focus:ring-[3px] focus:ring-[#0D7377]/10 transition-all placeholder:text-[#9CA3AF]"
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
            onClick={handleSave}
            className="w-full h-[56px] bg-[#0D7377] hover:bg-[#0D7377]/90 text-white text-[16px] font-bold rounded-[12px] shadow-[0_0_20px_rgba(13,115,119,0.25)] active:scale-[0.96] transition-all"
          >
            Save Catch
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CatchPage;
