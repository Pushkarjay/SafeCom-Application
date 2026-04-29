import { Router } from 'express'
import { z } from 'zod'
import { createToken } from '../middleware/auth.js'
import { queryCollection, getDocument } from '../services/firestore.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
})

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload', issues: parsed.error.flatten() })
  }

  const { email, password } = parsed.data

  try {
    // Try Firestore first
    const users = await queryCollection<{ id: string; email: string; password: string; name: string; role: string }>(
      'admins',
      [{ field: 'email', operator: '==', value: email }]
    )

    const user = users.find(u => u.password === password)

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { password: _password, ...safeUser } = user
    // Cast role to match AuthUser type
    return res.json({ token: createToken({ ...safeUser, role: safeUser.role as 'admin' }), user: safeUser })
  } catch (error) {
    console.error('Firestore lookup failed, falling back to mock:', error)
    // Fallback to mock data if Firestore is not available
    const { adminUsers } = await import('../data/mock-data.js')
    const fallbackUser = adminUsers.find((entry) => entry.email === email && entry.password === password)

    if (!fallbackUser) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { password: _password, ...safeUser } = fallbackUser
    return res.json({ token: createToken(safeUser), user: safeUser })
  }
})

authRouter.get('/me', (_req, res) => {
  return res.json({ message: 'Auth service is available' })
})
