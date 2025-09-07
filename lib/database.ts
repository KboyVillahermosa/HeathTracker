import type { Database, Profile } from '../types/database'
import { supabase } from './supabase'

export class DatabaseService {
  // Profile management
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    
    return data
  }

  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Hydration tracking
  static async logWaterIntake(profileId: string, amountMl: number) {
    const { data, error } = await supabase
      .from('hydration_logs')
      .insert({
        profile_id: profileId,
        amount_ml: amountMl
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getTodayHydration(profileId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('hydration_logs')
      .select('amount_ml')
      .eq('profile_id', profileId)
      .eq('log_date', today)
    
    if (error) throw error
    
    const total = data.reduce((sum, log) => sum + log.amount_ml, 0)
    return { total, logs: data }
  }

  // Medication management
  static async getMedications(profileId: string) {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async addMedication(medication: Database['public']['Tables']['medications']['Insert']) {
    const { data, error } = await supabase
      .from('medications')
      .insert(medication)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Dashboard summary
  static async getDashboardSummary(profileId: string) {
    const { data, error } = await supabase
      .rpc('get_dashboard_summary', { user_profile_id: profileId })
    
    if (error) {
      console.error('Error fetching dashboard summary:', error)
      return null
    }
    
    return data?.[0] || null
  }
}
