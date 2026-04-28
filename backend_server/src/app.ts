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

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'safecom-backend', scope: 'CCTV' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/customers', customersRouter)
  app.use('/api/technicians', techniciansRouter)
  app.use('/api/jobs', jobsRouter)
  app.use('/api/payments', paymentsRouter)

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' })
  })

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ message })
  })

  return app
}
