import { Router } from 'express'
import { dashboardMetrics } from '../data/mock-data.js'

export const dashboardRouter = Router()

dashboardRouter.get('/metrics', (_req, res) => {
  return res.json(dashboardMetrics)
})
