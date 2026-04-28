import { Router } from 'express'
import { z } from 'zod'
import { technicians } from '../data/mock-data.js'

export const techniciansRouter = Router()

const technicianCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(4),
  location: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
  totalJobs: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(['available', 'on-job', 'inactive']).optional()
})

const technicianUpdateSchema = technicianCreateSchema.partial()

techniciansRouter.get('/', (_req, res) => {
  return res.json(technicians)
})

techniciansRouter.get('/:id', (req, res) => {
  const technician = technicians.find((item) => item.id === req.params.id)

  if (!technician) {
    return res.status(404).json({ message: 'Technician not found' })
  }

  return res.json(technician)
})

techniciansRouter.post('/', (req, res) => {
  const parsed = technicianCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid technician payload', issues: parsed.error.flatten() })
  }

  const nextId = `TECH${String(technicians.length + 1).padStart(3, '0')}`
  const technician = {
    id: nextId,
    totalJobs: parsed.data.totalJobs ?? 0,
    rating: parsed.data.rating ?? 0,
    status: parsed.data.status ?? 'available',
    ...parsed.data
  }

  technicians.push(technician)
  return res.status(201).json(technician)
})

techniciansRouter.patch('/:id', (req, res) => {
  const parsed = technicianUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid technician payload', issues: parsed.error.flatten() })
  }

  const index = technicians.findIndex((item) => item.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Technician not found' })
  }

  technicians[index] = { ...technicians[index], ...parsed.data }
  return res.json(technicians[index])
})
