import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { customersRouter } from './routes/customers.js'
import { techniciansRouter } from './routes/technicians.js'
import { jobsRouter } from './routes/jobs.js'
import { paymentsRouter } from './routes/payments.js'
import { catalogRouter } from './routes/catalog.js'
import { authenticateToken } from './middleware/auth.js'

export function createApp() {
  const app = express()

  // Security middleware
  app.use(helmet())
  app.use(cors({
    origin: (process.env.CORS_ORIGINS || 'http://127.0.0.1:3000').split(',').map(o => o.trim()),
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

  // Protected routes (require authentication)
  app.use('/api/dashboard', authenticateToken, dashboardRouter)
  app.use('/api/customers', authenticateToken, customersRouter)
  app.use('/api/technicians', authenticateToken, techniciansRouter)
  app.use('/api/jobs', authenticateToken, jobsRouter)
  app.use('/api/payments', authenticateToken, paymentsRouter)
  app.use('/api/catalog', authenticateToken, catalogRouter)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' })
  })

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ message })
  })

  return app
}
