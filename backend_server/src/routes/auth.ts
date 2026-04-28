import { Router } from 'express'
import { z } from 'zod'
import { adminUsers } from '../data/mock-data.js'
import { createToken } from '../middleware/auth.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
})

export const authRouter = Router()

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload', issues: parsed.error.flatten() })
  }

  const user = adminUsers.find((entry) => entry.email === parsed.data.email && entry.password === parsed.data.password)

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const { password: _password, ...safeUser } = user
  return res.json({ token: createToken(safeUser), user: safeUser })
})

authRouter.get('/me', (_req, res) => {
  return res.json({ message: 'Auth service is available' })
})
