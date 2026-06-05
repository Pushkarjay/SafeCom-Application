import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument, getDb } from '../services/firestore.js'
import { verifyFirebaseIdToken } from '../middleware/firebaseAuth.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const catalogCreateSchema = z.object({
  name: z.string().min(1).optional(),
  productName: z.string().min(1).optional(),
  category: z.string().min(1),
  group: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().nonnegative().optional(),
  basePrice: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  isAvailable: z.boolean().optional()
})

const catalogUpdateSchema = catalogCreateSchema.partial()

// Package Schemas
const packageCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  totalPrice: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  finalPrice: z.number().nonnegative(),
  status: z.enum(['active', 'inactive']).optional()
})

const packageUpdateSchema = packageCreateSchema.partial()

// Add-on Schemas
const addonCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  status: z.enum(['active', 'inactive']).optional()
})

const addonUpdateSchema = addonCreateSchema.partial()

// Tax Schemas
const taxCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  rate: z.number().min(0).max(100),
  status: z.enum(['active', 'inactive']).optional()
})

const taxUpdateSchema = taxCreateSchema.partial()

// Invoice Template Schemas
const invoiceTemplateCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  showTax: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

const invoiceTemplateUpdateSchema = invoiceTemplateCreateSchema.partial()

export const catalogRouter = Router()
const db = getDb()

// GET /catalog/metadata - Get unique categories and groups from products
catalogRouter.get('/metadata', verifyFirebaseIdToken, async (_req, res) => {
  try {
    const products = await queryCollection<Record<string, unknown>>('catalog_product', [] as { field: string; operator: '==' ; value: unknown }[])
    const categoriesSet = new Set<string>()
    const groupsSet = new Set<string>()
    for (const p of products) {
      if (typeof p.category === 'string') categoriesSet.add(p.category)
      if (typeof p.group === 'string') groupsSet.add(p.group)
    }
    const categories = Array.from(categoriesSet).sort()
    const groups = Array.from(groupsSet).sort()
    return res.json({ success: true, data: { categories, groups } })
  } catch (error) {
    console.error('Firestore metadata lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch metadata' })
  }
})

// POST /catalog/metadata - Create new category or group
catalogRouter.post('/metadata', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { type, value } = req.body
  if (!type || !value) {
    return res.status(400).json({ success: false, message: 'type and value are required' })
  }
  if (type !== 'category' && type !== 'group') {
    return res.status(400).json({ success: false, message: 'type must be "category" or "group"' })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_metadata', {
      type,
      value,
      createdAt: now,
      updatedAt: now
    })
    return res.status(201).json({ success: true, data: { id: docId, type, value } })
  } catch (error) {
    console.error('Firestore metadata create failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create metadata' })
  }
})

// DELETE /catalog/metadata/:id - Delete metadata entry
catalogRouter.delete('/metadata/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await deleteDocument('catalog_metadata', req.params.id as string)
    return res.json({ success: true, message: 'Metadata deleted' })
  } catch (error) {
    console.error('Firestore metadata delete failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete metadata' })
  }
})

// GET /catalog/accessories - Deprecated (use /api/catalog/accessories route)
catalogRouter.get('/accessories', verifyFirebaseIdToken, async (_req, res) => {
  res.setHeader('X-Deprecated', 'true')
  return res.json({ success: true, data: [] })
})

// GET /catalog/services - Deprecated (use /api/catalog/services route)
catalogRouter.get('/services', verifyFirebaseIdToken, async (_req, res) => {
  res.setHeader('X-Deprecated', 'true')
  return res.json({ success: true, data: [] })
})

// GET /catalog/upgrade - Deprecated (use /api/catalog-public/upgrade)
catalogRouter.get('/upgrade', verifyFirebaseIdToken, async (_req, res) => {
  res.setHeader('X-Deprecated', 'true')
  return res.json({ success: true, data: [] })
})

// GET /catalog/pricing - Read all pricing documents
catalogRouter.get('/pricing', verifyFirebaseIdToken, async (_req, res) => {
  try {
    const servicesRef = db.collection('Services')
    const installation = (await servicesRef.doc('Installation').get()).data() || null
    const maintenance = (await servicesRef.doc('Maintenance').get()).data() || null
    const repair = (await servicesRef.doc('Camera_Repair').get()).data() || null
    return res.json({ success: true, data: { installation, maintenance, repair } })
  } catch (error) {
    console.error('Firestore pricing lookup failed:', error)
    return res.json({ success: true, data: { installation: null, maintenance: null, repair: null } })
  }
})

// PUT /catalog/pricing - Update pricing configuration (admin only)
catalogRouter.put('/pricing', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { installation, maintenance, repair } = req.body
    const now = new Date().toISOString()

    if (installation) {
      await db.collection('Services').doc('Installation').set({ ...installation, updatedAt: now })
    }
    if (maintenance) {
      await db.collection('Services').doc('Maintenance').set({ ...maintenance, updatedAt: now })
    }
    if (repair) {
      await db.collection('Services').doc('Camera_Repair').set({ ...repair, updatedAt: now })
    }

    return res.json({ success: true, message: 'Pricing configuration updated', timestamp: now })
  } catch (error) {
    console.error('Firestore pricing update failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update pricing configuration' })
  }
})

