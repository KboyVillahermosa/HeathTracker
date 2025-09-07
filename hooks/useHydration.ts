import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DatabaseService } from '../lib/database'

export function useHydration() {
  const { session } = useAuth()
  const [todayTotal, setTodayTotal] = useState(0)
  const [goal, setGoal] = useState(2000) // Default 2L
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadTodayHydration()
    }
  }, [session?.user?.id])

  const loadTodayHydration = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)
      const { total } = await DatabaseService.getTodayHydration(session.user.id)
      setTodayTotal(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hydration data')
    } finally {
      setLoading(false)
    }
  }

  const logWater = async (amountMl: number) => {
    if (!session?.user?.id) return

    try {
      setError(null)
      await DatabaseService.logWaterIntake(session.user.id, amountMl)
      setTodayTotal(prev => prev + amountMl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log water intake')
      throw err
    }
  }

  const percentage = goal > 0 ? Math.min((todayTotal / goal) * 100, 100) : 0

  return {
    todayTotal,
    goal,
    percentage,
    loading,
    error,
    logWater,
    refetch: loadTodayHydration
  }
}
