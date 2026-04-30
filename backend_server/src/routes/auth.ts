import { Router } from 'express'
import { z } from 'zod'
import { createToken, authenticateToken } from '../middleware/auth.js'
import { queryCollection, getDocument } from '../services/firestore.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(4, 'Password must be at least 4 characters')
})

export const authRouter = Router()

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 * Returns JWT token and user profile
 */
authRouter.post('/login', async (req, res) => {
  try {
    // Validate input schema
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid login payload',
        issues: parsed.error.flatten()
      })
    }

    const { email, password } = parsed.data

    try {
      // Try to fetch from Firestore (admins collection)
      const adminUsers = await queryCollection<{
        id: string
        email: string
        password: string
        name: string
        role: string
      }>('admins', [{ field: 'email', operator: '==', value: email }])

      const user = adminUsers.find(u => u.password === password)

      if (user) {
        const { password: _password, ...safeUser } = user
        const token = createToken({
          ...safeUser,
          role: safeUser.role as 'admin' | 'customer' | 'employee'
        })
        return res.json({
          success: true,
          token,
          user: safeUser,
          message: 'Logged in successfully'
        })
      }
    } catch (error) {
      console.warn('[AUTH] Firestore lookup failed, falling back to mock data:', error)
    }

    // Fallback to mock data if Firestore is not available
    const { adminUsers: mockAdmins } = await import('../data/mock-data.js')
    const fallbackUser = mockAdmins.find(
      entry => entry.email === email && entry.password === password
    )

    if (!fallbackUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        user: null
      })
    }

    const { password: _password, ...safeUser } = fallbackUser
    const token = createToken(safeUser)
    return res.json({
      success: true,
      token,
      user: safeUser,
      message: 'Logged in successfully (using mock data)'
    })
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

