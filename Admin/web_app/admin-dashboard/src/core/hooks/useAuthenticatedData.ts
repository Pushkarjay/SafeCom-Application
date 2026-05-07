import { useEffect, useState } from 'react'
import { useAuthStore } from '@/core/services/auth_service'

/**
 * Custom hook for handling authenticated data fetching with loading states and user checks
 * @param fetchDataFn Function that returns a Promise with the data to fetch
 * @param deps Dependencies for the useEffect (excluding firebaseUser)
 * @returns Object containing data, loading state, and error state
 */
export function useAuthenticatedData<T>(
  fetchDataFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  useEffect(() => {
    const loadData = async () => {
      if (!firebaseUser) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const result = await fetchDataFn()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'))
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Re-run when firebaseUser changes or when any of the deps change
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, ...deps])

  return { data, isLoading, error }
}