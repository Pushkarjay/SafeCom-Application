import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument } from '../services/firestore.js'

const jobCreateSchema = z.object({
  customerId: z.string().min(1),
  technicianId: z.string().min(1).nullable().optional(),
  serviceType: z.enum(['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories']),
  status: z.enum(['pending', 'assigned', 'in-progress', 'completed', 'cancelled']).optional(),
  amount: z.number().nonnegative(),
  scheduledDate: z.string().min(1),
  completedDate: z.string().nullable().optional(),
  notes: z.string().min(1)
})

const jobUpdateSchema = jobCreateSchema.partial()

export const jobsRouter = Router()

// GET /jobs - List all jobs
jobsRouter.get('/', async (_req, res) => {
  try {
    const jobs = await queryCollection<Record<string, unknown>>('jobs')
    return res.json(jobs)
  } catch (error) {
    console.error('Firestore jobs lookup failed:', error)
    const { jobs } = await import('../data/mock-data.js')
    return res.json(jobs)
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
    const { jobs } = await import('../data/mock-data.js')
    const fallback = jobs.find((item) => item.id === req.params.id)
    if (!fallback) {
      return res.status(404).json({ message: 'Job not found' })
    }
    return res.json(fallback)
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
    return res.status(201).json({ id: docId, ...parsed.data })
  } catch (error) {
    console.error('Firestore create job failed:', error)
    const { jobs } = await import('../data/mock-data.js')
    const nextId = `JOB${String(jobs.length + 1).padStart(3, '0')}`
    const job = {
      id: nextId,
      technicianId: parsed.data.technicianId ?? null,
      status: parsed.data.status ?? 'pending',
      completedDate: parsed.data.completedDate ?? null,
      ...parsed.data
    }
    jobs.push(job)
    return res.status(201).json(job)
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
    const { jobs } = await import('../data/mock-data.js')
    const index = jobs.findIndex((item) => item.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ message: 'Job not found' })
    }
    const current = jobs[index]
    const next = {
      ...current,
      ...parsed.data,
      technicianId: parsed.data.technicianId === undefined ? current.technicianId : parsed.data.technicianId,
      completedDate: parsed.data.status === 'completed'
        ? (parsed.data.completedDate ?? current.completedDate ?? new Date().toISOString().slice(0, 10))
        : (parsed.data.completedDate ?? current.completedDate)
    }
    jobs[index] = next
    return res.json(next)
  }
})
