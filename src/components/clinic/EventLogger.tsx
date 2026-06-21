import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Syringe, Scissors, HeartPulse, ArrowRight, XCircle, AlertTriangle, MapPin, Camera } from 'lucide-react';
import { EventType, ClinicalOutcome, VaccineType, BoosterSchedule } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LocationCapture } from '@/components/catch/LocationCapture';
import { useGPS } from '@/hooks/useGPS';

interface EventLoggerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dogId: string;
  eventType: EventType;
  onSuccess: () => void;
  catchPhotoUrl?: string | null;
}

export const EventLogger: React.FC<EventLoggerProps> = ({
  isOpen,
  onOpenChange,
  dogId,
  eventType,
  onSuccess,
  catchPhotoUrl
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<ClinicalOutcome>('completed');
  const [vaccineType, setVaccineType] = useState<VaccineType>('rabies');
  const [vaccineBatch, setVaccineBatch] = useState('');
  const [vaccinatorName, setVaccinatorName] = useState(profile?.full_name || '');
  const [schedules, setSchedules] = useState<BoosterSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [confirmedMatch, setConfirmedMatch] = useState(false);
  const [treatmentType, setTreatmentType] = useState('');
  const [procedureDate, setProcedureDate] = useState(new Date().toISOString().split('T')[0]);
  const [surgeonName, setSurgeonName] = useState(profile?.full_name || '');

  const { location, accuracy, requestLocation } = useGPS();

  useEffect(() => {
    if (eventType === 'vaccinate') {
      fetchSchedules();
    }
  }, [eventType, vaccineType]);

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from('booster_schedules')
      .select('*')
      .eq('vaccine_type', vaccineType);

    if (data) {
      setSchedules(data as any);
      const defaultSchedule = (data as any[]).find(s => s.is_default);
      if (defaultSchedule) {
        setSelectedScheduleId(defaultSchedule.id);
      } else if (data.length > 0) {
        setSelectedScheduleId((data[0] as any).id);
      }
    }
  };

  const handleSubmit = async () => {
    if (!profile) return;

    setIsSubmitting(true);
    try {
      const finalNotes = eventType === 'treat' && treatmentType
        ? `[${treatmentType}] ${notes}`
        : notes;

      const { error } = await (supabase.rpc as any)('log_clinic_event', {
        p_dog_id: dogId,
        p_event_type: eventType,
        p_outcome: outcome,
        p_handler_id: profile.id,
        p_handler_name: profile.full_name,
        p_vaccinator_name: eventType === 'vaccinate' ? vaccinatorName : (eventType === 'sterilize' ? surgeonName : null),
        p_vaccine_type: eventType === 'vaccinate' ? vaccineType : null,
        p_vaccine_batch: eventType === 'vaccinate' ? vaccineBatch : null,
        p_lat: eventType === 'release' ? location?.lat : null,
        p_lng: eventType === 'release' ? location?.lng : null,
        p_location_accuracy: eventType === 'release' ? accuracy : null,
        p_notes: finalNotes,
        p_confirmed_match: eventType === 'release' ? confirmedMatch : false
      });

      if (error) throw error;

      toast({
        title: 'Event logged successfully',
        description: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} record created.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error logging event',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const configMap: Record<string, { icon: any, color: string, bg: string, label: string }> = {
    vaccinate: { icon: Syringe, color: 'text-[#06B6D4]', bg: 'bg-[#ECFEFF]', label: 'Vaccinate' },
    sterilize: { icon: Scissors, color: 'text-[#8B5CF6]', bg: 'bg-[#F5F3FF]', label: 'Mark Neutered' },
    treat: { icon: HeartPulse, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]', label: 'Medical Treatment' },
    release: { icon: ArrowRight, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', label: 'Release Dog' },
    died: { icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]', label: 'Dog Died' },
    escaped: { icon: AlertTriangle, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]', label: 'Dog Escaped' },
    catch: { icon: Camera, color: 'text-[#6B7280]', bg: 'bg-slate-100', label: 'Catch' },
    observation: { icon: Camera, color: 'text-[#6B7280]', bg: 'bg-slate-100', label: 'Observation' },
    recover: { icon: Camera, color: 'text-[#6B7280]', bg: 'bg-slate-100', label: 'Recover' },
    on_site_vaccinate: { icon: Syringe, color: 'text-[#06B6D4]', bg: 'bg-[#ECFEFF]', label: 'Field Vaccinated' },
  };

  const config = configMap[eventType] || configMap.catch;
  const Icon = config.icon;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] px-6 pb-safe pt-2 sm:max-w-none">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

        <SheetHeader className="mb-6 flex flex-row items-center gap-4 text-left">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", config.bg)}>
            <Icon className={cn("h-8 w-8", config.color)} />
          </div>
          <div>
            <SheetTitle className="text-[18px] font-bold">{config.label}</SheetTitle>
            <SheetDescription className="text-[13px]">
              ID: {dogId.toUpperCase()}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="max-h-[70vh] overflow-y-auto pb-6">
          {eventType === 'vaccinate' && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Vaccine Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['rabies', 'distemper', 'combo', 'booster'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setVaccineType(t as VaccineType)}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-xl border text-[13px] font-medium transition-all",
                        vaccineType === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-muted"
                      )}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Booster Schedule</label>
                <select
                  className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                  value={selectedScheduleId || ''}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                >
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.schedule_name} — booster in {s.first_booster_days} days
                    </option>
                  ))}
                </select>
                {selectedScheduleId && (
                  <p className="mt-2 text-[12px] text-muted">
                    Preview: Due on {new Date(Date.now() + (schedules.find(s => s.id === selectedScheduleId)?.first_booster_days || 0) * 86400000).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-dark">Batch Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                    value={vaccineBatch}
                    onChange={(e) => setVaccineBatch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-dark">Vaccinator</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                    value={vaccinatorName}
                    onChange={(e) => setVaccinatorName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'sterilize' && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Outcome</label>
                <div className="space-y-2">
                  {[
                    { id: 'completed', label: '✅ Surgery completed' },
                    { id: 'health_unfit', label: '⚠️ Health unfit for surgery' },
                    { id: 'already_done', label: 'Already neutered previously' }
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOutcome(o.id as ClinicalOutcome)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border p-4 text-[14px] font-medium transition-all",
                        outcome === o.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-muted"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-dark">Date of Procedure</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                    value={procedureDate}
                    onChange={(e) => setProcedureDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-dark">Surgeon Name</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-border bg-white p-3 text-[14px] outline-none focus:border-primary"
                    value={surgeonName}
                    onChange={(e) => setSurgeonName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'treat' && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Treatment Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Wound care', 'Infection', 'Fracture', 'Mange', 'Tick removal', 'Other'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTreatmentType(t)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-[12px] font-bold transition-all",
                        treatmentType === t
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-dark">Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  {['completed', 'deferred'].map((o) => (
                    <button
                      key={o}
                      onClick={() => setOutcome(o as ClinicalOutcome)}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-xl border text-[13px] font-medium transition-all",
                        outcome === o
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-muted"
                      )}
                    >
                      {o === 'deferred' ? 'Follow-up needed' : 'Completed'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {eventType === 'release' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted">Catch Photo</label>
                  <div className="aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                    {catchPhotoUrl ? (
                      <img src={catchPhotoUrl} className="h-full w-full object-cover" alt="Catch" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Camera size={24} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-muted">Release Photo</label>
                  <div className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                    <div className="text-center">
                      <Camera className="mx-auto mb-2" size={24} />
                      <span className="text-[10px] font-medium">Ready for capture</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="confirm-match"
                    checked={confirmedMatch}
                    onChange={(e) => setConfirmedMatch(e.target.checked)}
                    className="h-5 w-5 rounded border-primary text-primary focus:ring-primary"
                  />
                  <label htmlFor="confirm-match" className="text-[14px] font-semibold text-primary">
                    I confirm this is the correct dog
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <label className="mb-2 block text-center text-[12px] font-bold uppercase tracking-wider text-muted">Capture Release GPS</label>
                <LocationCapture />
                <Button
                  variant="outline"
                  size="sm"
                  className="mx-auto mt-2 flex h-8 rounded-full"
                  onClick={requestLocation}
                >
                  <MapPin size={14} className="mr-1.5" /> Recapture
                </Button>
              </div>
            </div>
          )}

          {(eventType === 'died' || eventType === 'escaped') && (
            <div className="rounded-xl bg-amber-50 p-4 text-amber-800">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-bold">This action cannot be undone</p>
                  <p className="mt-0.5 text-[12px]">Recording this will finalize the dog's status and close its active record.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <label className="mb-2 block text-[13px] font-semibold text-dark">
              {eventType === 'treat' || (outcome !== 'completed' && eventType === 'sterilize') ? 'Reason / Notes (Required)' : 'Notes (Optional)'}
            </label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-border bg-white p-4 text-[14px] outline-none focus:border-primary"
              placeholder="Add any relevant clinical details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-auto border-t border-border pt-4">
          <Button
            className={cn(
              "h-14 w-full rounded-2xl text-[16px] font-bold text-white shadow-lg",
              config.bg.replace('bg-', 'bg-').replace('bg-[', 'bg-').length > 0 ? "bg-primary" : "bg-primary",
              "hover:opacity-90"
            )}
            style={{ backgroundColor: config.color.includes('[') ? config.color.split('[')[1].split(']')[0] : undefined }}
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (eventType === 'release' && !confirmedMatch) ||
              ((eventType === 'died' || eventType === 'escaped') && !notes) ||
              (eventType === 'treat' && !notes) ||
              (eventType === 'sterilize' && outcome !== 'completed' && !notes)
            }
          >
            {isSubmitting ? 'Logging...' : `Confirm ${config.label}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
