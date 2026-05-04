import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../services/firestore.js'
import { verifyFirebaseIdToken } from '../middleware/auth.js'

export const dashboardRouter = Router()

// ============================================
// HELPERS
// ============================================

async function getTotalCustomers(): Promise<number> {
  try {
    const snapshot = await db.collection('customers').count().get()
    return snapshot.data().count
  } catch (e) {
    console.error('Error getting customer count:', e)
    return 0
  }
}

async function getActiveTechnicians(): Promise<number> {
  try {
    const snapshot = await db
      .collection('employees')
      .where('status', '==', 'available')
      .count()
      .get()
    return snapshot.data().count
  } catch (e) {
    console.error('Error getting active technicians:', e)
    return 0
  }
}

async function getPendingJobs(): Promise<number> {
  try {
    const snapshot = await db
      .collection('jobs')
      .where('status', 'in', ['pending', 'assigned'])
      .count()
      .get()
    return snapshot.data().count
  } catch (e) {
    console.error('Error getting pending jobs:', e)
    return 0
  }
}

async function getTotalRevenue(): Promise<number> {
  try {
    const snapshot = await db
      .collection('bookings')
      .where('status', '==', 'completed')
      .get()

    let total = 0
    snapshot.forEach((doc) => {
      const invoice = doc.data().invoice
      if (invoice?.grandTotal) {
        total += invoice.grandTotal
      }
    })
    return total
  } catch (e) {
    console.error('Error getting total revenue:', e)
    return 0
  }
}

async function getCompletionRate(): Promise<number> {
  try {
    const allJobs = await db.collection('jobs').count().get()
    const completedJobs = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .count()
      .get()

    const all = allJobs.data().count
    const completed = completedJobs.data().count

    if (all === 0) return 0
    return Math.round((completed / all) * 100 * 10) / 10
  } catch (e) {
    console.error('Error calculating completion rate:', e)
    return 0
  }
}

async function getAverageResponseTime(): Promise<number> {
  try {
    const snapshot = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .limit(100)
      .orderBy('completedAt', 'desc')
      .get()

    let totalTime = 0
    let count = 0

    snapshot.forEach((doc) => {
      const createdAt = doc.data().createdAt
      const completedAt = doc.data().completedAt

      if (createdAt && completedAt) {
        const created = new Date(createdAt).getTime()
        const completed = new Date(completedAt).getTime()
        const hours = (completed - created) / (1000 * 60 * 60)
        totalTime += hours
        count++
      }
    })

    return count === 0 ? 0 : Math.round((totalTime / count) * 10) / 10
  } catch (e) {
    console.error('Error getting average response time:', e)
    return 0
  }
}

async function getTopPerformingTechnicians(): Promise<
  Array<{ id: string; name: string; jobsCompleted: number; rating: number }>
> {
  try {
    const snapshot = await db
      .collection('employees')
      .orderBy('jobsCompleted', 'desc')
      .limit(5)
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || 'Unknown',
      jobsCompleted: doc.data().jobsCompleted || 0,
      rating: doc.data().rating || 0,
    }))
  } catch (e) {
    console.error('Error getting top technicians:', e)
    return []
  }
}

async function getRecentBookings(): Promise<
  Array<{
    bookingId: string
    customerId: string
    serviceType: string
    amount: number
    status: string
    createdAt: string
  }>
> {
  try {
    const snapshot = await db
      .collection('bookings')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    return snapshot.docs.map((doc) => ({
      bookingId: doc.id,
      customerId: doc.data().customerId,
      serviceType: doc.data().serviceType || 'unknown',
      amount: doc.data().invoice?.grandTotal || 0,
      status: doc.data().status || 'pending',
      createdAt: doc.data().createdAt || new Date().toISOString(),
    }))
  } catch (e) {
    console.error('Error getting recent bookings:', e)
    return []
  }
}

async function checkSystemHealth(): Promise<{
  firestore: 'healthy' | 'degraded' | 'down'
  auth: 'healthy' | 'degraded' | 'down'
  lastCheck: string
}> {
  let firestoreStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
  let authStatus: 'healthy' | 'degraded' | 'down' = 'healthy'

  // Check Firestore
  try {
    const startTime = Date.now()
    await db.collection('_health').doc('check').get()
    const responseTime = Date.now() - startTime

    if (responseTime > 5000) {
      firestoreStatus = 'degraded'
    }
  } catch (e) {
    console.error('Firestore health check failed:', e)
    firestoreStatus = 'down'
  }

  // Auth is considered healthy if Firebase SDK is initialized
  try {
    if (!db) {
      authStatus = 'down'
    }
  } catch (e) {
    authStatus = 'down'
  }

  return {
    firestore: firestoreStatus,
    auth: authStatus,
    lastCheck: new Date().toISOString(),
  }
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /dashboard/metrics
 * Retrieve aggregated dashboard metrics
 * Protected: Yes (Firebase auth)
 */
dashboardRouter.get(
  '/metrics',
  verifyFirebaseIdToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now()

      const [
        totalCustomers,
        activeTechnicians,
        pendingJobs,
        totalRevenue,
        completionRate,
        avgResponseTime,
        systemHealth,
        topTechnicians,
        recentBookings,
      ] = await Promise.all([
        getTotalCustomers(),
        getActiveTechnicians(),
        getPendingJobs(),
        getTotalRevenue(),
        getCompletionRate(),
        getAverageResponseTime(),
        checkSystemHealth(),
        getTopPerformingTechnicians(),
        getRecentBookings(),
      ])

      const duration = Date.now() - startTime

      res.status(200).json({
        success: true,
        data: {
          totalCustomers,
          activeTechnicians,
          pendingJobs,
          totalRevenue,
          completionRate,
          avgResponseTime,
          systemHealth,
          topPerformingTechnicians: topTechnicians,
          recentBookings,
        },
        timestamp: new Date().toISOString(),
        queryTime: `${duration}ms`,
      })
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      next(error)
    }
  }
)

/**
 * GET /dashboard/system-health
 * Check system health status
 * Protected: Yes (Firebase auth)
 */
dashboardRouter.get(
  '/system-health',
  verifyFirebaseIdToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await checkSystemHealth()

      res.status(200).json({
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error checking system health:', error)
      next(error)
    }
  }
)

export default dashboardRouter
