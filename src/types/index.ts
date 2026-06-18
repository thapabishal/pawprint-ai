export type Sex = 'male' | 'female' | 'unknown';
export type AgeGroup = 'puppy' | 'adult' | 'senior' | 'unknown';
export type Condition = 'healthy' | 'injured' | 'critical' | 'unknown';
export type SterilizationStatus = 'intact' | 'sterilized' | 'unknown';
export type EarType = 'prick' | 'semi_floppy' | 'fully_floppy' | 'cropped' | 'torn_notched';
export type CoatColor = 'red_brown' | 'black' | 'white' | 'grey' | 'brindle' | 'mixed';
export type Marking = 'white_chest' | 'white_paws' | 'black_mask' | 'sickle_tail' | 'curled_tail';
export type EventType = 'catch' | 'vaccinate' | 'sterilize' | 'recover' | 'release' | 'observation';
export type GPSStatus = 'idle' | 'requesting' | 'success' | 'failed' | 'unavailable';

export interface VisualTags {
  ears?: EarType;
  coat?: CoatColor;
  markings?: Marking[];
}

export interface Dog {
  id: string;
  sex: Sex;
  age_group: AgeGroup;
  condition: Condition;
  sterilization_status: SterilizationStatus;
  visual_tags: VisualTags;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogEvent {
  id: string;
  dog_id: string;
  event_type: EventType;
  location: GeoPoint | null;
  location_accuracy: number | null;
  handler_name: string | null;
  notes: string | null;
  confirmed_match: boolean;
  timestamp: string;
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

// Catch form draft — stored in localStorage
export interface CatchDraft {
  id: string;               // local draft ID
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
  created_at: string;       // draft started
  last_saved: string;       // last localStorage save
}

// Match result from identify flow
export interface MatchResult {
  dog: DogWithStatus;
  similarity_score: number | null;  // null if AI not available (V1)
  gps_distance_metres: number;
  tag_overlap_score: number;        // 0-1: how many visual tags match
  composite_score: number;          // weighted combination
}
