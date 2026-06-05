import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { customersRouter } from './routes/customers.js'
import { techniciansRouter } from './routes/technicians.js'
import { jobsRouter } from './routes/jobs.js'
import { bookingsRouter } from './routes/bookings.js'
import { serviceabilityRouter } from './routes/serviceability.js'
import { razorpayRouter } from './routes/razorpay.js'
import { paymentsRouter } from './routes/payments.js'
import { catalogRouter } from './routes/catalog.js'
import { catalogPublicRouter } from './routes/catalogPublic.js'
import { productsRouter } from './routes/products.js'
import { servicesRouter } from './routes/services.js'
import { accessoriesRouter } from './routes/accessories.js'
import { maintenancePlansRouter } from './routes/maintenance-plans.js'
import { recommendationsRouter } from './routes/recommendations.js'
import { sduiRouter } from './routes/sdui.js'
import { homeCmsRouter } from './routes/homeCms.js'
import { authenticateToken } from './middleware/auth.js'
import { verifyFirebaseIdToken } from './middleware/firebaseAuth.js'
import employeeRoutes from './routes/employees.js'
import usersRoutes from './routes/users.js'
import { servicesAdminRouter } from './routes/servicesAdmin.js'
import { sduiAdminRouter } from './routes/sduiAdmin.js'
import { installationAdminRouter } from './routes/installationAdmin.js'
import { addressesRouter } from './routes/addresses.js'

export function createApp() {
  const app = express()

  // Security middleware
  app.use(helmet())
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:3000,https://safecom-application-01.web.app').split(',').map(o => o.trim())
  const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || corsOrigins.includes(origin) || localhostRegex.test(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
  }
  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))
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

  // Public serviceability check (for map validation)
  app.use('/api/serviceability', serviceabilityRouter)

  // Public SDUI layout routes (dynamic UI, no authentication required)
  app.use('/api/sdui', sduiRouter)

  // Public home CMS routes
  app.use('/api/home-cms', homeCmsRouter)

  // Catalog routes - Products (partially protected)
  app.use('/api/catalog/products', productsRouter)

  // Catalog routes - Services (partially protected)
  app.use('/api/catalog/services', servicesRouter)

  // Catalog routes - Accessories (partially protected)
  app.use('/api/catalog/accessories', accessoriesRouter)

  // Catalog routes - Maintenance Plans (partially protected)
  app.use('/api/catalog/maintenance-plans', maintenancePlansRouter)

  // Catalog routes - Recommendations (partially protected)
  app.use('/api/catalog/recommendations', recommendationsRouter)

  // Protected routes (require authentication — supports both admin JWT and Firebase ID tokens)
  app.use('/api/dashboard', authenticateToken, dashboardRouter)
  app.use('/api/customers', authenticateToken, customersRouter)
  app.use('/api/customers', authenticateToken, addressesRouter)
  app.use('/api/technicians', authenticateToken, techniciansRouter)
  app.use('/api/jobs', authenticateToken, jobsRouter)
  app.use('/api/bookings', authenticateToken, bookingsRouter)
  app.use('/api/payments/razorpay', authenticateToken, razorpayRouter)
  app.use('/api/payments', authenticateToken, paymentsRouter)
  app.use('/api/employees', authenticateToken, employeeRoutes)
  app.use('/api/users', authenticateToken, usersRoutes)
  app.use('/api/catalog/services-admin', authenticateToken, servicesAdminRouter)
  app.use('/api/catalog/installation-admin', authenticateToken, installationAdminRouter)
  app.use('/api/catalog/sdui-admin', authenticateToken, sduiAdminRouter)
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
