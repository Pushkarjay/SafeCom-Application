import { Router } from 'express'
import { z } from 'zod'
import { payments } from '../data/mock-data.js'

export const paymentsRouter = Router()

const paymentCreateSchema = z.object({
  jobId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().nonnegative(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  paymentMethod: z.enum(['card', 'cash', 'upi', 'bank']),
  timestamp: z.string().min(1).optional()
})

paymentsRouter.get('/', (_req, res) => {
  return res.json(payments)
})

paymentsRouter.get('/:id', (req, res) => {
  const payment = payments.find((item) => item.id === req.params.id)

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' })
  }

  return res.json(payment)
})

paymentsRouter.post('/', (req, res) => {
  const parsed = paymentCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payment payload', issues: parsed.error.flatten() })
  }

  const nextId = `PAY${String(payments.length + 1).padStart(3, '0')}`
  const payment = {
    id: nextId,
    status: parsed.data.status ?? 'pending',
    timestamp: parsed.data.timestamp ?? new Date().toISOString(),
    ...parsed.data
  }

  payments.push(payment)
  return res.status(201).json(payment)
})
