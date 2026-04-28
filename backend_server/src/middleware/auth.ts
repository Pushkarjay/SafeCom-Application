import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { AuthUser, Role } from '../types.js'

const jwtSecret = process.env.JWT_SECRET ?? 'safecom-development-secret'

export interface AuthenticatedRequest extends Request {
  user?: AuthUser
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, jwtSecret, { expiresIn: '12h' })
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing bearer token' })
  }

  const token = header.slice(7)

  try {
    req.user = jwt.verify(token, jwtSecret) as AuthUser
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    return next()
  }
}
