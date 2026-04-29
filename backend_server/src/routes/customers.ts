import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument } from '../services/firestore.js'

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

export const customersRouter = Router()

// GET /customers - List all customers
customersRouter.get('/', async (_req, res) => {
  try {
    const customers = await queryCollection<Record<string, unknown>>('customers')
    return res.json(customers)
  } catch (error) {
    console.error('Firestore customers lookup failed:', error)
    const { customers } = await import('../data/mock-data.js')
    return res.json(customers)
  }
})

// GET /customers/:id - Get single customer
customersRouter.get('/:id', async (req, res) => {
  try {
    const customer = await getDocument<Record<string, unknown>>('customers', req.params.id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    return res.json(customer)
  } catch (error) {
    console.error('Firestore customer lookup failed:', error)
    const { customers } = await import('../data/mock-data.js')
    const fallback = customers.find((item) => item.id === req.params.id)
    if (!fallback) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    return res.json(fallback)
  }
})

// POST /customers - Create new customer
customersRouter.post('/', async (req, res) => {
  const parsed = customerCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid customer payload', issues: parsed.error.flatten() })
  }

  try {
    const docId = await createDocument('customers', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      totalOrders: parsed.data.totalOrders ?? 0,
      totalSpent: parsed.data.totalSpent ?? 0,
      createdAt: new Date().toISOString()
    })
    return res.status(201).json({ id: docId, ...parsed.data })
  } catch (error) {
    console.error('Firestore create customer failed:', error)
    const { customers } = await import('../data/mock-data.js')
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
  }
})

// PATCH /customers/:id - Update customer
customersRouter.patch('/:id', async (req, res) => {
  const parsed = customerUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid customer payload', issues: parsed.error.flatten() })
  }

  try {
    await updateDocument('customers', req.params.id, parsed.data)
    const updated = await getDocument<Record<string, unknown>>('customers', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update customer failed:', error)
    const { customers } = await import('../data/mock-data.js')
    const index = customers.findIndex((item) => item.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    customers[index] = { ...customers[index], ...parsed.data }
    return res.json(customers[index])
  }
})
