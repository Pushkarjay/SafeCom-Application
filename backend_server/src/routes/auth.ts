import { Router } from 'express'
import { queryCollection, getDocument } from '../services/firestore.js'
import { authenticateToken } from '../middleware/auth.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'

export const authRouter = Router()

/**
 * POST /api/auth/login
 * Authenticate admin user using Firebase ID token
 * Returns user profile if the Firebase user is authorized as an admin
 */
authRouter.post('/login', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  try {
    const uid = req.firebaseUid
    const email = req.firebaseClaims?.email as string | undefined

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase ID token'
      })
    }

    try {
      // Lookup admin record in Firestore by linked Firebase UID
      const adminUsers = await queryCollection<{
        id: string
        email: string
        name: string
        role: string
        firebaseUid: string
      }>('admins', [{ field: 'firebaseUid', operator: '==', value: uid }])

      let user = adminUsers[0]

      if (!user && email) {
        const adminByEmail = await queryCollection<{
          id: string
          email: string
          name: string
          role: string
          firebaseUid: string
        }>('admins', [{ field: 'email', operator: '==', value: email }])
        user = adminByEmail[0]
      }

      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'Firebase user is not authorized as an admin'
        })
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          firebaseUid: user.firebaseUid
        },
        message: 'Logged in successfully'
      })
    } catch (error) {
      console.error('[AUTH] Firestore admin lookup failed:', error)
      return res.status(500).json({
        success: false,
        message: 'Authentication lookup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } catch (error) {
    console.error('[AUTH] Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/auth/me
 * Get current authenticated user profile (requires authentication)
 */
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' })
  }
  return res.json({
    success: true,
    user: req.user,
    message: 'Current user profile'
  })
})

/**
 * POST /api/auth/logout
 * Client-side logout (token invalidation happens on client)
 */
authRouter.post('/logout', (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully. Client should remove the token.'
  })
})

/**
 * GET /api/auth/health
 * Check if auth service is available
 */
authRouter.get('/health', (_req, res) => {
  return res.json({
    success: true,
    message: 'Authentication service is available and operational'
  })
})

