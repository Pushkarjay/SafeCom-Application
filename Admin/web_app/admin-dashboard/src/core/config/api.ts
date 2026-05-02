// SafeCom Admin Dashboard - API Configuration
// Points to backend server (local development or production)

// Local development
const DEV_API_BASE_URL = 'http://127.0.0.1:5000/api'

// Production - Cloud Run deployed backend
const PROD_API_BASE_URL = 'https://safecom-backend-177425757120.us-central1.run.app/api'

export function getApiBaseUrl(): string {
  // Check for explicitly configured base URL from environment
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '')
  }

  // Check if we're in production mode
  const isProduction = import.meta.env.MODE === 'production' || 
                       import.meta.env.VITE_PROD === 'true' ||
                       window.location.hostname !== 'localhost' &&
                       window.location.hostname !== '127.0.0.1'

  if (isProduction) {
    return PROD_API_BASE_URL
  }

  return DEV_API_BASE_URL
}