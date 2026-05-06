import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, getDb } from '../services/firestore.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { QueryDocumentSnapshot } from 'firebase-admin/firestore'

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

export const techniciansRouter = Router()

// GET /technicians - List all technicians
techniciansRouter.get('/', verifyFirebaseIdToken, async (_req, res) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('technicians').get()
    const technicians: Record<string, unknown>[] = []

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      technicians.push({
        id: doc.id,
        ...data
      })
    })

    return res.json(technicians)
  } catch (error) {
    console.error('Firestore technicians lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch technicians' })
  }
})

// GET /technicians/:id - Get single technician
techniciansRouter.get('/:id', verifyFirebaseIdToken, async (req, res) => {
  try {
    const db = getDb()
    const doc = await db.collection('technicians').doc(req.params.id as string).get()
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Technician not found' })
    }
    
    const data = doc.data() as unknown as Record<string, unknown>
    return res.json({
      id: doc.id,
      ...data
    })
  } catch (error) {
    console.error('Firestore technician lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch technician' })
  }
})

// POST /technicians - Create new technician
techniciansRouter.post('/', async (req, res) => {
  const parsed = technicianCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid technician payload', issues: parsed.error.flatten() })
  }

  try {
    const docId = await createDocument('technicians', {
      ...parsed.data,
      totalJobs: parsed.data.totalJobs ?? 0,
      rating: parsed.data.rating ?? 0,
      status: parsed.data.status ?? 'available',
      createdAt: new Date().toISOString()
    })
    return res.status(201).json({ id: docId, ...parsed.data })
  } catch (error) {
    console.error('Firestore create technician failed:', error)
    return res.status(500).json({ message: 'Failed to create technician' })
  }
})

// PATCH /technicians/:id - Update technician
techniciansRouter.patch('/:id', async (req, res) => {
  const parsed = technicianUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid technician payload', issues: parsed.error.flatten() })
  }

  try {
    await updateDocument('technicians', req.params.id, parsed.data)
    const updated = await getDocument<Record<string, unknown>>('technicians', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update technician failed:', error)
    return res.status(500).json({ message: 'Failed to update technician' })
  }
})
