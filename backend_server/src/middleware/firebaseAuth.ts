import { Request, Response, NextFunction } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { initFirebase } from '../services/firestore.js'

export interface FirebaseAuthenticatedRequest extends Request {
  firebaseUid?: string
  firebaseClaims?: Record<string, unknown>
}

/**
 * Middleware to verify Firebase ID token from Authorization header (Bearer <token>)
 * Attaches `firebaseUid` and `firebaseClaims` to the request on success.
 */
export async function verifyFirebaseIdToken(req: FirebaseAuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header. Format: Bearer <idToken>' })
  }

  const token = header.slice(7)

  try {
    // Ensure firebase admin is initialized
    initFirebase()
    const auth = getAuth()
    const decoded = await auth.verifyIdToken(token)
    req.firebaseUid = decoded.uid
    req.firebaseClaims = decoded as Record<string, unknown>
    return next()
  } catch (error) {
    console.error('Firebase token verification failed:', error)
    return res.status(401).json({ message: 'Invalid Firebase ID token' })
  }
}
