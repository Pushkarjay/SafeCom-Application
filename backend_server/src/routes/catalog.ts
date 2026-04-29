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
