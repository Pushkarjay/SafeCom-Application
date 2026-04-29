import { create } from 'zustand'
import { getApiBaseUrl } from '../config/api'

export interface Admin {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin'
}

interface AuthState {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: localStorage.getItem('safecom_admin_token') ? true : false,
  isLoading: false,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      // Call backend auth endpoint
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Authentication failed')
      }

      const payload = await res.json()
      const token = payload.token
      const user = payload.user
      if (!token || !user) throw new Error('Invalid response from auth server')

      localStorage.setItem('safecom_admin_token', token)
      localStorage.setItem('safecom_admin', JSON.stringify(user))
      set({ admin: user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  
  logout: () => {
    localStorage.removeItem('safecom_admin_token')
    localStorage.removeItem('safecom_admin')
    set({ admin: null, isAuthenticated: false })
  }
}))

// Initialize auth state from localStorage on app load
const stored = localStorage.getItem('safecom_admin')
if (stored) {
  try {
    const admin = JSON.parse(stored)
    useAuthStore.setState({ admin, isAuthenticated: true })
  } catch (e) {
    localStorage.removeItem('safecom_admin')
    localStorage.removeItem('safecom_admin_token')
  }
}
