import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DatabaseService } from '../lib/database'
import type { Profile } from '../types/database'

export function useProfile() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [session?.user?.id])

  const loadProfile = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)
      const profileData = await DatabaseService.getProfile(session.user.id)
      setProfile(profileData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user?.id) return

    try {
      setError(null)
      const updatedProfile = await DatabaseService.updateProfile(session.user.id, updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: loadProfile
  }
}
