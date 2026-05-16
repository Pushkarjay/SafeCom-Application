import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument, getCollection, getDb } from '../services/firestore.js'
import { sendPushNotification } from '../services/notificationService.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { 
  CanonicalJob, 
  ApiResponse,
  ApiListResponse
} from '../contracts/canonical_contracts.js'

export const jobsRouter = Router()

/**
 * GET /jobs - List jobs for technician or all (admin)
 * Query params:
 *   employeeId / technicianId - filter by assigned employee
 *   status - filter by status (e.g. 'pending', 'assigned', 'in_progress')
 *   unassigned=true - show only unassigned pending jobs (for employee job board)
 */
jobsRouter.get('/', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  try {
    const technicianId = (req.query.employeeId || req.query.technicianId) as string | undefined
    const statusFilter = req.query.status as string | undefined
    const unassigned = req.query.unassigned === 'true'
    
    const db = getDb()
    let query: Query = db.collection('jobs')
    
    // Get all jobs first (no complex queries to avoid composite index errors)
    // Then filter in memory
    
    // Order by creation date descending
    query = query.orderBy('createdAt', 'desc')
    
    const snapshot = await query.get()
    let jobs: CanonicalJob[] = []
    
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      jobs.push({
        jobId: data.jobId || doc.id,
        ...data
      } as CanonicalJob)
    })
    
    // Filter by unassigned - include jobs with missing status or pending status
    if (unassigned) {
      jobs = jobs.filter((job: any) => 
        (!job.status || job.status === 'pending') && !job.assignedTo
      )
    }
    // Filter by technicianId
    else if (technicianId) {
      jobs = jobs.filter((job: any) => 
        job.assignedTo?.employeeId === technicianId || 
        job.assignedTo === technicianId
      )
    }
    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      jobs = jobs.filter((job: any) => job.status === statusFilter)
    }
    
    // For unassigned: also filter out jobs that already have assignedTo set
    if (unassigned) {
      jobs = jobs.filter(j => !(j as any).assignedTo)
    }
    
    return res.json({
      success: true,
      data: jobs,
      pagination: {
        page: 1,
        limit: jobs.length,
        total: jobs.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Firestore jobs lookup failed:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOBS_FETCH_FAILED',
        message: 'Failed to fetch jobs'
      },
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * POST /jobs - Create a new job
 */
jobsRouter.post('/', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  const jobCreateSchema = z.object({
    customerId: z.string().min(1),
    serviceType: z.string().min(1),
    amount: z.number().nonnegative(),
    scheduledDate: z.string().optional(),
    technicianId: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional().default('pending')
  })

  const parsed = jobCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid job payload', details: parsed.error.flatten() },
      timestamp: new Date().toISOString()
    })
  }

  try {
    const docId = await createDocument('jobs', {
      ...parsed.data,
      status: parsed.data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return res.status(201).json({
      success: true,
      data: { id: docId, ...parsed.data },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Firestore create job failed:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'JOB_CREATE_FAILED', message: 'Failed to create job' },
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * POST /jobs/:id/pickup - Employee picks up/claims a job
 */
jobsRouter.post('/:id/pickup', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  try {
    const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
    const { employeeId, name, phone } = req.body as { employeeId?: string; name?: string; phone?: string }
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'employeeId is required' },
        timestamp: new Date().toISOString()
      })
    }
    
    // Verify job exists and is still pending - search by jobId field
    const db = getDb()
    const jobSnap = await db.collection('jobs').where('jobId', '==', jobId).limit(1).get()
    
    if (jobSnap.empty) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
        timestamp: new Date().toISOString()
      })
    }
    
    const job = { jobId: jobSnap.docs[0].id, ...jobSnap.docs[0].data() } as CanonicalJob
    
    if ((job as any).assignedTo || job.status === 'assigned' || job.status === 'in_progress') {
      return res.status(409).json({
        success: false,
        error: { code: 'JOB_ALREADY_PICKED', message: 'This job has already been picked up by another employee' },
        timestamp: new Date().toISOString()
      })
    }
    
    const docId = jobSnap.docs[0].id
    
    await updateDocument('jobs', docId, {
      status: 'assigned',
      assignedTo: {
        employeeId,
        name: name || 'Employee',
        phone: phone || ''
      },
      updatedAt: new Date().toISOString()
    })
    
    // Also update booking status and copy full invoice to job
    if (job.bookingId) {
      const bookingSnap = await db.collection('bookings').where('bookingId', '==', job.bookingId).limit(1).get()
      if (!bookingSnap.empty) {
        const bookingDocId = bookingSnap.docs[0].id
        const bookingData = bookingSnap.docs[0].data()
        await updateDocument('bookings', bookingDocId, {
          status: 'assigned',
          assignedEmployeeId: employeeId,
          updatedAt: new Date().toISOString()
        })
        // Copy full invoice from booking to job
        if (bookingData.invoice) {
          await updateDocument('jobs', docId, {
            invoice: bookingData.invoice,
            updatedAt: new Date().toISOString()
          })
        }
      }
    }
    
    const updated = await getDocument<CanonicalJob>('jobs', docId)
    return res.json({
      success: true,
      data: updated,
      message: 'Job picked up successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Job pickup failed:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'JOB_PICKUP_FAILED', message: 'Failed to pick up job' },
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /jobs/:id - Get single job (by jobId field)
 */
jobsRouter.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const jobSnap = await db.collection('jobs').where('jobId', '==', req.params.id).limit(1).get()
    if (jobSnap.empty) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse<never>)
    }
    const doc = jobSnap.docs[0]
    const job = { jobId: doc.id, ...doc.data() } as CanonicalJob
    
    return res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    } as ApiResponse<CanonicalJob>)
  } catch (error) {
    console.error('Firestore job lookup failed:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOB_FETCH_FAILED',
        message: 'Failed to fetch job'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
})

