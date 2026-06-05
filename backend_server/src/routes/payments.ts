import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore.js'
import { verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const paymentMethodSchema = z.enum(['card', 'cash', 'upi', 'bank', 'razorpay'])

const paymentCreateSchema = z.object({
  jobId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().nonnegative(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  paymentMethod: paymentMethodSchema,
  timestamp: z.string().min(1).optional()
})

const paymentUpdateSchema = z.object({
  status: z.enum(['pending', 'partial', 'completed', 'failed']).optional(),
  paidAmount: z.number().nonnegative().optional(),
  remainingAmount: z.number().nonnegative().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  transactionId: z.string().optional()
})

export const paymentsRouter = Router()

// GET /payments - List all payments
paymentsRouter.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))
    const payments = await queryCollection<Record<string, unknown>>('payments')
    return res.json({ success: true, data: payments.slice(0, limit) })
  } catch (error) {
    console.error('Firestore payments lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch payments' })
  }
})

// GET /payments/:id - Get single payment
paymentsRouter.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const payment = await getDocument<Record<string, unknown>>('payments', req.params.id as string)
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }
    return res.json({ success: true, data: payment })
  } catch (error) {
    console.error('Firestore payment lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch payment' })
  }
})

// POST /payments - Create new payment
paymentsRouter.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = paymentCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid payment payload', issues: parsed.error.flatten() })
  }

  try {
    const docId = await createDocument('payments', {
      ...parsed.data,
      status: parsed.data.status ?? 'pending',
      timestamp: parsed.data.timestamp ?? new Date().toISOString()
    })
    return res.status(201).json({ success: true, data: { id: docId, ...parsed.data } })
  } catch (error) {
    console.error('Firestore create payment failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create payment' })
  }
})

// PATCH /payments/:id - Update payment
paymentsRouter.patch('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = paymentUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid payment payload', issues: parsed.error.flatten() })
  }

  try {
    await updateDocument('payments', req.params.id as string, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('payments', req.params.id as string)
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Firestore update payment failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update payment' })
  }
})

// DELETE /payments/:id - Delete payment
paymentsRouter.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await deleteDocument('payments', req.params.id as string)
    return res.json({ success: true, message: 'Payment deleted' })
  } catch (error) {
    console.error('Firestore delete payment failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete payment' })
  }
})

// POST /payments/:id/request - Request payment
paymentsRouter.post('/:id/request', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await updateDocument('payments', req.params.id as string, {
      status: 'payment_requested',
      requestedAt: new Date().toISOString()
    })
    return res.json({ success: true, message: 'Payment requested', data: { paymentId: req.params.id as string } })
  } catch (error) {
    console.error('Firestore payment request failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to request payment' })
  }
})
