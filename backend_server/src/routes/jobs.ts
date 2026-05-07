import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, getCollection, getDb } from '../services/firestore.js'
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
    
    if (unassigned) {
      // Employee job board: show only pending unassigned jobs
      query = query.where('status', '==', 'pending')
    } else if (technicianId) {
      // Show jobs for a specific technician — includes both assignedTo.employeeId and assignedTo
      // Firestore nested field query
      query = query.where('assignedTo.employeeId', '==', technicianId)
    }
    
    if (statusFilter && !unassigned) {
      query = query.where('status', '==', statusFilter)
    }
    
    // Order by creation date descending
    query = query.orderBy('createdAt', 'desc')
    
    const snapshot = await query.get()
    let jobs: CanonicalJob[] = []
    
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      jobs.push({
        jobId: doc.id,
        ...data
      } as CanonicalJob)
    })
    
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
    
    // Verify job exists and is still pending
    const job = await getDocument<CanonicalJob>('jobs', jobId)
    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job not found' },
        timestamp: new Date().toISOString()
      })
    }
    
    if ((job as any).assignedTo || job.status === 'assigned' || job.status === 'in_progress') {
      return res.status(409).json({
        success: false,
        error: { code: 'JOB_ALREADY_PICKED', message: 'This job has already been picked up by another employee' },
        timestamp: new Date().toISOString()
      })
    }
    
    await updateDocument('jobs', jobId, {
      status: 'assigned',
      assignedTo: {
        employeeId,
        name: name || 'Employee',
        phone: phone || ''
      },
      updatedAt: new Date().toISOString()
    })
    
    // Also update booking status
    if (job.bookingId) {
      await updateDocument('bookings', job.bookingId, {
        status: 'assigned',
        assignedEmployeeId: employeeId,
        updatedAt: new Date().toISOString()
      })
    }
    
    const updated = await getDocument<CanonicalJob>('jobs', jobId)
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
 * GET /jobs/:id - Get single job
 */
jobsRouter.get('/:id', async (req, res) => {
  try {
    const job = await getDocument<CanonicalJob>('jobs', req.params.id)
    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found'
        },
        timestamp: new Date().toISOString()
      } as ApiResponse<never>)
    }
    
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
    notes: z.string().optional()
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
  const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
    await updateDocument('jobs', jobId, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    
    const updated = await getDocument<CanonicalJob>('jobs', jobId)
    
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
   const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
    await updateDocument('jobs', jobId, {
      status: 'completed',
      completionNotes: parsed.data.notes,
      actualAmount: parsed.data.actualAmount,
      collectedAmount: parsed.data.collectedAmount,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Also update the associated booking
    const job = await getDocument<CanonicalJob>('jobs', jobId)
      if (job && job.bookingId) {
         await updateDocument('bookings', job.bookingId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
         })
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
