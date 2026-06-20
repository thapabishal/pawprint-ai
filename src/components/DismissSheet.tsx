import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDismissReminder } from '@/hooks/useBoosterReminders';
import { useToast } from '@/hooks/use-toast';
import type { BoosterReminder } from '@/types';

interface DismissSheetProps {
  reminder: BoosterReminder | null;
  isOpen: boolean;
  onClose: () => void;
}

const DISMISS_REASONS = [
  "Dog already vaccinated elsewhere",
  "Dog not found / escaped",
  "Owner declined",
  "Other (add note below)"
];

export const DismissSheet: React.FC<DismissSheetProps> = ({ reminder, isOpen, onClose }) => {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const { mutate: dismiss, isPending } = useDismissReminder();
  const { toast } = useToast();

  const handleDismiss = () => {
    if (!reminder) return;

    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for dismissing this reminder.",
        variant: "destructive",
      });
      return;
    }

    if (reason === "Other (add note below)" && !notes.trim()) {
      toast({
        title: "Notes required",
        description: "Please provide details in the notes for 'Other' reason.",
        variant: "destructive",
      });
      return;
    }

    const finalReason = reason === "Other (add note below)" ? notes : reason;

    dismiss(
      { reminderId: reminder.id, reason: finalReason },
      {
        onSuccess: () => {
          toast({
            title: "Reminder dismissed",
            description: "The booster reminder has been hidden.",
          });
          onClose();
          setReason("");
          setNotes("");
        },
        onError: (error) => {
          toast({
            title: "Error dismissing reminder",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-[24px] px-6 pb-10 sm:max-w-full border-none">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-[20px] font-bold">Dismiss Reminder</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Warning Callout */}
          <div className="bg-amber-50 border border-amber-100 rounded-[12px] p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-0.5" size={18} />
            <p className="text-[13px] text-amber-800 font-medium leading-tight">
              This won't administer the vaccine — only hides this alert from the system.
            </p>
          </div>

          <div className="space-y-4">
            <Label className="text-[14px] font-bold text-gray-700">Reason for dismissal (Required)</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="gap-3">
              {DISMISS_REASONS.map((r) => (
                <div key={r} className="flex items-center space-x-3 p-3 rounded-[12px] border border-gray-100 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="flex-1 cursor-pointer font-medium text-[14px] text-gray-600">{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-[14px] font-bold text-gray-700">
              Additional Notes {reason === "Other (add note below)" && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              placeholder="Provide more context here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-[12px] border-gray-200 focus:ring-[#0D7377] min-h-[100px]"
            />
          </div>
        </div>

        <SheetFooter className="mt-8 flex flex-col gap-3">
          <Button
            onClick={handleDismiss}
            disabled={isPending}
            className="w-full h-14 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-[16px] shadow-lg shadow-red-100"
          >
            {isPending ? "Dismissing..." : "Dismiss Reminder"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-12 rounded-full font-bold text-gray-500 text-[15px]"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
