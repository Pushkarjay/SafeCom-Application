import { Router } from 'express'
import { z } from 'zod'
import { queryCollection, getDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore.js'

const catalogCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  group: z.string().min(1),
  unit: z.string().min(1),
  price: z.number().nonnegative(),
  status: z.enum(['active', 'inactive']).optional()
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

// Recommendation Schemas
const recommendationCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  priority: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional()
})

const recommendationUpdateSchema = recommendationCreateSchema.partial()

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

    const products = await queryCollection<Record<string, unknown>>('catalog_products', filters)
    return res.json(products)
  } catch (error) {
    console.error('Firestore catalog lookup failed:', error)
    const { catalogProducts } = await import('../data/mock-data.js')
    return res.json(catalogProducts)
  }
})

// GET /catalog/products/:id - Get single product
catalogRouter.get('/products/:id', async (req, res) => {
  try {
    const product = await getDocument<Record<string, unknown>>('catalog_products', req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Catalog product not found' })
    }
    return res.json(product)
  } catch (error) {
    console.error('Firestore catalog lookup failed:', error)
    const { catalogProducts } = await import('../data/mock-data.js')
    const fallback = catalogProducts.find((item) => item.id === req.params.id)
    if (!fallback) {
      return res.status(404).json({ message: 'Catalog product not found' })
    }
    return res.json(fallback)
  }
})

// POST /catalog/products - Create new product
catalogRouter.post('/products', async (req, res) => {
  const parsed = catalogCreateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid catalog product payload', issues: parsed.error.flatten() })
  }

  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_products', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      createdAt: now,
      updatedAt: now
    })
    return res.status(201).json({ id: docId, ...parsed.data, status: parsed.data.status ?? 'active' })
  } catch (error) {
    console.error('Firestore create catalog product failed:', error)
    const { catalogProducts } = await import('../data/mock-data.js')
    const nextId = `PROD${String(catalogProducts.length + 1).padStart(3, '0')}`
    const product = {
      id: nextId,
      status: parsed.data.status ?? 'active',
      updatedAt: new Date().toISOString(),
      ...parsed.data
    }
    catalogProducts.push(product)
    return res.status(201).json(product)
  }
})

// PATCH /catalog/products/:id - Update product
catalogRouter.patch('/products/:id', async (req, res) => {
  const parsed = catalogUpdateSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid catalog product payload', issues: parsed.error.flatten() })
  }

  try {
    await updateDocument('catalog_products', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_products', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update catalog product failed:', error)
    const { catalogProducts } = await import('../data/mock-data.js')
    const index = catalogProducts.findIndex((item) => item.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ message: 'Catalog product not found' })
    }
    catalogProducts[index] = { ...catalogProducts[index], ...parsed.data }
    return res.json(catalogProducts[index])
  }
})

// DELETE /catalog/products/:id - Delete product
catalogRouter.delete('/products/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_products', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete catalog product failed:', error)
    const { catalogProducts } = await import('../data/mock-data.js')
    const index = catalogProducts.findIndex((item) => item.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ message: 'Catalog product not found' })
    }
    catalogProducts.splice(index, 1)
    return res.status(204).send()
  }
})

// GET /catalog/accessories - List all accessory catalog items
catalogRouter.get('/accessories', async (_req, res) => {
  try {
    const accessories = await queryCollection<Record<string, unknown>>('accessories_catalog', [])
    return res.json(accessories)
  } catch (error) {
    console.error('Firestore accessories lookup failed:', error)
    return res.json([])
  }
})

// GET /catalog/services - List all service categories
catalogRouter.get('/services', async (_req, res) => {
  try {
    const services = await queryCollection<Record<string, unknown>>('services', [])
    return res.json(services)
  } catch (error) {
    console.error('Firestore services lookup failed:', error)
    return res.json([])
  }
})

// GET /catalog/upgrade - List all upgrade bundle items
catalogRouter.get('/upgrade', async (_req, res) => {
  try {
    const bundles = await queryCollection<Record<string, unknown>>('upgrade_catalog', [])
    return res.json(bundles)
  } catch (error) {
    console.error('Firestore upgrade bundles lookup failed:', error)
    return res.json([])
  }
})

// GET /catalog/pricing - Read all pricing documents
catalogRouter.get('/pricing', async (_req, res) => {
  try {
    const installation = await getDocument<Record<string, unknown>>('pricing_installation', 'installation')
    const maintenance = await getDocument<Record<string, unknown>>('pricing_maintenance', 'maintenance')
    const repair = await getDocument<Record<string, unknown>>('pricing_repair', 'repair')
    return res.json({ installation, maintenance, repair })
  } catch (error) {
    console.error('Firestore pricing lookup failed:', error)
    return res.json({ installation: null, maintenance: null, repair: null })
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
    return res.json([])
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

// ===== RECOMMENDATIONS =====
// GET /catalog/recommendations
catalogRouter.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await queryCollection<Record<string, unknown>>('catalog_recommendations', [])
    return res.json(recommendations)
  } catch (error) {
    console.error('Firestore catalog recommendations lookup failed:', error)
    return res.json([])
  }
})

// POST /catalog/recommendations
catalogRouter.post('/recommendations', async (req, res) => {
  const parsed = recommendationCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid recommendation payload', issues: parsed.error.flatten() })
  }
  try {
    const now = new Date().toISOString()
    const docId = await createDocument('catalog_recommendations', {
      ...parsed.data,
      status: parsed.data.status ?? 'active',
      priority: parsed.data.priority ?? 0,
      updatedAt: now
    })
    return res.status(201).json({ id: docId, ...parsed.data, updatedAt: now })
  } catch (error) {
    console.error('Firestore create recommendation failed:', error)
    return res.status(500).json({ message: 'Failed to create recommendation' })
  }
})

// PATCH /catalog/recommendations/:id
catalogRouter.patch('/recommendations/:id', async (req, res) => {
  const parsed = recommendationUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid recommendation payload', issues: parsed.error.flatten() })
  }
  try {
    await updateDocument('catalog_recommendations', req.params.id, {
      ...parsed.data,
      updatedAt: new Date().toISOString()
    })
    const updated = await getDocument<Record<string, unknown>>('catalog_recommendations', req.params.id)
    return res.json(updated)
  } catch (error) {
    console.error('Firestore update recommendation failed:', error)
    return res.status(500).json({ message: 'Failed to update recommendation' })
  }
})

// DELETE /catalog/recommendations/:id
catalogRouter.delete('/recommendations/:id', async (req, res) => {
  try {
    await deleteDocument('catalog_recommendations', req.params.id)
    return res.status(204).send()
  } catch (error) {
    console.error('Firestore delete recommendation failed:', error)
    return res.status(500).json({ message: 'Failed to delete recommendation' })
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
    return res.json([])
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
