export type Sex = 'male' | 'female' | 'unknown';
export type AgeGroup = 'puppy' | 'adult' | 'senior' | 'unknown';
export type Condition = 'healthy' | 'injured' | 'critical' | 'unknown';
export type SterilizationStatus = 'intact' | 'sterilized' | 'unknown';
export type EarType = 'prick' | 'semi_floppy' | 'fully_floppy' | 'cropped' | 'torn_notched';
export type CoatColor = 'red_brown' | 'black' | 'white' | 'grey' | 'brindle' | 'mixed';
export type Marking = 'white_chest' | 'white_paws' | 'black_mask' | 'sickle_tail' | 'curled_tail';
export type EventType =
  | 'catch'
  | 'vaccinate'
  | 'sterilize'
  | 'recover'
  | 'treat'
  | 'release'
  | 'observation'
  | 'on_site_vaccinate'
  | 'died'
  | 'escaped';
export type GPSStatus = 'idle' | 'requesting' | 'success' | 'failed' | 'unavailable';
export type ProgrammeType = 'cnvr' | 'vaccination';
export type VaccineType = 'rabies' | 'distemper' | 'combo' | 'booster';

export type UserRole = 'field_worker' | 'clinic_vet' | 'programme_manager' | 'admin';

export type ClinicalOutcome =
  | 'completed'
  | 'health_unfit'
  | 'already_done'
  | 'owner_refused'
  | 'escaped'
  | 'died'
  | 'deferred';

export interface VisualTags {
  ears?: EarType;
  coat?: CoatColor;
  markings?: Marking[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  programmes: ProgrammeType[];
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dog {
  id: string;
  sex: Sex;
  age_group: AgeGroup;
  condition: Condition;
  sterilization_status: SterilizationStatus;
  visual_tags: VisualTags;
  cover_image_url: string | null;
  programme_type: ProgrammeType;
  vaccination_status: 'vaccinated' | 'unvaccinated' | 'unknown';
  vaccination_date: string | null;
  next_vaccination_due: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogEvent {
  id: string;
  dog_id: string;
  event_type: EventType;
  location: GeoPoint | null;
  location_accuracy: number | null;
  handler_id?: string | null;
  handler_name: string | null;
  notes: string | null;
  confirmed_match: boolean;
  vaccine_type?: VaccineType | null;
  vaccine_batch?: string | null;
  vaccinator_name?: string | null;
  outcome?: ClinicalOutcome | null;
  timestamp: string;
  handler?: { full_name: string; avatar_url: string | null; role: UserRole } | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DogImage {
  id: string;
  dog_id: string;
  event_id: string | null;
  image_url: string;
  is_cover: boolean;
  embedding: number[] | null;
  created_at: string;
}

export interface DogWithStatus extends Dog {
  current_status: EventType;
  last_updated: string;
  catch_location: GeoPoint | null;
  images: DogImage[];
  events: DogEvent[];
}

export interface CatchDraft {
  id: string;
  photo_dataurl: string | null;
  photo_size: number | null;
  sex: Sex;
  age_group: AgeGroup;
  condition: Condition;
  visual_tags: VisualTags;
  location: GeoPoint | null;
  location_accuracy: number | null;
  handler_name: string;
  notes: string;
  programme_type: ProgrammeType;
  vaccine_type: VaccineType;
  vaccine_batch: string;
  vaccinator_name: string;
  created_at: string;
  last_saved: string;
}

export interface MatchResult {
  dog: DogWithStatus;
  similarity_score: number | null;
  gps_distance_metres: number;
  tag_overlap_score: number;
  composite_score: number;
}

export interface DogCurrentStatusView {
  dog_id: string;
  current_status: EventType;
  last_event_at: string;
  last_event_location: unknown;
  last_notes: string | null;
  last_handler: string | null;
  sex: Sex;
  age_group: AgeGroup;
  condition: Condition;
  sterilization_status: SterilizationStatus;
  visual_tags: VisualTags;
  cover_image_url: string | null;
  programme_type: ProgrammeType;
  vaccination_status: 'vaccinated' | 'unvaccinated' | 'unknown';
  vaccination_date: string | null;
  next_vaccination_due: string | null;
  registered_at: string;
  catch_location: unknown;
  catch_location_accuracy: number | null;
  catch_timestamp: string;
  catch_handler: string | null;
  catch_notes: string | null;
}

export interface DogCNVRProgressView {
  dog_id: string;
  registered_at: string;
  caught_at: string | null;
  vaccinated_at: string | null;
  sterilized_at: string | null;
  released_at: string | null;
  is_caught: boolean;
  is_vaccinated: boolean;
  is_sterilized: boolean;
  is_released: boolean;
  days_in_programme: number;
  catch_location: unknown;
}

export interface DashboardStats {
  total_registered: number;
  currently_in_clinic: number;
  released_in_period: number;
  needs_attention: number;
  caught_in_period: number;
  vaccinated_in_period: number;
  sterilized_in_period: number;
  cnvr_total: number;
  cnvr_caught_period: number;
  cnvr_sterilized_period: number;
  cnvr_released_period: number;
  vacc_total: number;
  vacc_in_period: number;
  vacc_rabies_period: number;
  vacc_boosters_due: number;
  vacc_distemper_period: number;
  vacc_combo_period: number;
  vacc_booster_period: number;
}

export interface RecentActivityEvent extends DogEvent {
  dogs: {
    cover_image_url: string | null;
    programme_type: ProgrammeType;
  } | null;
}

export interface BoosterSchedule {
  id: string;
  vaccine_type: VaccineType;
  schedule_name: string;
  first_booster_days: number;
  repeat_booster_days: number | null;
  is_default: boolean;
  created_at: string;
}

export type BoosterReminderStatus = 'pending' | 'due_soon' | 'overdue' | 'completed' | 'dismissed';

export interface BoosterReminder {
  id: string;
  dog_id: string;
  vaccination_event_id: string;
  schedule_id: string | null;
  vaccine_type: VaccineType;
  due_date: string;
  status: BoosterReminderStatus;
  completed_at: string | null;
  completed_event_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldWorkerStats {
  user_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  catches: number;
  vaccinations: number;
  releases: number;
  total_events: number;
  last_active: string | null;
}
