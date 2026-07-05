import { Router } from 'express'
import { z } from 'zod'
import { getDocument, createDocument, updateDocument, deleteDocument, getDb } from '../services/firestore.js'
import { FirebaseAuthenticatedRequest, verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const employeeCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(4),
  location: z.string().optional().default(''),
  skills: z.array(z.string()).optional().default([]),
    status: z.enum(['available', 'on-job', 'inactive', 'active']).optional().default('available'),
    password: z.string().min(6)
})

const employeeUpdateSchema = employeeCreateSchema.partial().omit({ password: true })

export const techniciansRouter = Router()

techniciansRouter.get('/', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('employees').get()
    const employees: Record<string, unknown>[] = []

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      employees.push({ id: doc.id, ...data })
    })

    return res.json({ success: true, data: employees })
  } catch (error) {
    console.error('Firestore employees lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch employees' })
  }
})

techniciansRouter.get('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDb()
    const doc = await db.collection('employees').doc(req.params.id as string).get()
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Technician not found' })
    }
    const data = doc.data() as unknown as Record<string, unknown>
    return res.json({ success: true, data: { id: doc.id, ...data } })
  } catch (error) {
    console.error('Firestore employee lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch employee' })
  }
})

techniciansRouter.delete('/:id', authenticateToken, requireRole(['admin']), async (req: FirebaseAuthenticatedRequest, res) => {
  try {
    const db = getDb()
    const doc = await db.collection('employees').doc(req.params.id as string).get()
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Technician not found' })
    }
    await deleteDocument('employees', req.params.id as string)
    try {
      await getAuth().deleteUser(req.params.id as string)
    } catch { }
    return res.json({ success: true, message: 'Technician deleted' })
  } catch (error) {
    console.error('Firestore delete employee failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete employee' })
  }
})

techniciansRouter.post('/', authenticateToken, requireRole(['admin']), async (req: FirebaseAuthenticatedRequest, res) => {
  const parsed = employeeCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid technician payload', issues: parsed.error.flatten() })
  }

  const db = getDb()
  try {
    const phoneClean = parsed.data.phone.replace(/\D/g, '')
    const authEmail = `${phoneClean}@safecom.local`

    let firebaseUid = ''
    try {
      const userRecord = await getAuth().createUser({
        email: authEmail,
        password: parsed.data.password,
        displayName: parsed.data.name
      })
      firebaseUid = userRecord.uid
    } catch (authErr: any) {
      console.error('Firebase Auth user creation failed:', authErr)
      if (authErr?.errorInfo?.code === 'auth/email-already-exists') {
        return res.status(400).json({ success: false, message: 'A user with this phone already exists. Delete the existing employee first or use a different phone.' })
      }
      return res.status(400).json({ success: false, message: 'Failed to create auth user: ' + (authErr.message || '') })
    }

    const employeeId = firebaseUid || `emp_${phoneClean.slice(-10)}`
    const docRef = db.collection('employees').doc(employeeId)
    await docRef.set({
      id: employeeId,
      firebaseUid: employeeId,
      name: parsed.data.name,
      email: '', // Email is optional — leave empty for phone-only users
      phone: parsed.data.phone,
      location: parsed.data.location || '',
      skills: parsed.data.skills || [],
      status: parsed.data.status === 'available' ? 'active' : (parsed.data.status || 'active'),
      totalJobs: 0,
      completedJobs: 0,
      rating: 0,
      joinDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastPassword: parsed.data.password,
      lastPasswordUpdatedAt: new Date().toISOString()
    })

    return res.status(201).json({ success: true, data: { id: employeeId, ...parsed.data, totalJobs: 0, rating: 0, lastPassword: parsed.data.password } })
  } catch (error) {
    console.error('Firestore create employee failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create employee' })
  }
})

techniciansRouter.post('/:id/password', authenticateToken, requireRole(['admin']), async (req: FirebaseAuthenticatedRequest, res) => {
  const { password } = req.body as { password?: string }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
  }
  try {
    await getAuth().updateUser(req.params.id as string, { password })
    const db = getDb()
    await db.collection('employees').doc(req.params.id as string).update({
      lastPassword: password,
      lastPasswordUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return res.json({ success: true, message: 'Password updated' })
  } catch (error: any) {
    console.error('Failed to update Firebase Auth password:', error)
    if (error?.code === 'auth/user-not-found') {
      return res.status(404).json({ success: false, message: 'Auth user not found. Create a new employee instead.' })
    }
    return res.status(500).json({ success: false, message: 'Failed to update password' })
  }
})

techniciansRouter.patch('/:id', authenticateToken, requireRole(['admin']), async (req: FirebaseAuthenticatedRequest, res) => {
  const parsed = employeeUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid technician payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('employees', req.params.id as string, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('employees', req.params.id as string)
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Firestore update employee failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update employee' })
  }
})
