import { Router } from 'express'
import { z } from 'zod'
import { customers } from '../data/mock-data.js'

export const customersRouter = Router()

const customerCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(4),
  address: z.string().min(1),
  status: z.enum(['active', 'inactive']).optional(),
  totalOrders: z.number().int().nonnegative().optional(),
  totalSpent: z.number().nonnegative().optional()
})

const customerUpdateSchema = customerCreateSchema.partial()

customersRouter.get('/', (_req, res) => {
  return res.json(customers)
})

customersRouter.get('/:id', (req, res) => {
  const customer = customers.find((item) => item.id === req.params.id)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  return res.json(customer)
})

customersRouter.post('/', (req, res) => {
  const parsed = customerCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid customer payload', issues: parsed.error.flatten() })
  }

  const nextId = `CUST${String(customers.length + 1).padStart(3, '0')}`
  const customer = {
    id: nextId,
    status: parsed.data.status ?? 'active',
    totalOrders: parsed.data.totalOrders ?? 0,
    totalSpent: parsed.data.totalSpent ?? 0,
    ...parsed.data
  }

  customers.push(customer)
  return res.status(201).json(customer)
})

customersRouter.patch('/:id', (req, res) => {
  const parsed = customerUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid customer payload', issues: parsed.error.flatten() })
  }

  const index = customers.findIndex((item) => item.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  customers[index] = { ...customers[index], ...parsed.data }
  return res.json(customers[index])
})
