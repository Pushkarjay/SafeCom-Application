import { Router } from 'express'
import { z } from 'zod'
import { createDocument } from '../services/firestore.js'
import { createCheckoutOrder, verifyCheckoutSignature } from '../services/razorpay.js'

const createOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(3).default('INR'),
  receipt: z.string().trim().min(1).optional(),
  // Optional customer fields may arrive as null (the app sends null instead of
  // omitting them), so accept null/undefined — e.g. phone-only customers have
  // no email and the app normalizes empty emails to null.
  customerId: z.string().trim().min(1).optional().nullable(),
  customerName: z.string().trim().min(1).optional().nullable(),
  customerEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
  customerPhone: z.string().trim().min(1).optional(),
  jobId: z.string().trim().min(1).optional().nullable(),
  serviceName: z.string().trim().min(1).optional(),
  packageLabel: z.string().trim().min(1).optional(),
  notes: z.record(z.string()).optional()
})

const verifyPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
  paymentId: z.string().trim().min(1),
  signature: z.string().trim().min(1, 'Payment signature is required for verification'),
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(3).default('INR'),
  customerId: z.string().trim().min(1).optional().nullable(),
  customerName: z.string().trim().min(1).optional().nullable(),
  // Allow empty email so phone-only customers can pay without an email address.
  // The app sends null (not empty string) when the customer has no email.
  customerEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
  jobId: z.string().trim().min(1).optional().nullable(),
  serviceName: z.string().trim().min(1).optional(),
  packageLabel: z.string().trim().min(1).optional(),
  notes: z.record(z.string()).optional()
})

export const razorpayRouter = Router()

razorpayRouter.post('/create-order', async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment order payload',
      issues: parsed.error.flatten()
    })
  }

  const receipt = parsed.data.receipt ?? `rcpt_${Date.now()}`
  const notes: Record<string, string> = {
    serviceName: parsed.data.serviceName ?? '',
    packageLabel: parsed.data.packageLabel ?? '',
    customerId: parsed.data.customerId ?? '',
    customerName: parsed.data.customerName ?? '',
    customerEmail: parsed.data.customerEmail ?? '',
    customerPhone: parsed.data.customerPhone ?? '',
    jobId: parsed.data.jobId ?? '',
  }
  if (parsed.data.notes) {
    for (const [k, v] of Object.entries(parsed.data.notes)) {
      notes[k] = String(v)
    }
  }

  try {
    const order = await createCheckoutOrder({
      amountPaise: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      receipt,
      notes
    })

    return res.status(201).json({
      success: true,
      data: {
        provider: order.provider,
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes
      }
    })
  } catch (error) {
    console.error('[PAYMENTS] Failed to create Razorpay order:', error)
    return res.status(500).json({
      success: false,
      message: 'Unable to create payment order',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

razorpayRouter.post('/verify', async (req, res) => {
  const parsed = verifyPaymentSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment verification payload',
      issues: parsed.error.flatten()
    })
  }

  const verification = verifyCheckoutSignature({
    orderId: parsed.data.orderId,
    paymentId: parsed.data.paymentId,
    signature: parsed.data.signature
  })

  if (!verification.verified) {
    return res.status(400).json({
      success: false,
      provider: verification.provider,
      message: verification.message
    })
  }

  const paymentRecord = {
    jobId: parsed.data.jobId ?? '',
    customerId: parsed.data.customerId ?? '',
    amount: parsed.data.amount,
    status: 'completed' as const,
      paymentMethod: 'razorpay' as const,
    timestamp: new Date().toISOString(),
    provider: verification.provider,
    orderId: verification.orderId,
    paymentId: verification.paymentId,
    signature: verification.signature,
    serviceName: parsed.data.serviceName,
    packageLabel: parsed.data.packageLabel,
    currency: parsed.data.currency,
    customerName: parsed.data.customerName ?? '',
    customerEmail: parsed.data.customerEmail ?? ''
  }

  try {
    const docId = await createDocument('payments', paymentRecord)
    return res.status(201).json({
      success: true,
      data: {
        provider: verification.provider,
        verified: true,
        message: verification.message,
        payment: {
          id: docId,
          ...paymentRecord
        }
      }
    })
  } catch (error) {
    console.error('[PAYMENTS] Failed to persist verified payment:', error)
    return res.status(500).json({
      success: false,
      provider: verification.provider,
      verified: false,
      message: 'Payment verified but failed to persist'
    })
  }
})
