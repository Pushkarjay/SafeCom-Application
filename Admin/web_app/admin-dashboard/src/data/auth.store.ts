import { create } from 'zustand'

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
      const baseUrl = 'http://localhost:4000/api'
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Invalid credentials')
      }

      const payload = await response.json() as { token: string; user: Admin }
      if (!payload.token || !payload.user) {
        throw new Error('Invalid auth response')
      }

      localStorage.setItem('safecom_admin_token', payload.token)
      localStorage.setItem('safecom_admin', JSON.stringify(payload.user))
      set({ admin: payload.user, isAuthenticated: true, isLoading: false })
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
  const admin = JSON.parse(stored)
  useAuthStore.setState({ admin, isAuthenticated: true })
}
