import { useCatchStore } from '../stores/catchStore';
import { LocationCapture } from '../components/catch/LocationCapture';
import { CameraCapture } from '../components/catch/CameraCapture';
import { VitalsSelector } from '../components/catch/VitalsSelector';
import { Button } from '../components/ui/button';

export default function CatchPage() {
  const { notes, setNotes } = useCatchStore();

  const handleSave = () => {
    // In a real app, this would trigger the upload queue logic
    console.log('Saving catch record...');
    // reset();
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between pt-safe">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>🐾</span> New Catch
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auto-saving</span>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </header>

      <div className="flex-1 space-y-2 py-4">
        {/* GPS Indicator */}
        <LocationCapture />

        {/* Camera Section */}
        <CameraCapture />

        <div className="px-4 py-2">
          <div className="h-px bg-gray-200 w-full" />
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
