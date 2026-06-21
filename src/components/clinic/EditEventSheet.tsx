import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Pencil, Info } from 'lucide-react';
import { DogEvent, ClinicalOutcome, VaccineType } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/StatusBadge';
import { format } from 'date-fns';

interface EditEventSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: DogEvent | null;
  onSuccess: () => void;
}

export const EditEventSheet: React.FC<EditEventSheetProps> = ({
  isOpen,
  onOpenChange,
  event,
  onSuccess
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable fields
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<ClinicalOutcome | ''>('');
  const [vaccineType, setVaccineType] = useState<VaccineType | ''>('');
  const [vaccineBatch, setVaccineBatch] = useState('');
  const [handlerName, setHandlerName] = useState('');
  const [editReason, setEditReason] = useState('');

  useEffect(() => {
    if (event) {
      setNotes(event.notes || '');
      setOutcome(event.outcome || '');
      setVaccineType(event.vaccine_type || '');
      setVaccineBatch(event.vaccine_batch || '');
      setHandlerName(event.handler_name || '');
      setEditReason('');
    }
  }, [event, isOpen]);

  if (!event) return null;

  const handleSubmit = async () => {
    if (!profile || !editReason) return;

    setIsSubmitting(true);
    try {
      // Helper to return null if value hasn't changed

      // Special handling for outcome/vaccineType which might be null in original
      const getNullableVal = (current: any, original: any) => {
        const normalizedOriginal = original || '';
        return current === normalizedOriginal ? null : (current === '' ? null : current);
      };

      const { data: success, error } = await (supabase.rpc as any)('edit_event', {
        p_event_id: event.id,
        p_editor_id: profile.id,
        p_edit_reason: editReason,
        p_notes: getNullableVal(notes, event.notes),
        p_outcome: getNullableVal(outcome, event.outcome),
        p_vaccine_type: getNullableVal(vaccineType, event.vaccine_type),
        p_vaccine_batch: getNullableVal(vaccineBatch, event.vaccine_batch),
        p_handler_name: !event.handler_id ? getNullableVal(handlerName, event.handler_name) : null
      });

      if (error) throw error;

      if (success) {
        toast({
          title: 'Correction saved',
          description: 'The event has been updated successfully.',
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: 'Could not update event. The edit window may have expired.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating event',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSterilizeOrTreat = event.event_type === 'sterilize' || event.event_type === 'treat';
  const isVaccinate = event.event_type === 'vaccinate' || event.event_type === 'on_site_vaccinate';
  const showHandlerName = !event.handler_id;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] px-6 pb-safe pt-2 sm:max-w-none">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

        <SheetHeader className="mb-6 flex flex-row items-center gap-4 text-left">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Pencil className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-[18px] font-bold">Edit Event</SheetTitle>
              <StatusBadge status={event.event_type} variant="subtle" />
            </div>
            <SheetDescription className="text-[12px] font-medium text-[#9CA3AF]">
              Original: {format(new Date(event.timestamp), 'MMM d, h:mm a')}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="max-h-[70vh] overflow-y-auto pb-6">
          <div className="mb-6 rounded-xl bg-amber-50 p-4 text-amber-800">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold uppercase tracking-tight">Important</p>
                <p className="text-[12px] leading-relaxed">Only correct genuine mistakes. All edits are logged permanently in the audit trail.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Notes - All types */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-dark">Notes</label>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-border bg-white p-4 text-[14px] outline-none focus:border-primary"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Outcome - sterilize, treat */}
            {isSterilizeOrTreat && (
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Outcome</label>
                <select
                  className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as ClinicalOutcome)}
                >
                  <option value="completed">Completed</option>
                  <option value="health_unfit">Health Unfit</option>
                  <option value="already_done">Already Done</option>
                  <option value="owner_refused">Owner Refused</option>
                  <option value="escaped">Escaped</option>
                  <option value="died">Died</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>
            )}

            {/* Vaccine Type & Batch - vaccinate */}
            {isVaccinate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-dark">Vaccine Type</label>
                  <select
                    className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                    value={vaccineType}
                    onChange={(e) => setVaccineType(e.target.value as VaccineType)}
                  >
                    <option value="rabies">Rabies</option>
                    <option value="distemper">Distemper</option>
                    <option value="combo">Combo</option>
                    <option value="booster">Booster</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-dark">Batch Number</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                    value={vaccineBatch}
                    onChange={(e) => setVaccineBatch(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Handler Name - only for pre-V3 (no handler_id) */}
            {showHandlerName && (
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Handler Name</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                  value={handlerName}
                  onChange={(e) => setHandlerName(e.target.value)}
                />
              </div>
            )}

            <div className="pt-2">
              <p className="flex items-center gap-1.5 text-[12px] italic text-[#9CA3AF]">
                <Info size={14} /> Location, date, and event type cannot be changed
              </p>
            </div>

            <div className="border-t border-border pt-5">
              <label className="mb-2 block text-[13px] font-bold text-dark">Edit Reason (Required)</label>
              <input
                type="text"
                placeholder="e.g. 'Wrong batch number entered'"
                className={cn(
                  "w-full rounded-xl border p-4 text-[14px] outline-none transition-all",
                  editReason ? "border-primary focus:border-primary" : "border-border focus:border-slate-400"
                )}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          <Button
            className="h-14 w-full rounded-2xl bg-primary text-[16px] font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting || !editReason.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Correction'}
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full rounded-xl text-[14px] font-medium text-muted"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