// ===== PACKAGES =====
// GET /catalog/packages
catalogRouter.get('/packages', verifyFirebaseIdToken, async (req, res) => {
  try {
    const packages = await queryCollection<Record<string, unknown>>('catalog_packages', [])
    return res.json({ success: true, data: packages })
  } catch (error) {
    console.error('Firestore catalog packages lookup failed:', error)
    return res.json({ success: true, data: [] })
  }
})

// POST /catalog/packages
catalogRouter.post('/packages', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = packageCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid package payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_packages', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      updatedAt: now
    })
    return res.status(201).json({ success: true, data: { id: docId, ...parsed.data, updatedAt: now } })
  } catch (error) {
    console.error('Firestore create package failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create package' })
  }
})

// PATCH /catalog/packages/:id
catalogRouter.patch('/packages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = packageUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid package payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_packages', req.params.id as string, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_packages', req.params.id as string)
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Firestore update package failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update package' })
  }
})

// DELETE /catalog/packages/:id
catalogRouter.delete('/packages/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await deleteDocument('catalog_packages', req.params.id as string)
    return res.json({ success: true, message: 'Package deleted' })
  } catch (error) {
    console.error('Firestore delete package failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete package' })
  }
})

// ===== ADD-ONS =====
// GET /catalog/addons
catalogRouter.get('/addons', verifyFirebaseIdToken, async (req, res) => {
  try {
    const addons = await queryCollection<Record<string, unknown>>('catalog_addons', [])
    return res.json({ success: true, data: addons })
  } catch (error) {
    console.error('Firestore catalog addons lookup failed:', error)
    return res.json({ success: true, data: [] })
  }
})

// POST /catalog/addons
catalogRouter.post('/addons', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = addonCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid add-on payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_addons', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      updatedAt: now
    })
    return res.status(201).json({ success: true, data: { id: docId, ...parsed.data, updatedAt: now } })
  } catch (error) {
    console.error('Firestore create add-on failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create add-on' })
  }
})

// PATCH /catalog/addons/:id
catalogRouter.patch('/addons/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = addonUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid add-on payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_addons', req.params.id as string, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_addons', req.params.id as string)
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Firestore update add-on failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update add-on' })
  }
})

// DELETE /catalog/addons/:id
catalogRouter.delete('/addons/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await deleteDocument('catalog_addons', req.params.id as string)
    return res.json({ success: true, message: 'Add-on deleted' })
  } catch (error) {
    console.error('Firestore delete add-on failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete add-on' })
  }
})

// ===== TAXES =====
// GET /catalog/taxes
catalogRouter.get('/taxes', verifyFirebaseIdToken, async (req, res) => {
  try {
    const taxes = await queryCollection<Record<string, unknown>>('catalog_taxes', [])
    return res.json({ success: true, data: taxes })
  } catch (error) {
    console.error('Firestore catalog taxes lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch taxes' })
  }
})

// POST /catalog/taxes
catalogRouter.post('/taxes', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = taxCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid tax payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_taxes', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      updatedAt: now
    })
    return res.status(201).json({ success: true, data: { id: docId, ...parsed.data, updatedAt: now } })
  } catch (error) {
    console.error('Firestore create tax failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create tax' })
  }
})

// PATCH /catalog/taxes/:id
catalogRouter.patch('/taxes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = taxUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid tax payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_taxes', req.params.id as string, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_taxes', req.params.id as string)
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Firestore update tax failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update tax' })
  }
})

// DELETE /catalog/taxes/:id
catalogRouter.delete('/taxes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await deleteDocument('catalog_taxes', req.params.id as string)
    return res.json({ success: true, message: 'Tax deleted' })
  } catch (error) {
    console.error('Firestore delete tax failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete tax' })
  }
})

// ===== INVOICE TEMPLATES =====
// GET /catalog/invoices
catalogRouter.get('/invoices', verifyFirebaseIdToken, async (req, res) => {
  try {
    const invoices = await queryCollection<Record<string, unknown>>('catalog_invoices', [])
    return res.json({ success: true, data: invoices })
  } catch (error) {
    console.error('Firestore catalog invoices lookup failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' })
  }
})

// POST /catalog/invoices
catalogRouter.post('/invoices', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = invoiceTemplateCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid invoice template payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_invoices', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      showTax: parsed.data.showTax ?? true,
      updatedAt: now
    })
    return res.status(201).json({ success: true, data: { id: docId, ...parsed.data, updatedAt: now } })
  } catch (error) {
    console.error('Firestore create invoice template failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to create invoice template' })
  }
})

// PATCH /catalog/invoices/:id
catalogRouter.patch('/invoices/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const parsed = invoiceTemplateUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid invoice template payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_invoices', req.params.id as string, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_invoices', req.params.id as string)
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Firestore update invoice template failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to update invoice template' })
  }
})

// DELETE /catalog/invoices/:id
catalogRouter.delete('/invoices/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await deleteDocument('catalog_invoices', req.params.id as string)
    return res.json({ success: true, message: 'Invoice template deleted' })
  } catch (error) {
    console.error('Firestore delete invoice template failed:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete invoice template' })
  }
})
