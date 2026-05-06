import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, getDb } from '../services/firestore.js'
import { sendPushNotification } from '../services/notificationService.js'
import type { FirebaseAuthenticatedRequest } from '../middleware/firebaseAuth.js'
import type { 
  CreateBookingRequest, 
  CanonicalInvoice, 
  CanonicalBooking, 
  InvoiceLineItem,
  ApiResponse
} from '../contracts/canonical_contracts.js'

const bookingCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID required'),
  serviceType: z.enum(['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories']),
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
  notes: z.string().optional()
})

export const bookingsRouter = Router()

/**
 * Helper: Generate canonical invoice from booking request
 */
function generateCanonicalInvoice(
  bookingId: string,
  request: CreateBookingRequest,
  customerName: string,
  customerPhone: string
): CanonicalInvoice {
  const subtotal = request.lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
  
  // TODO: Fetch tax configuration from backend
  const gstRate = 18 // Default 18% GST
  const taxAmount = Math.round((subtotal * gstRate) / 100 * 100) / 100
  
  return {
    invoiceId: `INV-${bookingId}`,
    bookingId,
    serviceType: request.serviceType,
    customerId: request.customerId,
    customerName,
    customerPhone,
    customerAddress: request.location.address,
    serviceLocation: request.location.address,
    serviceLatitude: request.location.latitude,
    servicelongitude: request.location.longitude,
    lineItems: request.lineItems,
    subtotal,
    subtotalAfterDiscount: subtotal,
    taxes: [
      {
        taxName: 'GST',
        taxRate: gstRate,
        baseAmount: subtotal,
        taxAmount
      }
    ],
    totalTax: taxAmount,
    grandTotal: subtotal + taxAmount,
    scheduledDate: request.scheduledDate,
    scheduledTimeSlot: request.scheduledTimeSlot,
    paymentStatus: 'pending',
    advanceAmount: 0,
    remainingAmount: subtotal + taxAmount,
    generatedAt: new Date().toISOString(),
    notes: request.notes
  }
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
        grandTotal: booking.invoice.grandTotal,
        lineItems: booking.invoice.lineItems
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
bookingsRouter.post('/', async (req, res) => {
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
    
    // Generate booking ID
    const bookingId = `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Fetch customer details (TODO: from auth context or database)
    const customerName = 'Customer' // TODO: Get from customer record
    const customerPhone = request.customerId // TODO: Get from customer record
    
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
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: request.notes
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
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
})

/**
 * GET /bookings - List bookings for the authenticated user.
 * Pass ?all=true to list all bookings (admin only).
 */
bookingsRouter.get('/', async (req, res) => {
  try {
    const authReq = req as FirebaseAuthenticatedRequest
    const uid = authReq.firebaseUid

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Login required' },
        timestamp: new Date().toISOString()
      })
    }

    let bookings = await queryCollection<CanonicalBooking>('bookings')

    // Only return the authenticated user's bookings unless ?all=true (admin)
    const showAll = req.query.all === 'true'
    if (!showAll) {
      bookings = bookings.filter(b => b.customerId === uid)
    }

    // Sort newest first
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_LIST_FAILED',
        message: 'Failed to retrieve bookings'
      },
      timestamp: new Date().toISOString()
    })
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
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_FETCH_FAILED',
        message: 'Failed to retrieve booking'
      },
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
    return res.status(500).json({
      success: false,
      error: {
        code: 'BOOKING_UPDATE_FAILED',
        message: 'Failed to update booking'
      },
      timestamp: new Date().toISOString()
    })
  }
})
