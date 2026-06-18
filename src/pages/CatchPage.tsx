import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { CameraCapture } from '../components/catch/CameraCapture';
import { VitalsSelector } from '../components/catch/VitalsSelector';
import { LocationCapture } from '../components/catch/LocationCapture';
import { useCatchStore } from '../stores/catchStore';
import { useDraftSave, loadDraft } from '../hooks/useDraftSave';
import { useGPS } from '../hooks/useGPS';

export default function CatchPage() {
  const navigate = useNavigate();
  const { draft, setNotes, setHandlerName, resetDraft, loadSavedDraft } = useCatchStore();
  const { notes, handler_name } = draft;

  // Initialize draft from localStorage if available
  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      loadSavedDraft(saved);
    }
  }, [loadSavedDraft]);

  // Auto-save hook
  useDraftSave(draft);

  // GPS hook - auto-starts on mount
  useGPS();

  const handleSave = () => {
    // Save logic will be implemented in future tasks
    console.log('Saving catch record:', draft);
    resetDraft();
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Catch Record</h1>
      </div>

      <div className="flex-1 space-y-6 pt-4">
        {/* Photo Section */}
        <CameraCapture />

        <div className="px-4 py-2">
          <div className="h-px bg-gray-200 w-full" />
        </div>

        {/* Location Status */}
        <LocationCapture />

        {/* Handler Name */}
        <div className="px-4 space-y-3">
          <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">
            Handler Name
          </label>
          <input
            type="text"
            value={handler_name}
            onChange={(e) => setHandlerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full h-14 rounded-xl border border-gray-200 px-4 text-base focus:ring-2 focus:ring-[#0D7377] focus:border-transparent outline-none transition-all placeholder:text-gray-400 bg-white"
          />
        </div>

        {/* Vitals Section */}
        <VitalsSelector />

        <div className="px-4 py-2">
          <div className="h-px bg-gray-200 w-full" />
        </div>

        {/* Notes Section */}
        <div className="px-4 space-y-3">
          <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Caretaker name, landmark, injuries, anything relevant..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 p-4 text-base focus:ring-2 focus:ring-[#0D7377] focus:border-transparent outline-none transition-all placeholder:text-gray-400 bg-white"
          />
        </div>
      </div>

      {/* Sticky Bottom Save Area */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40">
        <Button
          onClick={handleSave}
          className="w-full h-14 bg-[#0D7377] hover:bg-[#0D7377]/90 text-white text-lg font-bold rounded-xl active:scale-[0.98] transition-all"
        >
          Save Catch Record
        </Button>
      </div>
    </div>
  );
}
