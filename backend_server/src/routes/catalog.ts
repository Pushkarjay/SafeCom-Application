import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument, getDb } from '../services/firestore.js'

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

// GET /catalog/products - List all catalog products
catalogRouter.get('/products', async (req, res) => {
  try {
    const filters = [] as Array<{ field: string; operator: '=='; value: unknown }>

    if (typeof req.query.status === 'string' && req.query.status.length > 0) {
      filters.push({ field: 'status', operator: '==', value: req.query.status })
    }
    if (typeof req.query.category === 'string' && req.query.category.length > 0) {
      filters.push({ field: 'category', operator: '==', value: req.query.category })
    }
    if (typeof req.query.group === 'string' && req.query.group.length > 0) {
      filters.push({ field: 'group', operator: '==', value: req.query.group })
    }

    const products = await queryCollection<Record<string, unknown>>('catalog_product', filters)
    return res.json(products)
  } catch (error) {
    console.error('Firestore catalog lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch catalog products' })
  }
})

// GET /catalog/metadata - Get unique categories and groups from products
catalogRouter.get('/metadata', async (_req, res) => {
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
    return res.status(500).json({ message: 'Failed to fetch metadata' })
  }
})

// POST /catalog/metadata - Create new category or group
catalogRouter.post('/metadata', async (req, res) => {
  const { type, value } = req.body
  if (!type || !value) {
    return res.status(400).json({ message: 'type and value are required' })
  }
  if (type !== 'category' && type !== 'group') {
    return res.status(400).json({ message: 'type must be "category" or "group"' })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_metadata', {
      type,
      value,
      createdAt: now,
      updatedAt: now
    })
    return res.status(201).json({ success: true, id: docId, type, value })
  } catch (error) {
    console.error('Firestore metadata create failed:', error)
    return res.status(500).json({ message: 'Failed to create metadata' })
  }
})

// GET /catalog/products/:id - Get single product
catalogRouter.get('/products/:id', async (req, res) => {
  try {
    const product = await getDocument<Record<string, unknown>>('catalog_product', req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Catalog product not found' })
    }
    return res.json(product)
  } catch (error) {
    console.error('Firestore catalog lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch catalog product' })
  }
})

// POST /catalog/products - Create new product
catalogRouter.post('/products', async (req, res) => {
  const parsed = catalogCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid catalog product payload', issues: parsed.error.flatten() })
  }

  try {
    const input = parsed.data
    const now = new Date().toISOString()
    // Normalize field names: handle both frontend and backend naming conventions
    const productName = input.productName || input.name
    const price = input.price ?? input.basePrice ?? 0
    const status = input.isAvailable === false ? 'inactive' : (input.status ?? 'active')
    const category = input.category
    const group = input.group
    const unit = input.unit
    const docId = await createDocument('catalog_product', {
      productName,
      name: productName, // also set 'name' for compatibility
      category,
      group: group || 'General',
      unit: unit || 'unit',
      basePrice: price,
      price, // also set 'price' for compatibility
      status,
      isAvailable: status === 'active',
      createdAt: now,
      updatedAt: now
    })
    return res.status(201).json({ success: true, id: docId, data: { productName, category, group, basePrice: price, status } })
  } catch (error) {
    console.error('Firestore create catalog product failed:', error)
    return res.status(500).json({ message: 'Failed to create catalog product' })
  }
})

// PATCH /catalog/products/:id - Update product
catalogRouter.patch('/products/:id', async (req, res) => {
  const parsed = catalogUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid catalog product payload', issues: parsed.error.flatten() })
  }

  try {
    await updateDocument('catalog_product', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_product', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update catalog product failed:', error)
    return res.status(500).json({ message: 'Failed to update catalog product' })
  }
})

// DELETE /catalog/products/:id - Delete product
catalogRouter.delete('/products/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_product', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete catalog product failed:', error)
    return res.status(500).json({ message: 'Failed to delete catalog product' })
  }
})

// GET /catalog/accessories - Deprecated (use /catalog/accessories route)
catalogRouter.get('/accessories', async (_req, res) => {
  return res.json([])
})

// GET /catalog/services - Deprecated (use /catalog/services route)
catalogRouter.get('/services', async (_req, res) => {
  return res.json([])
})

// GET /catalog/upgrade - Deprecated (use /catalog-public/upgrade)
catalogRouter.get('/upgrade', async (_req, res) => {
  return res.json([])
})

// GET /catalog/pricing - Read all pricing documents
catalogRouter.get('/pricing', async (_req, res) => {
  try {
    const servicesRef = db.collection('Services')
    const installation = (await servicesRef.doc('Installation').get()).data() || null
    const maintenance = (await servicesRef.doc('Maintenance').get()).data() || null
    const repair = (await servicesRef.doc('Camera_Repair').get()).data() || null
    return res.json({ installation, maintenance, repair })
  } catch (error) {
    console.error('Firestore pricing lookup failed:', error)
    return res.json({ installation: null, maintenance: null, repair: null })
  }
})

// PUT /catalog/pricing - Update pricing configuration
catalogRouter.put('/pricing', async (req, res) => {
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

    return res.json({ success: true, timestamp: now })
  } catch (error) {
    console.error('Firestore pricing update failed:', error)
    return res.status(500).json({ message: 'Failed to update pricing configuration' })
  }
})

