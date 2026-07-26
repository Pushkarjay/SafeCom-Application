import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuthStore } from '@/core/services/auth_service'

export interface UsePollingDataOptions<T> {
  fetchFn: () => Promise<T>
  intervalMs?: number
  enabled?: boolean
  deps?: React.DependencyList
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
}

export interface UsePollingDataResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  isPolling: boolean
  refresh: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

export function usePollingData<T>({
  fetchFn,
  intervalMs = 30000,
  enabled = true,
  deps = [],
  onError,
  onSuccess,
}: UsePollingDataOptions<T>): UsePollingDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)
  const fetchFnRef = useRef(fetchFn)
  const enabledRef = useRef(enabled)

  fetchFnRef.current = fetchFn
  enabledRef.current = enabled

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !enabledRef.current || !isMountedRef.current) return

    try {
      setError(null)
      const result = await fetchFnRef.current()
      if (isMountedRef.current) {
        setData(result)
        setLastUpdated(new Date())
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred')
      if (isMountedRef.current) {
        setError(error)
        onError?.(error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated, onError, onSuccess])

  const refresh = useCallback(async () => {
    if (isMountedRef.current) {
      setIsLoading(true)
      await fetchData()
    }
  }, [fetchData])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return
    
    setIsPolling(true)
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && isAuthenticated && enabledRef.current) {
        fetchData()
      }
    }, intervalMs)
  }, [fetchData, intervalMs, isAuthenticated])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsPolling(false)
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()
    
    if (enabled && isAuthenticated) {
      startPolling()
    }

    return () => {
      isMountedRef.current = false
      stopPolling()
    }
  }, [enabled, isAuthenticated, ...deps, startPolling, stopPolling, fetchData])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    isPolling,
    refresh,
    startPolling,
    stopPolling,
  }
}