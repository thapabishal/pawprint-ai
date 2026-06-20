import React, { useEffect, useState } from 'react';
import { X, Syringe, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { VaccineType } from '../../types';

interface VaccinationSuccessProps {
  dogId: string;
  vaccineType: VaccineType;
  onViewProfile: () => void;
  onVaccinateAnother: () => void;
  onClose: () => void;
}

export const VaccinationSuccess: React.FC<VaccinationSuccessProps> = ({

  vaccineType,
  onViewProfile,
  onVaccinateAnother,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [syringeActive, setSyringeActive] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Entrance animation
    const visibilityTimer = setTimeout(() => setIsVisible(true), 0);

    // Start syringe animation after 200ms
    const syringeTimer = setTimeout(() => {
      setSyringeActive(true);
    }, 200);

    // Show text and buttons after animation finishes
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 1000);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(syringeTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  const getVaccineLabel = (type: VaccineType) => {
    switch (type) {
      case 'rabies': return 'Rabies';
      case 'distemper': return 'Distemper';
      case 'combo': return 'Multi-Valent';
      case 'booster': return 'Booster';
      default: return type;
    }
  };

  // Mock booster date: 1 year from now
  const nextBoosterDate = new Date();
  nextBoosterDate.setFullYear(nextBoosterDate.getFullYear() + 1);
  const formattedBoosterDate = nextBoosterDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

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

      <div className="flex flex-col items-center text-center px-6 max-w-sm">
        {/* Animated Syringe Icon */}
        <div className="relative w-[120px] h-[120px] mb-8 flex items-center justify-center">
          <div className={cn(
            "absolute inset-0 rounded-full transition-colors duration-300",
            syringeActive ? "bg-[#FFF7ED]" : "bg-transparent"
          )} style={{ transitionDelay: '800ms' }} />

          <div className={cn(
            "relative z-10 transition-all duration-700 transform",
            syringeActive ? "scale-110 rotate-12" : "scale-50 rotate-0 opacity-0"
          )}>
            <div className="relative">
              <Syringe className="w-[64px] h-[64px] text-[#F0A500]" />
              {/* Checkmark overlay */}
              <div className={cn(
                "absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm transition-opacity duration-300",
                showContent ? "opacity-100" : "opacity-0"
              )}>
                <div className="bg-green-500 rounded-full p-0.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h2 className={cn(
            "text-[24px] font-bold text-[#111827] transition-all duration-500 transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: '200ms' }}>
            Dog Vaccinated! 💉
          </h2>

          <p className={cn(
            "text-[14px] text-[#6B7280] transition-all duration-500 transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: '300ms' }}>
            Vaccinated and released on-site
          </p>

          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF7ED] text-[#F0A500] rounded-full text-[13px] font-bold border border-[#FFEDD5] transition-all duration-500 transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: '400ms' }}>
            {getVaccineLabel(vaccineType)} ✓
          </div>

          <div className={cn(
            "flex items-center justify-center gap-2 text-[13px] text-[#374151] transition-all duration-500 transform",
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: '500ms' }}>
            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Next booster due: <span className="font-bold">{formattedBoosterDate}</span></span>
          </div>
        </div>

        {/* Buttons */}
        <div className={cn(
          "w-full mt-10 space-y-3 transition-all duration-500 transform",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '700ms' }}>
          <Button
            onClick={onViewProfile}
            className="w-full h-[52px] bg-[#F0A500] hover:bg-[#F0A500]/90 text-white font-bold rounded-[12px] shadow-[0_4px_14px_rgba(240,165,0,0.25)]"
          >
            View Profile
          </Button>
          <Button
            onClick={onVaccinateAnother}
            variant="outline"
            className="w-full h-[52px] border-[1.5px] border-[#E5E7EB] text-[#374151] font-bold rounded-[12px]"
          >
            Vaccinate Another
          </Button>
        </div>
      </div>
    </div>
  );
};
