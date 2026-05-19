import { create } from 'zustand'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth'
import { getApiBaseUrl } from '../config/api'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "safecom-application-01.firebaseapp.com",
  projectId: "safecom-application-01",
  storageBucket: "safecom-application-01.firebasestorage.app",
  messagingSenderId: "177425757120",
  appId: "1:177425757120:web:f6056611315ea5232d0e25",
  measurementId: "G-71MXD20LDV"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

export interface Admin {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin'
  firebaseUid?: string
}

interface AuthState {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  firebaseUser: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  isAuthenticated: localStorage.getItem('safecom_admin_token') ? true : false,
  isLoading: false,
  firebaseUser: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken()
      
      // Call backend to link/create admin user and get admin info
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          email: firebaseUser.email,
          firebaseUid: firebaseUser.uid
        })
      })

      if (!res.ok) {
        await firebaseSignOut(auth)
        const text = await res.text()
        throw new Error(text || 'Authentication failed')
      }

      const payload = await res.json()
      const user = (payload.data?.user ?? payload.user) || {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        role: 'admin' as const,
        firebaseUid: firebaseUser.uid
      }

      localStorage.setItem('safecom_admin_token', idToken)
      localStorage.setItem('safecom_admin', JSON.stringify(user))
      set({ 
        admin: user, 
        isAuthenticated: true, 
        isLoading: false,
        firebaseUser 
      })
    } catch (error) {
      set({ isLoading: false })
      try {
        await get().logout()
      } catch (_logoutError) {
        console.warn('Failed to clear stale auth state after login error:', _logoutError)
      }
      throw error
    }
  },
  
  logout: async () => {
    try {
      await firebaseSignOut(auth)
      localStorage.removeItem('safecom_admin_token')
      localStorage.removeItem('safecom_admin')
      set({ admin: null, isAuthenticated: false, firebaseUser: null })
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  },
  
  getIdToken: async () => {
    let { firebaseUser } = get()
    if (!firebaseUser) {
      const currentUser = auth.currentUser
      if (currentUser) {
        firebaseUser = currentUser
        set({ firebaseUser: currentUser, isAuthenticated: true })
      }
    }

    if (firebaseUser) {
      try {
        return await firebaseUser.getIdToken(true)
      } catch (error) {
        console.error('Failed to get ID token:', error)
        return null
      }
    }

    return null
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

// Immediately sync current Firebase user if already logged in
if (auth.currentUser) {
  console.log('🔐 Found existing Firebase user:', auth.currentUser.email)
  useAuthStore.setState({ firebaseUser: auth.currentUser, isAuthenticated: true })
  
  // Get a fresh token immediately to ensure it's not expired
  auth.currentUser.getIdToken(true).then(token => {
    console.log('✅ Refreshed token on app startup')
    localStorage.setItem('safecom_admin_token', token)
  }).catch(err => {
    console.error('❌ Failed to refresh token on startup:', err)
  })
}

// Keep auth state synchronized with Firebase persistence
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('🔐 Firebase user state changed:', user.email)
    useAuthStore.setState({ firebaseUser: user, isAuthenticated: true })
    
    // Get fresh token when user is restored from persistence
    user.getIdToken(true).then(token => {
      console.log('✅ Refreshed token after Firebase restoration')
      localStorage.setItem('safecom_admin_token', token)
    }).catch(err => {
      console.error('❌ Failed to refresh token:', err)
    })
  } else {
    console.log('🔐 Firebase user logged out')
    useAuthStore.setState({ firebaseUser: null, isAuthenticated: false })
  }
})

