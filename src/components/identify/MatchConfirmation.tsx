import React from 'react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MatchResult } from '@/types';

interface MatchConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  result: MatchResult | null;
  currentPhoto: string | null;
  onConfirm: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

const MatchConfirmation: React.FC<MatchConfirmationProps> = ({
  isOpen,
  onClose,
  result,
  currentPhoto,
  onConfirm,
  onReject,
  isProcessing
}) => {
  if (!result) return null;

  const { dog } = result;
  const catchEvent = dog.events.find(e => e.event_type === 'catch');
  const catchDate = catchEvent ? new Date(catchEvent.timestamp) : new Date(dog.created_at);
  const daysInProgramme = differenceInDays(new Date(), catchDate);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="p-0 border-none rounded-t-[24px] bg-white overflow-hidden pb-safe">
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-[#D1D5DB] rounded-full" />
        </div>

        <div className="px-5 pb-6 overflow-y-auto max-h-[85vh]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">
              Compare Photos
            </SheetTitle>
          </SheetHeader>

          <div className="flex gap-[1px] bg-[#0D7377] rounded-[12px] overflow-hidden mb-6 border border-gray-100">
            <div className="flex-1 h-[150px] relative">
              <img
                src={currentPhoto || ''}
                className="w-full h-full object-cover"
                alt="Just taken"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-white text-[10px] font-bold">
                Just taken
              </div>
            </div>
            <div className="w-[1px] bg-[#0D7377]" />
            <div className="flex-1 h-[150px] relative">
              <img
                src={dog.cover_image_url || ''}
                className="w-full h-full object-cover"
                alt="Original catch"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-white text-[10px] font-bold">
                Caught {formatDistanceToNow(catchDate)} ago
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-[#E0F2F1] text-[#00796B] border-[#B2DFDB] uppercase text-[10px] font-bold">
                {dog.current_status}
              </Badge>
              <span className="font-mono text-[14px] font-bold">
                ID: {dog.id.split('-')[0].toUpperCase()}
              </span>
            </div>
            <div className="text-[13px] text-gray-600">
              Caught: {catchDate.toLocaleDateString()} — {daysInProgramme} days in programme
            </div>
          </div>

          {catchEvent?.notes && (
            <div className="mb-6">
              <div className="text-[12px] font-semibold text-gray-500 uppercase mb-2">Original Catch Notes</div>
              <div className="bg-[#F9FAFB] p-3 rounded-[8px] text-[13px] text-gray-700 leading-relaxed italic border border-gray-100">
                "{catchEvent.notes}"
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              className="w-full h-14 bg-[#10B981] hover:bg-[#059669] text-white rounded-[12px] text-[16px] font-bold flex items-center justify-center gap-2"
              onClick={onConfirm}
              disabled={isProcessing}
            >
              ✅ Yes, this is the dog
            </Button>
            <Button
              variant="outline"
              className="w-full h-[52px] border-[#EF4444] text-[#EF4444] hover:bg-red-50 rounded-[12px] text-[16px] font-bold"
              onClick={onReject}
              disabled={isProcessing}
            >
              ❌ Not a match
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MatchConfirmation;
