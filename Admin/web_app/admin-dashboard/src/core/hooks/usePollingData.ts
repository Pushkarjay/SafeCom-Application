import { useEffect, useState, useRef, useCallback } from 'react'
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
  const onErrorRef = useRef(onError)
  const onSuccessRef = useRef(onSuccess)

  fetchFnRef.current = fetchFn
  enabledRef.current = enabled
  onErrorRef.current = onError
  onSuccessRef.current = onSuccess

  const executeFetch = useCallback(async () => {
    if (!isMountedRef.current) return

    const auth = useAuthStore.getState().isAuthenticated
    const enabledFlag = enabledRef.current
    const fn = fetchFnRef.current
    const errCb = onErrorRef.current
    const successCb = onSuccessRef.current

    if (!auth || !enabledFlag) return

    try {
      setError(null)
      const result = await fn()
      if (isMountedRef.current) {
        setData(result)
        setLastUpdated(new Date())
        successCb?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown data occurred')
      if (isMountedRef.current) {
        setError(error)
        errCb?.(error)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    if (isMountedRef.current) {
      setIsLoading(true)
      await executeFetch()
    }
  }, [executeFetch])

  useEffect(() => {
    isMountedRef.current = true
    executeFetch()

    if (enabled && isAuthenticated) {
      setIsPolling(true)
      intervalRef.current = setInterval(() => {
        executeFetch()
      }, intervalMs)
    }

    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
    }
  }, [enabled, isAuthenticated, intervalMs, executeFetch, ...deps])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    isPolling,
    refresh,
  }
}