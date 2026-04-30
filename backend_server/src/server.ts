import 'dotenv/config'
import { createApp } from './app.js'
import { initFirebase } from './services/firestore.js'

const port = Number(process.env.PORT ?? 5000)
const host = process.env.HOST ?? '127.0.0.1'
const app = createApp()

console.log(`[INIT] SafeCom Backend starting...`)
console.log(`[INIT] Environment: ${process.env.NODE_ENV ?? 'development'}`)
console.log(`[INIT] Port: ${port}`)

// Initialize Firebase Admin SDK on server start
try {
  initFirebase()
  console.log('[INIT] ✓ Firebase Admin SDK initialized successfully')
} catch (error) {
  console.warn('[INIT] ⚠️ Firebase initialization failed, using mock data fallback:', error)
}

// Start server
const server = app.listen(port, host, () => {
  console.log(`[RUNNING] SafeCom backend server ready at http://${host}:${port}`)
  console.log(`[RUNNING] Health check: http://${host}:${port}/health`)
  console.log(`[RUNNING] API endpoints: http://${host}:${port}/api/*`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('[SHUTDOWN] ✓ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('[SHUTDOWN] ✓ Server closed')
    process.exit(0)
  })
})

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error)
  process.exit(1)
})

