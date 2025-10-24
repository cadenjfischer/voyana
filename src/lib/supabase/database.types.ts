// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string
          user_id: string
          name: string
          destination: string
          destination_photo: string | null
          start_date: string
          end_date: string
          days: Day[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          destination: string
          destination_photo?: string | null
          start_date: string
          end_date: string
          days?: Day[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          destination?: string
          destination_photo?: string | null
          start_date?: string
          end_date?: string
          days?: Day[]
          updated_at?: string
        }
      }
    }
  }
}

// Re-export types from existing itinerary.ts
import type { Trip, Day } from '@/types/itinerary'

export type { Trip, Day }
