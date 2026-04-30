import { NextFunction, Request, Response } from 'express'
import jwt, { SignOptions } from 'jsonwebtoken'
import { AuthUser, Role } from '../types.js'

const jwtSecret = process.env.JWT_SECRET ?? 'safecom-development-secret'

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export function createToken(user: AuthUser): string {
  const expiresIn = (process.env.JWT_EXPIRY ?? '7d') as string | number
  return jwt.sign(user, jwtSecret, { expiresIn } as SignOptions)
}

/**
 * Main authentication middleware - validates JWT token from Authorization header
 * Supports: Bearer <token>
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header. Format: Bearer <token>' })
  }

  const token = header.slice(7)

  try {
    const user = jwt.verify(token, jwtSecret) as AuthUser
    req.user = user
    return next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    return res.status(401).json({ message: 'Authentication failed' })
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
export function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return next()
  }

  const token = header.slice(7)

  try {
    const user = jwt.verify(token, jwtSecret) as AuthUser
    req.user = user
  } catch {
    // Silently ignore token errors for optional auth
  }

  return next()
}

