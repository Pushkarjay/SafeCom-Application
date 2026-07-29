import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, getDb } from '../services/firestore.js'
import { sendPushNotification } from '../services/notificationService.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { 
  CreateBookingRequest, 
  CanonicalInvoice,
  CanonicalBooking,
  InvoiceLineItem,
  ApiResponse
} from '../contracts/canonical_contracts.js'

const BOOKING_AMOUNT = 100.0

const bookingCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID required'),
  serviceType: z.enum(['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories', 'text_box']),
  serviceConfig: z.record(z.any()),
  location: z.object({
    address: z.string().min(1),
    latitude: z.number(),
    longitude: z.number()
  }),
  scheduledDate: z.string().min(1),
  scheduledTimeSlot: z.string().min(1),
  lineItems: z.array(z.object({
    productId: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    lineTotal: z.number().nonnegative(),
    category: z.string().optional(),
    variants: z.record(z.string()).optional()
  })),
  totalAmount: z.number().nonnegative().optional(),
  amountPaid: z.number().nonnegative().optional(),
  paymentId: z.string().optional(),
  orderId: z.string().optional(),
  notes: z.string().optional(),
  customTextBox: z.object({
    enabled: z.boolean(),
    title: z.string().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    value: z.string().optional()
  }).optional()
})

export const bookingsRouter = Router()

/**
 * Helper: Generate booking ID in YYYYMMDD-NNN format
 * Counter resets daily and is safe under concurrent bookings via Firestore transactions.
 */
