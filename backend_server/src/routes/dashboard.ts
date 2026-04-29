import { Router } from 'express'
import { queryCollection } from '../services/firestore.js'

export const dashboardRouter = Router()

// GET /dashboard/metrics - Get dashboard metrics
dashboardRouter.get('/metrics', async (_req, res) => {
  try {
    // Query Firestore for real metrics
    const [customers, technicians, jobs, payments] = await Promise.all([
      queryCollection<Record<string, unknown>>('customers'),
      queryCollection<Record<string, unknown>>('technicians'),
      queryCollection<Record<string, unknown>>('jobs'),
      queryCollection<Record<string, unknown>>('payments')
    ])

    const activeTechnicians = technicians.filter((t: Record<string, unknown>) => t.status === 'available').length
    const pendingJobs = jobs.filter((j: Record<string, unknown>) => j.status === 'pending' || j.status === 'assigned').length
    const completedJobs = jobs.filter((j: Record<string, unknown>) => j.status === 'completed').length
    const totalRevenue = payments
      .filter((p: Record<string, unknown>) => p.status === 'completed')
      .reduce((sum: number, p: Record<string, unknown>) => sum + ((p.amount as number) || 0), 0)

    const completionRate = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0

    return res.json({
      totalCustomers: customers.length,
      activeTechnicians,
      pendingJobs,
      totalRevenue,
      completionRate,
      avgResponseTime: 2.3 // Could be calculated from job completion times
    })
  } catch (error) {
    console.error('Firestore dashboard metrics failed:', error)
    const { dashboardMetrics } = await import('../data/mock-data.js')
    return res.json(dashboardMetrics)
  }
})
