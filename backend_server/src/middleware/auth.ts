import { NextFunction, Request, Response } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { AuthUser, Role } from '../types.js'
import { getAuth } from 'firebase-admin/auth'
import { initFirebase, queryCollection } from '../services/firestore.js'

const jwtSecret = process.env.JWT_SECRET ?? process.env.JWT_SECRET_KEY ?? 'safecom-development-secret'

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

async function resolveRoleFromFirebase(decoded: Record<string, unknown>): Promise<Role> {
  const claimRole = decoded['role'] as Role | undefined
  if (claimRole) {
    return claimRole
  }

  const uid = decoded.uid as string | undefined
  const email = decoded.email as string | undefined

  try {
    if (uid) {
      const adminsByUid = await queryCollection<{ id: string }>(
        'admins',
        [{ field: 'firebaseUid', operator: '==', value: uid }],
        undefined,
        1
      )
      if (adminsByUid.length > 0) {
        return 'admin'
      }
    }

    if (email) {
      const adminsByEmail = await queryCollection<{ id: string }>(
        'admins',
        [{ field: 'email', operator: '==', value: email }],
        undefined,
        1
      )
      if (adminsByEmail.length > 0) {
        return 'admin'
      }
    }
  } catch (error) {
    console.warn('Failed to resolve role from Firestore:', error)
  }

  return 'customer'
}

export function createToken(user: AuthUser): string {
  const expiresIn = (process.env.JWT_EXPIRY ?? '7d') as string | number
  return jwt.sign(user, jwtSecret, { expiresIn } as SignOptions)
}

/**
 * Main authentication middleware - validates JWT token from Authorization header
 * Supports: Bearer <token>
 */
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header. Format: Bearer <token>' })
  }

  const token = header.slice(7)

  try {
    const user = jwt.verify(token, jwtSecret) as AuthUser
    req.user = user
    ;(req as unknown as { firebaseUid?: string }).firebaseUid = user.id
    ;(req as unknown as { firebaseClaims?: Record<string, unknown> }).firebaseClaims = user as unknown as Record<string, unknown>
    return next()
  } catch (error) {
    // Try to verify as Firebase ID token as a fallback
    try {
      initFirebase()
      const decoded = await getAuth().verifyIdToken(token)
      const role = await resolveRoleFromFirebase(decoded as Record<string, unknown>)
      // Map Firebase decoded token to AuthUser shape
      const mapped: AuthUser = {
        id: decoded.uid,
        email: (decoded.email as string) ?? '',
        name: (decoded.name as string) ?? ((decoded.email as string) ?? 'user'),
        role
      }
      req.user = mapped
      ;(req as unknown as { firebaseUid?: string }).firebaseUid = decoded.uid
      ;(req as unknown as { firebaseClaims?: Record<string, unknown> }).firebaseClaims = decoded as Record<string, unknown>
      return next()
    } catch (fbErr) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Token has expired' })
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid token' })
      }
      return res.status(401).json({ message: 'Authentication failed' })
    }
  }
}

/**
 * Role-based access control middleware
 * Usage: app.use('/admin', requireRole(['admin']))
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: requires one of [${allowedRoles.join(', ')}], but user has role '${req.user.role}'`
      })
    }

    return next()
  }
}

/**
 * Optional authentication - sets user if token exists, but doesn't fail if missing
 */
export async function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next()
  }

  const token = header.slice(7)

  try {
    // Try JWT verification first
    const user = jwt.verify(token, jwtSecret) as AuthUser
    req.user = user
  } catch {
    // If JWT fails, try Firebase ID token as fallback
    try {
      initFirebase()
      const decoded = await getAuth().verifyIdToken(token)
      const role = await resolveRoleFromFirebase(decoded as Record<string, unknown>)
      // Map Firebase decoded token to AuthUser shape
      const mapped: AuthUser = {
        id: decoded.uid,
        email: (decoded.email as string) ?? '',
        name: (decoded.name as string) ?? ((decoded.email as string) ?? 'user'),
        role
      }
      req.user = mapped
    } catch {
      // Silently ignore token errors for optional auth
    }
  }

  return next()
}

