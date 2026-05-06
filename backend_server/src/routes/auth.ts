import { Router } from 'express'
import { queryCollection, getDocument, createDocument, updateDocument } from '../services/firestore.js'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'

export const authRouter = Router()

/**
 * POST /api/auth/login
 * Authenticate admin user using Firebase ID token
 * Returns user profile if the Firebase user is authorized as an admin
 */
authRouter.post('/login', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  const requestId = Math.random().toString(36).substring(7)
  try {
    const uid = req.firebaseUid
    const email = req.firebaseClaims?.email as string | undefined

    console.log(`[AUTH][${requestId}] Login attempt for UID: ${uid}, Email: ${email}`)

    if (!uid) {
      console.warn(`[AUTH][${requestId}] Missing UID in request`)
      return res.status(401).json({
        success: false,
        message: 'Invalid Firebase ID token'
      })
    }

    try {
      // Lookup admin record in Firestore by linked Firebase UID
      console.log(`[AUTH][${requestId}] Querying admins by firebaseUid...`)
      const adminUsers = await queryCollection<{
        id: string
        email: string
        name: string
        role: string
        firebaseUid: string
      }>('admins', [{ field: 'firebaseUid', operator: '==', value: uid }])

      let user = adminUsers[0]

       if (!user && email) {
         console.log(`[AUTH][${requestId}] No admin found by UID, querying by email: ${email}`)
         const adminByEmail = await queryCollection<{
           id: string
           email: string
           name: string
           role: string
           firebaseUid: string
         }>('admins', [{ field: 'email', operator: '==', value: email }])
         user = adminByEmail[0]
         
         if (user && !user.firebaseUid) {
           console.log(`[AUTH][${requestId}] Found admin by email, linking firebaseUid: ${uid}`)
           await updateDocument('admins', user.id, { firebaseUid: uid })
           user.firebaseUid = uid
         }
       }

      if (!user) {
        console.warn(`[AUTH][${requestId}] Access denied: User ${email || uid} is not authorized as admin`)
        return res.status(403).json({
          success: false,
          message: 'Firebase user is not authorized as an admin'
        })
      }

      console.log(`[AUTH][${requestId}] Login successful for user: ${user.email}`)
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
       const errorDetails = error instanceof Error ? { message: error.message } : { message: String(error) }
       console.error(`[AUTH][${requestId}] Firestore operation failed:`, errorDetails)
       return res.status(500).json({
         success: false,
         message: 'Authentication lookup failed',
         error: errorDetails.message
       })
     }
   } catch (error) {
     const errorDetails = error instanceof Error ? { message: error.message } : { message: String(error) }
     console.error(`[AUTH][${requestId}] Login service crash:`, errorDetails)
     return res.status(500).json({
       success: false,
       message: 'Authentication service error',
       error: errorDetails.message
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
authRouter.post('/logout', (req: FirebaseAuthenticatedRequest, res) => {
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

