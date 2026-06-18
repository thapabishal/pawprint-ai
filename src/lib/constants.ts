export const GPS_SEARCH_RADIUS_KM = 2;
export const GPS_SEARCH_RADIUS_EXPANDED_KM = 5;

export const IMAGE_MAX_SIZE_KB = 300;

export const STORAGE_BUCKET = 'dog-images';
export const DRAFT_KEY = 'pawprint_catch_draft';
export const UPLOAD_QUEUE_KEY = 'pawprint_upload_queue';
export const UPLOAD_MAX_RETRIES = 5;
export const DRAFT_MAX_AGE_HOURS = 24;

export const EVENT_TYPES = {
  CATCH: 'catch',
  VACCINATE: 'vaccinate',
  STERILIZE: 'sterilize',
  RECOVER: 'recover',
  RELEASE: 'release',
  OBSERVATION: 'observation',
} as const;