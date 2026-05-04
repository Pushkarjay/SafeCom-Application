import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getCollection, getDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore.js'
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js'
import { DocumentSnapshot, Query } from 'firebase-admin/firestore'
import type {
  CatalogAccessory,
  CreateUpdateAccessoryRequest,
  AccessoryListResponse
} from '../contracts/canonical_contracts.js'

const accessoryCreateUpdateSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  type: z.enum(['installation', 'upgrades', 'warranty', 'support', 'other']),
  category: z.string().min(1, 'Category required'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().nonnegative(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().optional(),
  imageUrl: z.string().optional(),
  compatibility: z.object({
    compatibleProductIds: z.array(z.string()).optional(),
    compatibleServiceIds: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).optional(),
  taxRate: z.number().default(18),
  displayPriority: z.number().default(0)
})

export const accessoriesRouter = Router()

// GET /catalog/accessories - List all accessories
accessoriesRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || '1')
      const pageSize = Math.min(parseInt((req.query.pageSize as string) || '20'), 100)
      const type = req.query.type as string | undefined
      const featured = req.query.featured === 'true'

      let query: Query = getCollection('catalog_accessories')

      if (type) {
        query = query.where('type', '==', type)
      }
      if (featured) {
        query = query.where('isFeatured', '==', true)
      }

      query = query.orderBy('displayPriority', 'asc')

      const snapshot = await query.get()
      const total = snapshot.docs.length

      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize

      const accessories = snapshot.docs
        .slice(startIndex, endIndex)
        .map((doc: DocumentSnapshot) => ({
          accessoryId: doc.id,
          ...doc.data()
        })) as CatalogAccessory[]

      return res.json({
        success: true,
        data: {
          accessories,
          total,
          page,
          pageSize,
          hasMore: endIndex < total
        } as AccessoryListResponse
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /catalog/accessories/:id - Get single accessory
accessoriesRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessoryId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      const accessory = await getDocument<CatalogAccessory>('catalog_accessories', accessoryId)

      if (!accessory) {
        return res.status(404).json({
          success: false,
          message: 'Accessory not found'
        })
      }

      return res.json({
        success: true,
        data: accessory
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /catalog/accessories - Create accessory (ADMIN ONLY)
accessoriesRouter.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = accessoryCreateUpdateSchema.parse(req.body)

      const now = new Date().toISOString()
      const accessory: Omit<CatalogAccessory, 'accessoryId'> = {
        name: validated.name,
        description: validated.description,
        type: validated.type,
        category: validated.category,
        price: validated.price,
        stock: validated.stock,
        isAvailable: validated.isAvailable,
        isFeatured: validated.isFeatured ?? false,
        imageUrl: validated.imageUrl,
        compatibility: validated.compatibility,
        taxRate: validated.taxRate,
        displayPriority: validated.displayPriority ?? 0,
        createdAt: now,
        updatedAt: now
      }

      const accessoryId = await createDocument('catalog_accessories', accessory as unknown as Record<string, unknown>)

      return res.status(201).json({
        success: true,
        data: {
          accessoryId,
          ...accessory
        }
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        })
      }
      next(error)
    }
  }
)

// PATCH /catalog/accessories/:id - Update accessory (ADMIN ONLY)
accessoriesRouter.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const accessoryId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]

      const partial = accessoryCreateUpdateSchema.partial().parse(req.body)

      const existing = await getDocument<CatalogAccessory>('catalog_accessories', accessoryId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Accessory not found'
        })
      }

      const now = new Date().toISOString()
      const updates: Record<string, unknown> = {
        ...partial,
        updatedAt: now
      }

      await updateDocument('catalog_accessories', accessoryId, updates)

      const updated = await getDocument<CatalogAccessory>('catalog_accessories', accessoryId)
      return res.json({
        success: true,
        data: updated
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        })
      }
      next(error)
    }
  }
)

// DELETE /catalog/accessories/:id - Delete accessory (ADMIN ONLY)
accessoriesRouter.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const accessoryId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]

      const existing = await getDocument<CatalogAccessory>('catalog_accessories', accessoryId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Accessory not found'
        })
      }

      await deleteDocument('catalog_accessories', accessoryId)

      return res.json({
        success: true,
        message: 'Accessory deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /catalog/accessories/type/:type - List accessories by type
accessoriesRouter.get(
  '/type/:type',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = typeof req.params.type === 'string' ? req.params.type : req.params.type[0]

      const snapshot = await getCollection('catalog_accessories')
        .where('type', '==', type)
        .orderBy('displayPriority', 'asc')
        .get()

      const accessories = snapshot.docs.map((doc: DocumentSnapshot) => ({
        accessoryId: doc.id,
        ...doc.data()
      })) as CatalogAccessory[]

      return res.json({
        success: true,
        data: {
          accessories,
          total: accessories.length,
          type
        }
      })
    } catch (error) {
      next(error)
    }
  }
)