// ===== PACKAGES =====
// GET /catalog/packages
catalogRouter.get('/packages', async (req, res) => {
  try {
    const packages = await queryCollection<Record<string, unknown>>('catalog_packages', [])
    return res.json(packages)
  } catch (error) {
    console.error('Firestore catalog packages lookup failed:', error)
    return res.json([])
  }
})

// POST /catalog/packages
catalogRouter.post('/packages', async (req, res) => {
  const parsed = packageCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid package payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_packages', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      updatedAt: now
    })
    return res.status(201).json({ id: docId, ...parsed.data, updatedAt: now })
  } catch (error) {
    console.error('Firestore create package failed:', error)
    return res.status(500).json({ message: 'Failed to create package' })
  }
})

// PATCH /catalog/packages/:id
catalogRouter.patch('/packages/:id', async (req, res) => {
  const parsed = packageUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid package payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_packages', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_packages', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update package failed:', error)
    return res.status(500).json({ message: 'Failed to update package' })
  }
})

// DELETE /catalog/packages/:id
catalogRouter.delete('/packages/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_packages', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete package failed:', error)
    return res.status(500).json({ message: 'Failed to delete package' })
  }
})

// ===== ADD-ONS =====
// GET /catalog/addons
catalogRouter.get('/addons', async (req, res) => {
  try {
    const addons = await queryCollection<Record<string, unknown>>('catalog_addons', [])
    return res.json(addons)
  } catch (error) {
    console.error('Firestore catalog addons lookup failed:', error)
    return res.json([])
  }
})

// POST /catalog/addons
catalogRouter.post('/addons', async (req, res) => {
  const parsed = addonCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid add-on payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_addons', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      updatedAt: now
    })
    return res.status(201).json({ id: docId, ...parsed.data, updatedAt: now })
  } catch (error) {
    console.error('Firestore create add-on failed:', error)
    return res.status(500).json({ message: 'Failed to create add-on' })
  }
})

// PATCH /catalog/addons/:id
catalogRouter.patch('/addons/:id', async (req, res) => {
  const parsed = addonUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid add-on payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_addons', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_addons', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update add-on failed:', error)
    return res.status(500).json({ message: 'Failed to update add-on' })
  }
})

// DELETE /catalog/addons/:id
catalogRouter.delete('/addons/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_addons', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete add-on failed:', error)
    return res.status(500).json({ message: 'Failed to delete add-on' })
  }
})

// ===== TAXES =====
// GET /catalog/taxes
catalogRouter.get('/taxes', async (req, res) => {
  try {
    const taxes = await queryCollection<Record<string, unknown>>('catalog_taxes', [])
    return res.json(taxes)
  } catch (error) {
    console.error('Firestore catalog taxes lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch taxes' })
  }
})

// POST /catalog/taxes
catalogRouter.post('/taxes', async (req, res) => {
  const parsed = taxCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid tax payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_taxes', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      updatedAt: now
    })
    return res.status(201).json({ id: docId, ...parsed.data, updatedAt: now })
  } catch (error) {
    console.error('Firestore create tax failed:', error)
    return res.status(500).json({ message: 'Failed to create tax' })
  }
})

// PATCH /catalog/taxes/:id
catalogRouter.patch('/taxes/:id', async (req, res) => {
  const parsed = taxUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid tax payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_taxes', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_taxes', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update tax failed:', error)
    return res.status(500).json({ message: 'Failed to update tax' })
  }
})

// DELETE /catalog/taxes/:id
catalogRouter.delete('/taxes/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_taxes', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete tax failed:', error)
    return res.status(500).json({ message: 'Failed to delete tax' })
  }
})

// ===== INVOICE TEMPLATES =====
// GET /catalog/invoices
catalogRouter.get('/invoices', async (req, res) => {
  try {
    const invoices = await queryCollection<Record<string, unknown>>('catalog_invoices', [])
    return res.json(invoices)
  } catch (error) {
    console.error('Firestore catalog invoices lookup failed:', error)
    return res.status(500).json({ message: 'Failed to fetch invoices' })
  }
})

// POST /catalog/invoices
catalogRouter.post('/invoices', async (req, res) => {
  const parsed = invoiceTemplateCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid invoice template payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_invoices', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      showTax: parsed.data.showTax ?? true,
      updatedAt: now
    })
    return res.status(201).json({ id: docId, ...parsed.data, updatedAt: now })
  } catch (error) {
    console.error('Firestore create invoice template failed:', error)
    return res.status(500).json({ message: 'Failed to create invoice template' })
  }
})

// PATCH /catalog/invoices/:id
catalogRouter.patch('/invoices/:id', async (req, res) => {
  const parsed = invoiceTemplateUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid invoice template payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_invoices', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_invoices', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update invoice template failed:', error)
    return res.status(500).json({ message: 'Failed to update invoice template' })
  }
})

// DELETE /catalog/invoices/:id
catalogRouter.delete('/invoices/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_invoices', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete invoice template failed:', error)
    return res.status(500).json({ message: 'Failed to delete invoice template' })
  }
})
