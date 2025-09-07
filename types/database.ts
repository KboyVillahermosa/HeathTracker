export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          weight: number | null
          gender: 'male' | 'female' | 'other' | null
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          plan_type: 'basic' | 'premium'
          trial_started_at: string | null
          trial_ends_at: string | null
          subscription_status: 'inactive' | 'trial' | 'active' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          weight?: number | null
          gender?: 'male' | 'female' | 'other' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          plan_type?: 'basic' | 'premium'
          trial_started_at?: string | null
          trial_ends_at?: string | null
          subscription_status?: 'inactive' | 'trial' | 'active' | 'cancelled'
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          weight?: number | null
          gender?: 'male' | 'female' | 'other' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          plan_type?: 'basic' | 'premium'
          trial_started_at?: string | null
          trial_ends_at?: string | null
          subscription_status?: 'inactive' | 'trial' | 'active' | 'cancelled'
        }
      }
      hydration_logs: {
        Row: {
          id: string
          profile_id: string
          amount_ml: number
          logged_at: string
          log_date: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          amount_ml: number
          logged_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          amount_ml?: number
          logged_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          profile_id: string
          name: string
          form: string
          dosage: string | null
          dosage_unit: string | null
          dosage_amount: number | null
          color: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          form?: string
          dosage?: string | null
          dosage_unit?: string | null
          dosage_amount?: number | null
          color?: string
          notes?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          form?: string
          dosage?: string | null
          dosage_unit?: string | null
          dosage_amount?: number | null
          color?: string
          notes?: string | null
          is_active?: boolean
        }
      }
    }
    Functions: {
      get_dashboard_summary: {
        Args: { user_profile_id: string }
        Returns: {
          hydration_today_ml: number
          hydration_goal_ml: number
          hydration_percentage: number
          next_medication_name: string | null
          next_medication_time: string | null
          medications_due_count: number
          streak_days: number
        }[]
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type HydrationLog = Database['public']['Tables']['hydration_logs']['Row']
export type Medication = Database['public']['Tables']['medications']['Row']
