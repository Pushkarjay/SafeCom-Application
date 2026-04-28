import { Router } from 'express'
import { payments } from '../data/mock-data.js'

export const paymentsRouter = Router()

paymentsRouter.get('/', (_req, res) => {
  return res.json(payments)
})
