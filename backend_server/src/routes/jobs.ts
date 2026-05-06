import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, getCollection } from '../services/firestore.js'
import { sendPushNotification } from '../services/notificationService.js'
import type { 
  CanonicalJob, 
  ApiResponse,
  ApiListResponse
} from '../contracts/canonical_contracts.js'

export const jobsRouter = Router()

/**
 * GET /jobs - List jobs for technician or all (admin)
 */
jobsRouter.get('/', async (req, res) => {
  try {
    const technicianId = (req.query.employeeId || req.query.technicianId) as string | undefined
    
    let jobs = await queryCollection<CanonicalJob>('jobs')
    
    if (technicianId) {
      jobs = jobs.filter(j => j.assignedTo?.employeeId === technicianId)
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
    } as ApiListResponse<CanonicalJob>)
  } catch (error) {
    console.error('Firestore jobs lookup failed:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'JOBS_FETCH_FAILED',
        message: 'Failed to fetch jobs'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
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
jobsRouter.patch('/:id', async (req, res) => {
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
    await updateDocument('jobs', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    
    const updated = await getDocument<CanonicalJob>('jobs', req.params.id)
    
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
jobsRouter.post('/:id/complete', async (req, res) => {
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
      await updateDocument('jobs', req.params.id, {
         status: 'completed',
         completionNotes: parsed.data.notes,
         actualAmount: parsed.data.actualAmount,
         collectedAmount: parsed.data.collectedAmount,
         completedAt: new Date().toISOString(),
         updatedAt: new Date().toISOString()
      })

      // Also update the associated booking
      const job = await getDocument<CanonicalJob>('jobs', req.params.id)
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
