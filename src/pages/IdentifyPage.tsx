import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Camera, Search, Loader2, X } from 'lucide-react';
import { useGPS } from '@/hooks/useGPS';
import { useIdentify } from '@/hooks/useIdentify';
import RadarAnimation from '@/components/identify/RadarAnimation';
import MatchCard from '@/components/identify/MatchCard';
import MatchConfirmation from '@/components/identify/MatchConfirmation';
import ReleaseSuccess from '@/components/identify/ReleaseSuccess';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MatchResult, VisualTags, EarType, CoatColor } from '@/types';
import imageCompression from 'browser-image-compression';
import { cn } from '@/lib/utils';

const IdentifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dogIdFromUrl = searchParams.get('dogId');

  const { location, accuracy } = useGPS();
  const { identifyDog, fetchDogById, manualSearch, releaseDog, rejectMatch, results, loading } = useIdentify();

  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualTags, setManualTags] = useState<VisualTags>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle direct dog ID from URL
  useEffect(() => {
    if (dogIdFromUrl) {
      fetchDogById(dogIdFromUrl).then((result: MatchResult | null) => {
        if (result) {
          setSelectedMatch(result);
          setIsConfirming(true);
        }
      });
    }
  }, [dogIdFromUrl, fetchDogById]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.85
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setPhoto(base64data);
        identifyDog(location);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Error compressing image:', err);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMatch) return;
    setIsProcessing(true);
    try {
      await releaseDog(
        selectedMatch.dog.id,
        location,
        accuracy,
        "System User",
        "Confirmed match during release"
      );
      setShowSuccess(true);
      setIsConfirming(false);
    } catch (err) {
      console.error('Release failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMatch) return;
    setIsProcessing(true);
    try {
      await rejectMatch(selectedMatch.dog.id);
      setIsConfirming(false);
      setSelectedMatch(null);
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualSearch(searchTerm, manualTags);
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
    const catchEvent = selectedMatch.dog.events.find(e => e.event_type === 'catch');
    const catchDate = catchEvent ? new Date(catchEvent.timestamp) : new Date(selectedMatch.dog.created_at);
    const diffDays = Math.ceil((new Date().getTime() - catchDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <ReleaseSuccess
        onDone={() => navigate(`/dog/${selectedMatch.dog.id}`)}
        catchLocationName="Original Catch Point"
        daysInProgramme={diffDays}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-[calc(64px+env(safe-area-inset-bottom)+20px)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[56px] bg-white border-b border-[#E5E7EB] z-40 flex items-center justify-between px-4">
        <h1 className="text-[18px] font-bold text-[#111827]">Identify & Release</h1>
        {(photo || showManualSearch) && (
          <button
            onClick={() => { setPhoto(null); setShowManualSearch(false); setSearchTerm(''); setManualTags({}); }}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </header>

      <main className="flex-1 pt-[56px]">
        {!photo && !showManualSearch ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px-64px)] px-6">
            <div className="mb-12">
              <RadarAnimation />
            </div>

            <div className="w-full space-y-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[68px] bg-[#0D7377] hover:bg-[#0A5A5D] text-white rounded-[16px] text-[16px] font-bold shadow-[0_8px_24px_rgba(13,115,119,0.25)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <Camera className="w-5 h-5" />
                Scan Dog
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowManualSearch(true)}
                className="w-full h-[56px] border-[#E5E7EB] text-gray-600 rounded-[16px] text-[15px] font-semibold flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Manual Search Fallback
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
            />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {photo && (
              <div className="space-y-3">
                <div className="w-full h-[180px] rounded-[12px] overflow-hidden border border-gray-200">
                  <img src={photo} className="w-full h-full object-cover" alt="Photo of the dog captured for identification" />
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#E0F2F1] text-[#00796B] border-none px-3 py-1 text-[12px] flex items-center gap-1.5">
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                    )}
                    Searching 2km...
                  </Badge>
                  {location && (
                    <span className="text-[11px] text-gray-400 font-medium">
                      GPS Accuracy: {Math.round(accuracy || 0)}m
                    </span>
                  )}
                </div>
              </div>
            )}

            {showManualSearch && (
              <form onSubmit={handleManualSearchSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Dog ID (e.g. 8A2F)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white border border-[#E5E7EB] rounded-[14px] text-[16px] focus:outline-none focus:border-[#0D7377] transition-colors"
                  />
                </div>

                <div className="space-y-4">
                  <section className="space-y-3">
                    <h3 className="text-[14px] font-bold text-[#111827] border-l-[3px] border-[#0D7377] pl-3">EARS</h3>
                    <div className="flex flex-wrap gap-2">
                      {['prick', 'semi_floppy', 'fully_floppy', 'cropped', 'torn_notched'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleTag('ears', v)}
                          className={cn(
                            "px-3 py-2 rounded-full border text-[12px] font-semibold transition-all",
                            manualTags.ears === v
                              ? "bg-[#E6F7F6] border-[#0D7377] text-[#0D7377]"
                              : "bg-white border-[#E5E7EB] text-[#374151]"
                          )}
                        >
                          {v.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[14px] font-bold text-[#111827] border-l-[3px] border-[#0D7377] pl-3">COAT</h3>
                    <div className="flex flex-wrap gap-2">
                      {['red_brown', 'black', 'white', 'grey', 'brindle', 'mixed'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleTag('coat', v)}
                          className={cn(
                            "px-3 py-2 rounded-full border text-[12px] font-semibold transition-all",
                            manualTags.coat === v
                              ? "bg-[#E6F7F6] border-[#0D7377] text-[#0D7377]"
                              : "bg-white border-[#E5E7EB] text-[#374151]"
                          )}
                        >
                          {v.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-[#0D7377] text-white rounded-[14px] font-bold text-[16px]"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search with Filters"}
                </Button>
              </form>
            )}

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                  {results.length > 0 ? `Matches found (${results.length})` : 'Results'}
                </h2>
              </div>

              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-[120px] bg-white rounded-[14px] border border-gray-100 p-3 flex gap-3 animate-pulse">
                    <div className="w-[68px] h-[68px] bg-gray-100 rounded-[10px]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                ))
              ) : results.length > 0 ? (
                results.map((res: MatchResult) => (
                  <MatchCard
                    key={res.dog.id}
                    result={res}
                    onClick={() => {
                      setSelectedMatch(res);
                      setIsConfirming(true);
                    }}
                  />
                ))
              ) : (photo || showManualSearch) && (
                <div className="text-center py-12 px-6">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1">No matches found</h3>
                  <p className="text-[14px] text-gray-500">
                    Try different filters or adjust your search.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <MatchConfirmation
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        result={selectedMatch}
        currentPhoto={photo}
        onConfirm={handleConfirm}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default IdentifyPage;