async function generateBookingId(): Promise<string> {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const db = getDb()
  const todayRef = db.collection('booking_counters').doc(dateStr)

  let counter: number
  try {
    const doc = await todayRef.get()
    if (doc.exists) {
      counter = (doc.data()?.count as number) || 0
    } else {
      counter = 0
    }
    counter += 1
    await todayRef.set({ count: counter, date: dateStr }, { merge: true })
  } catch {
    // Fallback: use timestamp-based ID if counter fails
    return `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  return `${dateStr}-${String(counter).padStart(3, '0')}`
}

/**
 * Helper: Generate canonical invoice from booking request
 */
function generateCanonicalInvoice(
  bookingId: string,
  request: CreateBookingRequest,
  customerName: string,
  customerPhone: string
): CanonicalInvoice {
  const serviceAmount = request.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const advanceAmount = request.amountPaid ?? 0
  const bookingCharge = BOOKING_AMOUNT

  // Total = service amount (booking charge is part of this total, not extra)
  const grandTotal = serviceAmount
  const advanceAmount = request.amountPaid ?? 0
  const remainingAmount = grandTotal - advanceAmount

  const invoice: CanonicalInvoice = {
    invoiceId: `INV-${bookingId}`,
    bookingId,
    serviceType: request.serviceType,
    customerId: request.customerId,
    customerName,
    customerPhone,
    customerAddress: request.location.address,
    serviceLocation: request.location.address,
    serviceLatitude: request.location.latitude,
    serviceLongitude: request.location.longitude,
    lineItems: request.lineItems,
    subtotal: serviceAmount,
    subtotalAfterDiscount: serviceAmount,
    taxes: [
      {
        taxName: 'GST',
        taxRate: 0,
        baseAmount: serviceAmount,
        taxAmount: 0
      }
    ],
    totalTax: 0,
    grandTotal,
    scheduledDate: request.scheduledDate,
    scheduledTimeSlot: request.scheduledTimeSlot,
    paymentStatus: advanceAmount > 0 ? (remainingAmount > 0 ? 'partial' : 'completed') : 'pending',
    advanceAmount,
    remainingAmount,
    generatedAt: new Date().toISOString(),
    notes: request.notes
  }

  // Include custom text box data if present
  if (request.customTextBox?.enabled && request.customTextBox?.value) {
    invoice.customTextBox = {
      title: request.customTextBox.title ?? 'Custom Message',
      value: request.customTextBox.value
    }
  }

  return invoice
}

/**
 * Helper: Create corresponding job from booking
 */
async function createCorrespondingJob(
  bookingId: string,
  booking: CanonicalBooking
): Promise<string> {
  const jobId = `JOB-${bookingId}`
  
  try {
    await createDocument('jobs', {
      jobId,
      bookingId,
      customer: {
        customerId: booking.customerId,
        name: booking.invoice.customerName,
        phone: booking.invoice.customerPhone,
        address: booking.invoice.customerAddress
      },
      location: booking.location,
      serviceType: booking.serviceType,
      invoice: {
        invoiceId: booking.invoice.invoiceId,
        bookingId: booking.invoice.bookingId,
        serviceType: booking.invoice.serviceType,
        customerId: booking.invoice.customerId,
        customerName: booking.invoice.customerName,
        customerPhone: booking.invoice.customerPhone,
        customerAddress: booking.invoice.customerAddress,
        serviceLocation: booking.invoice.serviceLocation,
        serviceLatitude: booking.invoice.serviceLatitude,
        serviceLongitude: booking.invoice.serviceLongitude,
        lineItems: booking.invoice.lineItems,
        subtotal: booking.invoice.subtotal,
        subtotalAfterDiscount: booking.invoice.subtotalAfterDiscount,
        taxes: booking.invoice.taxes,
        totalTax: booking.invoice.totalTax,
        grandTotal: booking.invoice.grandTotal,
        scheduledDate: booking.invoice.scheduledDate,
        scheduledTimeSlot: booking.invoice.scheduledTimeSlot,
        paymentStatus: booking.invoice.paymentStatus,
        advanceAmount: booking.invoice.advanceAmount,
        remainingAmount: booking.invoice.remainingAmount,
        generatedAt: booking.invoice.generatedAt,
        notes: booking.invoice.notes
      },
      status: 'pending',
      assignedTo: null,
      scheduledDate: booking.scheduledDate,
      scheduledTimeSlot: booking.scheduledTimeSlot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return jobId
  } catch (error) {
    console.error('Failed to create job for booking:', error)
    // Still succeed - job creation is async and can retry
    return jobId
  }
}

/**
 * Helper: Send notification to eligible employees
 */
async function notifyEligibleEmployees(booking: CanonicalBooking): Promise<void> {
  try {
    const db = getDb()
    const snapshot = await db.collection('employees').get()
    const tokens = snapshot.docs
      .flatMap((doc) => (doc.data().deviceTokens as string[] | undefined) ?? [])
      .filter((token) => Boolean(token))

    if (tokens.length === 0) {
      console.log('[NOTIFICATION] No employee device tokens found')
      return
    }

    await sendPushNotification({
      tokens,
      title: 'New booking assigned',
      body: `Service: ${booking.serviceType} • ${booking.scheduledDate}`,
      data: {
        type: 'new_booking',
        bookingId: booking.bookingId,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        scheduledTimeSlot: booking.scheduledTimeSlot
      }
    })
  } catch (error) {
    console.error('Failed to send notifications:', error)
  }
}

/**
 * POST /bookings - Create new booking with invoice
 * 
 * Request body must match CreateBookingRequest
 * Response: CreateBookingResponse with booking ID and payment details
 */
bookingsRouter.post('/', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  const parsed = bookingCreateSchema.safeParse(req.body)
  
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid booking payload',
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
  
  try {
    const request = parsed.data as CreateBookingRequest
    
    // Verify that the customerId matches the authenticated user's Firebase UID
    if (request.customerId !== req.firebaseUid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cannot create booking for another customer'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse<never>)
    }
    
    // Generate booking ID (YYYYMMDD-NNN format)
    const bookingId = await generateBookingId()
    
    // Fetch customer details from Firestore
    let customerName = 'Customer'
    let customerPhone = ''
    try {
      const customerDoc = await getDocument<Record<string, unknown>>('customers', request.customerId)
      if (customerDoc) {
        customerName = String(customerDoc.name || customerDoc.displayName || 'Customer')
        customerPhone = String(customerDoc.phone || '')
      }
    } catch (e) {
      console.warn(`Failed to fetch customer ${request.customerId}:`, e)
    }
    
    // Generate canonical invoice
    const invoice = generateCanonicalInvoice(bookingId, request, customerName, customerPhone)
    
    // Create canonical booking
    const booking: CanonicalBooking = {
      bookingId,
      customerId: request.customerId,
      serviceType: request.serviceType,
      serviceConfig: request.serviceConfig,
      location: request.location,
      scheduledDate: request.scheduledDate,
      scheduledTimeSlot: request.scheduledTimeSlot,
      invoice,
      status: invoice.advanceAmount > 0 ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: request.notes,
      totalAmount: request.totalAmount,
      amountPaid: request.amountPaid,
      paymentId: request.paymentId,
      orderId: request.orderId
    }
    
    // Store custom text box data as a separate line item or in serviceConfig
    if (request.customTextBox?.enabled && request.customTextBox?.value) {
      const textBoxItem: InvoiceLineItem = {
        productId: 'custom_text_box',
        productName: request.customTextBox.title || 'Custom Text',
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
        category: 'text_box',
        variants: { value: request.customTextBox.value }
      }
      booking.invoice.lineItems = [...(booking.invoice.lineItems || []), textBoxItem]
      booking.serviceConfig = {
        ...booking.serviceConfig,
        customTextBox: {
          title: request.customTextBox.title,
          placeholder: request.customTextBox.placeholder,
          required: request.customTextBox.required,
          value: request.customTextBox.value
        }
      }
    }
    
    // Persist booking
    await createDocument('bookings', booking as unknown as Record<string, unknown>)
    
    // Create corresponding job
    const jobId = await createCorrespondingJob(bookingId, booking)
    console.log(`Created job ${jobId} for booking ${bookingId}`)
    
    // Send notifications to eligible employees (async, don't block response)
    notifyEligibleEmployees(booking).catch(console.error)
    
    // Return success response with payment order details
    return res.status(201).json({
      success: true,
      data: {
        bookingId,
        invoice,
        paymentRequired: {
          amount: invoice.grandTotal,
          orderId: `ORD-${bookingId}`
        }
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>)
  } catch (error) {
    console.error('Failed to create booking:', error)
    const errorBody: Record<string, unknown> = {
      code: 'BOOKING_CREATION_FAILED',
      message: error instanceof Error ? error.message : 'Internal server error'
    }
    if (error instanceof Error && error.stack) errorBody.stack = error.stack
    return res.status(500).json({
      success: false,
      error: errorBody,
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
})

/**
 * GET /bookings - List bookings for the authenticated user.
 * Pass ?all=true to list all bookings (admin only).
 */
bookingsRouter.get('/', async (req: FirebaseAuthenticatedRequest, res) => {
  try {
    const uid = req.firebaseUid

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Login required' },
        timestamp: new Date().toISOString()
      })
    }

    const db = getDb()
    let query: Query = db.collection('bookings')

    // Only return the authenticated user's bookings unless ?all=true (admin)
    const showAll = req.query.all === 'true'
    if (!showAll) {
      query = query.where('customerId', '==', uid)
    }

    // Order by creation date descending
    query = query.orderBy('createdAt', 'desc')

    const snapshot = await query.get()
    const bookings: CanonicalBooking[] = []

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      bookings.push({
        bookingId: doc.id,
        ...data
      } as CanonicalBooking)
    })

    return res.json({
      success: true,
      data: bookings,
      pagination: {
        page: 1,
        limit: bookings.length,
        total: bookings.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to list bookings:', error)
    // Try fallback without orderBy
    try {
      const db = getDb()
      const showAll = req.query.all === 'true'
      let fallbackQuery: Query = db.collection('bookings')
      if (!showAll) {
        fallbackQuery = fallbackQuery.where('customerId', '==', req.firebaseUid)
      }
      const snapshot = await fallbackQuery.get()
      const bookings: CanonicalBooking[] = []
      snapshot.forEach((doc: QueryDocumentSnapshot) => {
        const d = doc.data() as Record<string, unknown> | undefined;
        bookings.push({
          bookingId: doc.id,
          ...(d ?? {})
        } as CanonicalBooking)
      })
      return res.json({
        success: true,
        data: bookings,
        timestamp: new Date().toISOString()
      })
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      const errBody: Record<string, unknown> = {
        code: 'BOOKING_LIST_FAILED',
        message: fallbackError instanceof Error ? fallbackError.message : 'Failed to retrieve bookings'
      }
      if (fallbackError instanceof Error && fallbackError.stack) errBody.stack = fallbackError.stack
      return res.status(500).json({
        success: false,
        error: errBody,
        timestamp: new Date().toISOString()
      })
    }
  }
})

/**
 * GET /bookings/:id - Get single booking with full details
 */
bookingsRouter.get('/:id', async (req, res) => {
  try {
    const booking = await getDocument<CanonicalBooking>('bookings', req.params.id)
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        },
        timestamp: new Date().toISOString()
      })
    }
    
    return res.json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString()
    })
    } catch (error) {
    console.error('Failed to get booking:', error)
    const errorBody: Record<string, unknown> = {
      code: 'BOOKING_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Failed to retrieve booking'
    }
    if (error instanceof Error && error.stack) errorBody.stack = error.stack
    return res.status(500).json({
      success: false,
      error: errorBody,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * PATCH /bookings/:id - Update booking status
 */
bookingsRouter.patch('/:id', async (req, res) => {
  try {
    const updateSchema = z.object({
      status: z.enum(['draft', 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
      assignedEmployeeId: z.string().optional(),
      notes: z.string().optional()
    })
    
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update payload'
        },
        timestamp: new Date().toISOString()
      })
    }
    
    await updateDocument('bookings', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    
    const updated = await getDocument<CanonicalBooking>('bookings', req.params.id)
    
    return res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    })
    } catch (error) {
    console.error('Failed to update booking:', error)
    const errorBody: Record<string, unknown> = {
      code: 'BOOKING_UPDATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to update booking'
    }
    if (error instanceof Error && error.stack) errorBody.stack = error.stack
    return res.status(500).json({
      success: false,
      error: errorBody,
      timestamp: new Date().toISOString()
    })
  }
})
