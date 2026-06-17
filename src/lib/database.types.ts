// src/lib/database.types.ts
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
          timestamp: string
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
          timestamp?: string
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
          timestamp?: string
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
