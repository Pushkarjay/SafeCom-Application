import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, getCollection } from '../services/firestore.js'
import { sendPushNotification } from '../services/notificationService.js'

const jobCreateSchema = z.object({
  customerId: z.string().min(1),
  technicianId: z.string().min(1).nullable().optional(),
  serviceType: z.enum(['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories']),
  status: z.enum(['pending', 'assigned', 'in-progress', 'completed', 'cancelled']).optional(),
  amount: z.number().nonnegative(),
  scheduledDate: z.string().min(1),
  completedDate: z.string().nullable().optional(),
  notes: z.string().min(1).optional()
})

const jobUpdateSchema = jobCreateSchema.partial()

export const jobsRouter = Router()

// GET /jobs - List all jobs
jobsRouter.get('/', async (req, res) => {
  try {
    const filters: { field: string; operator: '==' | '>' | '<' | '>=' | '<='; value: unknown }[] = []
    
    if (req.query.employeeId) {
      filters.push({ field: 'technicianId', operator: '==', value: req.query.employeeId })
    } else if (req.query.technicianId) {
      filters.push({ field: 'technicianId', operator: '==', value: req.query.technicianId })
    }

    const jobs = await queryCollection<Record<string, unknown>>('jobs', filters)
    return res.json(jobs)
  } catch (error) {
    console.error('Firestore jobs lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch jobs' })
  }
})

// GET /jobs/:id - Get single job
jobsRouter.get('/:id', async (req, res) => {
  try {
    const job = await getDocument<Record<string, unknown>>('jobs', req.params.id)
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }
    return res.json(job)
  } catch (error) {
    console.error('Firestore job lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch job' })
  }
})

// POST /jobs - Create new job
jobsRouter.post('/', async (req, res) => {
  const parsed = jobCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid job payload', issues: parsed.error.flatten() })
  }

  try {
    const docId = await createDocument('jobs', {
      ...parsed.data,
      technicianId: parsed.data.technicianId ?? null,
      status: parsed.data.status ?? 'pending',
      completedDate: parsed.data.completedDate ?? null,
      createdAt: new Date().toISOString()
    })

    // Notify all employees
    try {
      const employeesSnapshot = await getCollection('employees').get()
      const tokens: string[] = []
      employeesSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.pushToken) {
          tokens.push(data.pushToken)
        }
      })

      if (tokens.length > 0) {
        await sendPushNotification({
          tokens,
          title: 'New Job Available',
          body: `A new ${parsed.data.serviceType} job has been created.`,
          data: { jobId: docId }
        })
      }
    } catch (pushErr) {
      console.error('Failed to send push notifications:', pushErr)
    }

    return res.status(201).json({ id: docId, ...parsed.data })
  } catch (error) {
    console.error('Firestore create job failed:', error)
    return res.status(500).json({ message: 'Failed to create job' })
  }
})

// PATCH /jobs/:id - Update job
jobsRouter.patch('/:id', async (req, res) => {
  const parsed = jobUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid job payload', issues: parsed.error.flatten() })
  }

  try {
    await updateDocument('jobs', req.params.id, parsed.data)
    const updated = await getDocument<Record<string, unknown>>('jobs', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update job failed:', error)
    return res.status(500).json({ message: 'Failed to update job' })
  }
})
