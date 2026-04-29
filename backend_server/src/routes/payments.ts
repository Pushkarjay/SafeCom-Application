import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument } from '../services/firestore.js'

const paymentCreateSchema = z.object({
  jobId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().nonnegative(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  paymentMethod: z.enum(['card', 'cash', 'upi', 'bank']),
  timestamp: z.string().min(1).optional()
})

export const paymentsRouter = Router()

// GET /payments - List all payments
paymentsRouter.get('/', async (_req, res) => {
  try {
    const payments = await queryCollection<Record<string, unknown>>('payments')
    return res.json(payments)
  } catch (error) {
    console.error('Firestore payments lookup failed:', error)
    const { payments } = await import('../data/mock-data.js')
    return res.json(payments)
  }
})

// GET /payments/:id - Get single payment
paymentsRouter.get('/:id', async (req, res) => {
  try {
    const payment = await getDocument<Record<string, unknown>>('payments', req.params.id)
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }
    return res.json(payment)
  } catch (error) {
    console.error('Firestore payment lookup failed:', error)
    const { payments } = await import('../data/mock-data.js')
    const fallback = payments.find((item) => item.id === req.params.id)
    if (!fallback) {
      return res.status(404).json({ message: 'Payment not found' })
    }
    return res.json(fallback)
  }
})

// POST /payments - Create new payment
paymentsRouter.post('/', async (req, res) => {
  const parsed = paymentCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payment payload', issues: parsed.error.flatten() })
  }

  try {
    const docId = await createDocument('payments', {
      ...parsed.data,
      status: parsed.data.status ?? 'pending',
      timestamp: parsed.data.timestamp ?? new Date().toISOString()
    })
    return res.status(201).json({ id: docId, ...parsed.data })
  } catch (error) {
    console.error('Firestore create payment failed:', error)
    const { payments } = await import('../data/mock-data.js')
    const nextId = `PAY${String(payments.length + 1).padStart(3, '0')}`
    const payment = {
      id: nextId,
      status: parsed.data.status ?? 'pending',
      timestamp: parsed.data.timestamp ?? new Date().toISOString(),
      ...parsed.data
    }
    payments.push(payment)
    return res.status(201).json(payment)
  }
})