/**
 * DELETE /jobs/:id - Delete a job
 */
jobsRouter.delete('/:id', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  try {
    const db = getDb()
    const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
    const jobSnap = await db.collection('jobs').where('jobId', '==', jobId).limit(1).get()
    if (jobSnap.empty) {
      return res.status(404).json({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } })
    }
    await deleteDocument('jobs', jobSnap.docs[0].id)
    return res.json({ success: true, message: 'Job deleted' })
  } catch (error) {
    console.error('Firestore delete job failed:', error)
    return res.status(500).json({ success: false, error: { code: 'JOB_DELETE_FAILED', message: 'Failed to delete job' } })
  }
})

/**
 * PATCH /jobs/:id - Update job (assignment, status, completion)
 */
jobsRouter.patch('/:id', verifyFirebaseIdToken, async (req, res) => {
  const jobUpdateSchema = z.object({
    status: z.enum(['draft', 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
    assignedTo: z.object({
      employeeId: z.string(),
      name: z.string(),
      phone: z.string()
    }).optional(),
    notes: z.string().optional(),
    customerId: z.string().optional(),
    serviceType: z.string().optional(),
    amount: z.number().nonnegative().optional(),
    scheduledDate: z.string().optional(),
    completedDate: z.string().optional(),
    technicianId: z.string().optional()
  })

  const parsed = jobUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid job update payload'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }

  try {
    const db = getDb()
    const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
    const jobSnap = await db.collection('jobs').where('jobId', '==', jobId).limit(1).get()
    if (jobSnap.empty) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
        timestamp: new Date().toISOString()
      })
    }
    const docId = jobSnap.docs[0].id
    await updateDocument('jobs', docId, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    
    const updated = await getDocument<CanonicalJob>('jobs', docId)
    
    return res.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString()
    } as ApiResponse<CanonicalJob>)
  } catch (error) {
    console.error('Firestore update job failed:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOB_UPDATE_FAILED',
        message: 'Failed to update job'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
})

/**
 * POST /jobs/:id/complete - Submit work completion
 */
jobsRouter.post('/:id/complete', verifyFirebaseIdToken, async (req, res) => {
   const completionSchema = z.object({
      notes: z.string().min(1),
      actualAmount: z.number().nonnegative(),
      collectedAmount: z.number().nonnegative()
   })

   const parsed = completionSchema.safeParse(req.body)
   if (!parsed.success) {
      return res.status(400).json({
         success: false,
         error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid completion payload'
         },
         timestamp: new Date().toISOString()
      })
   }

   try {
    const db = getDb()
    const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
    const jobSnap = await db.collection('jobs').where('jobId', '==', jobId).limit(1).get()
    if (jobSnap.empty) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
        timestamp: new Date().toISOString()
      })
    }
    const docId = jobSnap.docs[0].id
    await updateDocument('jobs', docId, {
      status: 'completed',
      completionNotes: parsed.data.notes,
      actualAmount: parsed.data.actualAmount,
      collectedAmount: parsed.data.collectedAmount,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

      // Also update the associated booking
      const job = await getDocument<CanonicalJob>('jobs', docId)
      if (job && job.bookingId) {
        const bookingSnap = await db.collection('bookings').where('bookingId', '==', job.bookingId).limit(1).get()
        if (!bookingSnap.empty) {
          const bookingDocId = bookingSnap.docs[0].id
          await updateDocument('bookings', bookingDocId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }

      return res.json({
         success: true,
         message: 'Job marked as completed',
         timestamp: new Date().toISOString()
      })
   } catch (error) {
      console.error('Failed to complete job:', error)
      return res.status(500).json({
         success: false,
         error: {
            code: 'JOB_COMPLETION_FAILED',
            message: 'Failed to complete job'
         },
         timestamp: new Date().toISOString()
      })
   }
})
