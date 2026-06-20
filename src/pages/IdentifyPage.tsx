import React, { useState, useRef } from 'react';
import { Camera, Search, X, Loader2, Info, ChevronLeft, MapPin, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGPS } from '@/hooks/useGPS';
import { useIdentify } from '@/hooks/useIdentify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchCard } from '@/components/identify/MatchCard';
import { MatchConfirmation } from '@/components/identify/MatchConfirmation';
import { RadarAnimation } from '@/components/identify/RadarAnimation';
import { ReleaseSuccess } from '@/components/identify/ReleaseSuccess';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchResult, EarType, CoatColor } from '@/types';

const IdentifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { location, accuracy } = useGPS();
  const {
    loading,
    results,
    manualSearch,
    releaseDog,
    rejectMatch
  } = useIdentify();

  const [photo, setPhoto] = useState<string | null>(null);
  const [showManualSearch, setShowManualSearch] = useState(!!searchParams.get('dogId'));
  const [searchTerm, setSearchTerm] = useState(searchParams.get('dogId') || '');
  const [manualTags, setManualTags] = useState<{ ears?: EarType; coat?: CoatColor }>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualSearch(searchTerm, manualTags);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setPhoto(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleConfirm = async () => {
      if (!selectedMatch) return;
      setIsProcessing(true);
      try {
          await releaseDog(selectedMatch.dog.id, location, accuracy, 'System', 'Released via Identification');
          setShowSuccess(true);
      } catch (err) {
          console.error(err);
      } finally {
          setIsProcessing(false);
          setIsConfirming(false);
      }
  };

  const handleReject = async () => {
      if (!selectedMatch) return;
      setIsProcessing(true);
      try {
          await rejectMatch(selectedMatch.dog.id);
      } catch (err) {
          console.error(err);
      } finally {
          setIsProcessing(false);
          setIsConfirming(false);
      }
  };

  const toggleTag = (type: 'ears' | 'coat', value: string) => {
    setManualTags(prev => {
      const next = { ...prev };
      if (type === 'ears') {
        next.ears = (next.ears === value ? undefined : value) as EarType;
      } else {
        next.coat = (next.coat === value ? undefined : value) as CoatColor;
      }
      return next;
    });
  };

  if (showSuccess && selectedMatch) {
    return (
      <ReleaseSuccess
        onDone={() => navigate(`/dog/${selectedMatch.dog.id}`)}
        catchLocationName="Original Point"
        daysInProgramme={5}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] pb-[160px]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[64px] glass-card z-50 flex items-center justify-between px-4 border-b-0">
        <button
          onClick={() => {
            if (photo || showManualSearch) {
               setPhoto(null);
               setShowManualSearch(false);
            } else {
               navigate(-1);
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          {photo || showManualSearch ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h1 className="text-[17px] font-extrabold text-dark tracking-tight">Identify & Release</h1>
        <div className="w-10 flex justify-end">
           <Info size={20} className="text-muted/40" />
        </div>
      </header>

      <main className="flex-1 pt-[80px]">
        <AnimatePresence mode="wait">
          {!photo && !showManualSearch ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center"
            >
              <div className="mb-12">
                <RadarAnimation />
              </div>
              <div className="space-y-2 mb-10">
                <h2 className="text-[28px] font-extrabold text-dark tracking-tight leading-tight">Find Registry Record</h2>
                <p className="text-[15px] text-muted font-medium px-4">Scan the dog's portrait or search by ID to process for release.</p>
              </div>
              <div className="w-full space-y-4 max-w-sm">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[68px] bg-primary hover:bg-primary/90 text-white rounded-[22px] text-[17px] font-extrabold shadow-teal-glow flex items-center justify-center gap-3 transition-all"
                >
                  <Camera className="w-6 h-6" />
                  Visual Identification
                </Button>
                <Button variant="outline" onClick={() => setShowManualSearch(true)} className="w-full h-[60px] border-gray-200 text-dark rounded-[20px] text-[15px] font-bold bg-white">Manual Search Fallback</Button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleCapture} />
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-8">
              {photo && (
                <div className="space-y-4">
                  <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden shadow-elevated border-[1.5px] border-white">
                    <img src={photo} className="w-full h-full object-cover" alt="Captured" />
                    <div className="absolute top-4 left-4"><Badge className="bg-primary/90 backdrop-blur-md border-none text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 shadow-lg">Scanning...</Badge></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-[22px] border border-border/40 shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><MapPin size={20} /></div>
                       <div><span className="text-[11px] font-extrabold text-muted uppercase tracking-widest block leading-none mb-1">Search Radius</span><span className="text-[14px] font-bold text-dark">2km from current</span></div>
                    </div>
                  </div>
                </div>
              )}
              {showManualSearch && (
                <form onSubmit={handleManualSearchSubmit} className="space-y-8">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted group-focus-within:text-primary" />
                    <input type="text" placeholder="Search by Dog ID (e.g. 8A2F)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-[60px] pl-14 pr-4 bg-white border border-border rounded-[20px] text-[17px] font-medium focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/5 transition-all shadow-sm" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[11px] font-extrabold text-muted uppercase tracking-[0.15em] ml-1">Ears Filter</label>
                      <div className="flex flex-wrap gap-2">{['prick', 'semi_floppy', 'fully_floppy', 'cropped', 'torn_notched'].map(v => (
                        <button key={v} type="button" onClick={() => toggleTag('ears', v)} className={cn("px-4 py-2.5 rounded-full border-[1.5px] text-[13px] font-bold transition-all", manualTags.ears === v ? "bg-primary/10 border-primary text-primary" : "bg-white border-border text-body hover:border-muted")}>{v.replace('_', ' ')}</button>
                      ))}</div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-[60px] bg-dark text-white rounded-[20px] font-extrabold text-[16px] shadow-lg" disabled={loading}>{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Apply Advanced Filters"}</Button>
                </form>
              )}
              <div className="space-y-4 pt-4 pb-20">
                {loading ? [1, 2].map(i => <div key={i} className="h-[140px] bg-white rounded-[24px] border border-border/40 p-4 animate-pulse" />) : results.length > 0 ? results.map((res: MatchResult) => (
                  <MatchCard key={res.dog.id} result={res} onClick={() => { setSelectedMatch(res); setIsConfirming(true); }} />
                )) : (photo || showManualSearch) && (
                  <div className="text-center py-20 px-8 bg-white rounded-[32px] border border-border/40 border-dashed">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-10 h-10 text-muted/30" /></div>
                    <h3 className="text-xl font-extrabold text-dark tracking-tight">Zero Matches</h3>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <MatchConfirmation isOpen={isConfirming} onClose={() => setIsConfirming(false)} result={selectedMatch} currentPhoto={photo} onConfirm={handleConfirm} onReject={handleReject} isProcessing={isProcessing} />
    </div>
  );
};

export default IdentifyPage;
