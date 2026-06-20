export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dogs: {
        Row: {
          id: string
          sex: string
          age_group: string
          condition: string
          sterilization_status: string
          visual_tags: Json
          cover_image_url: string | null
          programme_type: string
          vaccination_status: string
          vaccination_date: string | null
          next_vaccination_due: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sex?: string
          age_group?: string
          condition?: string
          sterilization_status?: string
          visual_tags?: Json
          cover_image_url?: string | null
          programme_type?: string
          vaccination_status?: string
          vaccination_date?: string | null
          next_vaccination_due?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sex?: string
          age_group?: string
          condition?: string
          sterilization_status?: string
          visual_tags?: Json
          cover_image_url?: string | null
          programme_type?: string
          vaccination_status?: string
          vaccination_date?: string | null
          next_vaccination_due?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          dog_id: string
          event_type: string
          location: string | null
          location_accuracy: number | null
          handler_name: string | null
          notes: string | null
          confirmed_match: boolean
          vaccine_type: string | null
          vaccine_batch: string | null
          vaccinator_name: string | null
          timestamp: string
          vaccine_type: string | null
          vaccine_batch: string | null
          vaccinator_name: string | null
        }
        Insert: {
          id?: string
          dog_id: string
          event_type: string
          location?: string | null
          location_accuracy?: number | null
          handler_name?: string | null
          notes?: string | null
          confirmed_match?: boolean
          vaccine_type?: string | null
          vaccine_batch?: string | null
          vaccinator_name?: string | null
          timestamp?: string
          vaccine_type?: string | null
          vaccine_batch?: string | null
          vaccinator_name?: string | null
        }
        Update: {
          id?: string
          dog_id?: string
          event_type?: string
          location?: string | null
          location_accuracy?: number | null
          handler_name?: string | null
          notes?: string | null
          confirmed_match?: boolean
          vaccine_type?: string | null
          vaccine_batch?: string | null
          vaccinator_name?: string | null
          timestamp?: string
          vaccine_type?: string | null
          vaccine_batch?: string | null
          vaccinator_name?: string | null
        }
      }
      dog_images: {
        Row: {
          id: string
          dog_id: string
          event_id: string | null
          image_url: string
          is_cover: boolean
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          dog_id: string
          event_id?: string | null
          image_url: string
          is_cover?: boolean
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          dog_id?: string
          event_id?: string | null
          image_url?: string
          is_cover?: boolean
          embedding?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      dog_current_status: {
        Row: {
          dog_id: string
          current_status: string
          last_event_at: string
          last_event_location: unknown
          last_notes: string | null
          last_handler: string | null
          sex: string
          age_group: string
          condition: string
          sterilization_status: string
          visual_tags: Json
          cover_image_url: string | null
          programme_type: string
          vaccination_status: string
          vaccination_date: string | null
          next_vaccination_due: string | null
          registered_at: string
          catch_location: unknown
          catch_location_accuracy: number | null
          catch_timestamp: string
          catch_handler: string | null
          catch_notes: string | null
        }
      }
    }
    Functions: {
      find_nearby_catches: {
        Args: {
          lat: number
          lng: number
          radius_metres?: number
        }
        Returns: {
          dog_id: string
          event_id: string
          catch_timestamp: string
          handler_name: string
          notes: string
          distance_metres: number
          location_accuracy: number
          sex: string
          age_group: string
          condition: string
          sterilization_status: string
          visual_tags: Json
          cover_image_url: string | null
          current_status: string
          programme_type: string
        }[]
      }
      log_release: {
        Args: {
          p_dog_id: string
          p_lat?: number
          p_lng?: number
          p_location_accuracy?: number
          p_handler_name?: string
          p_notes?: string
          p_confirmed_match?: boolean
        }
        Returns: string
      }
      create_catch_event: {
        Args: {
          p_sex?: string
          p_age_group?: string
          p_condition?: string
          p_sterilization_status?: string
          p_visual_tags?: Json
          p_lat?: number
          p_lng?: number
          p_location_accuracy?: number
          p_handler_name?: string
          p_notes?: string
        }
        Returns: {
          dog_id: string
          event_id: string
        }[]
      }
      create_onsite_vaccination: {
        Args: {
          p_sex: string
          p_age_group: string
          p_condition: string
          p_visual_tags: Json
          p_lat: number
          p_lng: number
          p_location_accuracy: number
          p_vaccine_type: string
          p_vaccine_batch: string
          p_vaccinator_name: string
          p_handler_name: string
          p_notes: string
        }
        Returns: {
          dog_id: string
          event_id: string
        }[]
      }
      get_dashboard_stats: {
        Args: {
          since: string
        }
        Returns: {
          total_registered: number
          currently_in_clinic: number
          released_in_period: number
          needs_attention: number
          caught_in_period: number
          vaccinated_in_period: number
          sterilized_in_period: number
          cnvr_total: number
          cnvr_caught_period: number
          cnvr_sterilized_period: number
          cnvr_released_period: number
          vacc_total: number
          vacc_in_period: number
          vacc_rabies_period: number
          vacc_boosters_due: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
