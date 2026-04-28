import { Router } from 'express'
import { z } from 'zod'
import { jobs } from '../data/mock-data.js'

export const jobsRouter = Router()

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

jobsRouter.get('/', (_req, res) => {
  return res.json(jobs)
})

jobsRouter.get('/:id', (req, res) => {
  const job = jobs.find((item) => item.id === req.params.id)

  if (!job) {
    return res.status(404).json({ message: 'Job not found' })
  }

  return res.json(job)
})

jobsRouter.post('/', (req, res) => {
  const parsed = jobCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid job payload', issues: parsed.error.flatten() })
  }

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
})

jobsRouter.patch('/:id', (req, res) => {
  const parsed = jobUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid job payload', issues: parsed.error.flatten() })
  }

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
})
