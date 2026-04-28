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
      // Mock authentication - in production, call real API
      if (email === 'admin@safecom.com' && password === 'admin123') {
        const admin: Admin = {
          id: 'ADMIN001',
          email: 'admin@safecom.com',
          name: 'SafeCom Admin',
          role: 'super_admin'
        }
        localStorage.setItem('safecom_admin_token', 'mock_token_' + Date.now())
        localStorage.setItem('safecom_admin', JSON.stringify(admin))
        set({ admin, isAuthenticated: true, isLoading: false })
      } else {
        throw new Error('Invalid credentials')
      }
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
