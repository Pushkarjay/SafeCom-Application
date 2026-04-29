const DEV_API_BASE_URL = 'http://localhost:4000/api'

export function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '')
  }

  return DEV_API_BASE_URL
}