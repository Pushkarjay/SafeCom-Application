import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { customersRouter } from './routes/customers.js'
import { techniciansRouter } from './routes/technicians.js'
import { jobsRouter } from './routes/jobs.js'
import { razorpayRouter } from './routes/razorpay.js'
import { paymentsRouter } from './routes/payments.js'
import { catalogRouter } from './routes/catalog.js'
import { catalogPublicRouter } from './routes/catalogPublic.js'
import { authenticateToken } from './middleware/auth.js'
import { verifyFirebaseIdToken } from './middleware/firebaseAuth.js'
import employeeRoutes from './routes/employees.js'
import usersRoutes from './routes/users.js'

export function createApp() {
  const app = express()

  // Security middleware
  app.use(helmet())
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:3000').split(',').map(o => o.trim())
  const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin) || localhostRegex.test(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(morgan('dev'))

  // Health check endpoint (public)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'safecom-backend', scope: 'CCTV', timestamp: new Date().toISOString() })
  })

  // Public auth routes
  app.use('/api/auth', authRouter)

  // Public catalog routes (no authentication required for service catalog and pricing)
  app.use('/api/catalog-public', catalogPublicRouter)

  // Protected routes (require Firebase authentication)
  app.use('/api/dashboard', verifyFirebaseIdToken, dashboardRouter)
  app.use('/api/customers', verifyFirebaseIdToken, customersRouter)
  app.use('/api/technicians', verifyFirebaseIdToken, techniciansRouter)
  app.use('/api/jobs', verifyFirebaseIdToken, jobsRouter)
  app.use('/api/payments/razorpay', razorpayRouter)
  app.use('/api/payments', verifyFirebaseIdToken, paymentsRouter)
  app.use('/api/catalog', verifyFirebaseIdToken, catalogRouter)
  app.use('/api/employees', verifyFirebaseIdToken, employeeRoutes)
  app.use('/api/users', verifyFirebaseIdToken, usersRoutes)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' })
  })

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ message })
  })

  return app
}
