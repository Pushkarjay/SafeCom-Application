import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument, getDb } from '../services/firestore.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { QueryDocumentSnapshot } from 'firebase-admin/firestore'

const customerCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(4),
  address: z.string().nullable().optional().default(''),
  status: z.enum(['active', 'inactive']).nullable().optional(),
  totalOrders: z.number().int().nonnegative().optional(),
  totalSpent: z.number().nonnegative().optional()
})

const customerUpdateSchema = customerCreateSchema.partial()

export const customersRouter = Router()

// GET /customers - List all customers
customersRouter.get('/', verifyFirebaseIdToken, async (req, res) => {
  try {
    const db = getDb()
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50))

    const snapshot = await db.collection('customers').limit(limit).get()

    const customers: Record<string, unknown>[] = []
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      customers.push({
        id: doc.id,
        ...data
      })
    })

    return res.json(customers)
  } catch (error) {
    console.error('Firestore customers lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch customers' })
  }
})

// GET /customers/:id - Get single customer
customersRouter.get('/:id', verifyFirebaseIdToken, async (req, res) => {
  try {
    const db = getDb()
    const doc = await db.collection('customers').doc(req.params.id as string).get()
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    const data = doc.data() as unknown as Record<string, unknown>
    return res.json({
      id: doc.id,
      ...data
    })
  } catch (error) {
    console.error('Firestore customer lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch customer' })
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
    return res.status(500).json({ message: 'Failed to create customer' })
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
    return res.status(500).json({ message: 'Failed to update customer' })
  }
})

// DELETE /customers/:id - Delete customer
customersRouter.delete('/:id', async (req, res) => {
  try {
    await deleteDocument('customers', req.params.id)
    return res.json({ message: 'Customer deleted' })
  } catch (error) {
    console.error('Firestore delete customer failed:', error)
    return res.status(500).json({ message: 'Failed to delete customer' })
  }
})
