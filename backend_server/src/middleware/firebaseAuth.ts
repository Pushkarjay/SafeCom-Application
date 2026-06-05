import { Request, Response, NextFunction } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { initFirebase } from '../services/firestore.js'
import jwt from 'jsonwebtoken'

export interface FirebaseAuthenticatedRequest extends Request {
  firebaseUid?: string
  firebaseClaims?: Record<string, unknown>
}

const jwtSecret = process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? 'safecom-development-secret'

/**
 * Middleware to verify Authorization header (Bearer <token>).
 * Accepts EITHER a Firebase ID token OR an admin JWT token.
 * Attaches `firebaseUid` and `firebaseClaims` to the request on success.
 */
export async function verifyFirebaseIdToken(req: FirebaseAuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header. Format: Bearer <token>' })
  }

  const token = header.slice(7)

  // Try JWT verification first (admin dashboard uses JWT)
  try {
    const user = jwt.verify(token, jwtSecret) as { id: string; email?: string; name?: string; role?: string }
    req.firebaseUid = user.id
    req.firebaseClaims = user as unknown as Record<string, unknown>
    return next()
  } catch (jwtErr) {
    // JWT failed — try Firebase ID token (mobile apps)
    try {
      initFirebase()
      const auth = getAuth()
      const decoded = await auth.verifyIdToken(token)
      req.firebaseUid = decoded.uid
      req.firebaseClaims = decoded as Record<string, unknown>
      return next()
    } catch (fbErr) {
      console.error('Token verification failed (tried JWT and Firebase ID):', jwtErr instanceof Error ? jwtErr.message : jwtErr)
      return res.status(401).json({ message: 'Invalid authentication token' })
    }
  }
}
