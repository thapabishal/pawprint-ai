import React, { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface CatchSuccessProps {
  dogId: string;
  hasLocation: boolean;
  onViewProfile: () => void;
  onCatchAnother: () => void;
  onClose: () => void;
}

export const CatchSuccess: React.FC<CatchSuccessProps> = ({
  dogId,
  hasLocation,
  onViewProfile,
  onCatchAnother,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [checkmarkDrawn, setCheckmarkDrawn] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Entrance animation
    const visibilityTimer = setTimeout(() => setIsVisible(true), 0);

    // Start drawing checkmark after 200ms
    const drawTimer = setTimeout(() => {
      setCheckmarkDrawn(true);
    }, 200);

    // Show text and buttons after checkmark finishes (starts at 200ms, takes 600ms + buffer)
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 800);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(drawTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <div className={cn(
      "fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center transition-opacity duration-200",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      {/* X Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center active:scale-95 transition-transform"
      >
        <X className="w-5 h-5 text-[#374151]" />
      </button>

      <div className="flex flex-col items-center text-center px-6 max-sm">
        {/* Animated Checkmark SVG */}
        <div className="relative w-[120px] h-[120px] mb-8 flex items-center justify-center">
          <div className={cn(
            "absolute inset-0 rounded-full transition-colors duration-300",
            checkmarkDrawn ? "bg-[#E6F7F6]" : "bg-transparent"
          )} style={{ transitionDelay: '600ms' }} />

          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
            <path
              d="M20 42L33.3333 55.3333L60 28.6667"
              stroke="#0D7377"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 80,
                strokeDashoffset: checkmarkDrawn ? 0 : 80,
                transition: 'stroke-dashoffset 600ms ease-in-out'
              }}
            />
          </svg>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h2 className={cn(
            "text-[24px] font-bold text-[#111827] transition-all duration-500 transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: '700ms' }}>
            Dog Registered! 🐾
          </h2>

          <p className={cn(
            "font-mono text-[13px] text-[#6B7280] transition-all duration-500 transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: '800ms' }}>
            ID: {dogId}
          </p>

          {hasLocation && (
            <div className={cn(
              "flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#065F46] transition-all duration-500 transform",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: '850ms' }}>
              <MapPin className="w-3.5 h-3.5" />
              Location saved
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className={cn(
          "w-full mt-10 space-y-3 transition-all duration-500 transform",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '950ms' }}>
          <Button
            onClick={onViewProfile}
            className="w-full h-[52px] bg-[#0D7377] hover:bg-[#0D7377]/90 text-white font-bold rounded-[12px]"
          >
            View Profile
          </Button>
          <Button
            onClick={onCatchAnother}
            variant="outline"
            className="w-full h-[52px] border-[1.5px] border-[#E5E7EB] text-[#374151] font-bold rounded-[12px]"
          >
            Catch Another
          </Button>
        </div>
      </div>
    </div>
  );
};
