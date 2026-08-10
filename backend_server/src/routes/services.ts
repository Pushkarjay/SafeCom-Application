import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getCollection, getDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore.js'
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js'
import { DocumentSnapshot, Query } from 'firebase-admin/firestore'
import type {
  CatalogService,
  CreateUpdateServiceRequest,
  ServiceListResponse,
  ServiceAddon,
  DiscountRule
} from '../contracts/canonical_contracts.js'

const serviceCreateUpdateSchema = z.object({
  serviceName: z.string().min(1, 'Service name required'),
  description: z.string().optional().nullable(),
  category: z.enum(['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories']),
  productIds: z.array(z.string().min(1)).min(1, 'At least one product required'),
  addons: z.array(z.object({
    addonId: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    additionalCost: z.number().nonnegative(),
    isOptional: z.boolean()
  })).optional().nullable(),
  discountRules: z.array(z.object({
    ruleId: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().positive(),
    minimumQuantity: z.number().nonnegative().optional()
  })).optional().nullable(),
  basePrice: z.number().positive('Price must be positive'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().optional().nullable(),
  duration: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  renewalFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']).optional().nullable(),
  serviceConfig: z.record(z.unknown()).optional().nullable(),
  taxRate: z.number().default(18),
  displayPriority: z.number().default(0)
})

export const servicesRouter = Router()

// GET /catalog/services - List all services with pagination
servicesRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || '1')
      const pageSize = Math.min(parseInt((req.query.pageSize as string) || '20'), 100)
      const category = req.query.category as string | undefined
      const featured = req.query.featured === 'true'
      const recurring = req.query.recurring as string | undefined

      let query: Query = getCollection('catalog_services')

      // Apply filters
      if (category) {
        query = query.where('category', '==', category)
      }
      if (featured) {
        query = query.where('isFeatured', '==', true)
      }
      if (recurring !== undefined) {
        const isRecurring = recurring === 'true'
        query = query.where('isRecurring', '==', isRecurring)
      }

      // Sort by display priority
      query = query.orderBy('displayPriority', 'asc')

      const snapshot = await query.get()
      const total = snapshot.docs.length

      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize

      const services = snapshot.docs
        .slice(startIndex, endIndex)
        .map((doc: DocumentSnapshot) => {
          const data = doc.data() as Record<string, unknown> | undefined;
          return {
            serviceId: doc.id,
            ...(data ?? {})
          } as CatalogService;
        })

      return res.json({
        success: true,
        data: {
          services,
          total,
          page,
          pageSize,
          hasMore: endIndex < total
        } as ServiceListResponse
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /catalog/services/:id - Get single service
servicesRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const serviceId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      const service = await getDocument<CatalogService>('catalog_services', serviceId)

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        })
      }

      return res.json({
        success: true,
        data: service
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /catalog/services - Create new service (ADMIN ONLY)
servicesRouter.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = serviceCreateUpdateSchema.parse(req.body)

      const now = new Date().toISOString()
      const service: Omit<CatalogService, 'serviceId'> = {
        serviceName: validated.serviceName,
        // Optional fields may arrive as null; treat null as "absent" and drop it.
        description: validated.description ?? undefined,
        category: validated.category,
        productIds: validated.productIds,
        addons: validated.addons ?? undefined,
        discountRules: validated.discountRules ?? undefined,
        basePrice: validated.basePrice,
        isAvailable: validated.isAvailable,
        isFeatured: validated.isFeatured ?? false,
        duration: validated.duration ?? undefined,
        isRecurring: validated.isRecurring,
        renewalFrequency: validated.renewalFrequency ?? undefined,
        serviceConfig: validated.serviceConfig ?? undefined,
        taxRate: validated.taxRate,
        displayPriority: validated.displayPriority ?? 0,
        createdAt: now,
        updatedAt: now
      }

      const serviceId = await createDocument('catalog_services', service as unknown as Record<string, unknown>)

      return res.status(201).json({
        success: true,
        data: {
          serviceId,
          ...service
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

// PATCH /catalog/services/:id - Update service (ADMIN ONLY)
servicesRouter.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const serviceId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]

      const partial = serviceCreateUpdateSchema.partial().parse(req.body)

      // Check service exists
      const existing = await getDocument<CatalogService>('catalog_services', serviceId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        })
      }

      const now = new Date().toISOString()
      const updates: Record<string, unknown> = {
        ...partial,
        updatedAt: now
      }

      await updateDocument('catalog_services', serviceId, updates)

      const updated = await getDocument<CatalogService>('catalog_services', serviceId)
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

// DELETE /catalog/services/:id - Delete service (ADMIN ONLY)
servicesRouter.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const serviceId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]

      // Check service exists
      const existing = await getDocument<CatalogService>('catalog_services', serviceId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        })
      }

      await deleteDocument('catalog_services', serviceId)

      return res.json({
        success: true,
        message: 'Service deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /catalog/services/category/:category - List services by category
servicesRouter.get(
  '/category/:category',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = typeof req.params.category === 'string' ? req.params.category : req.params.category[0]

      const snapshot = await getCollection('catalog_services')
        .where('category', '==', category)
        .orderBy('displayPriority', 'asc')
        .get()

      const services = snapshot.docs.map((doc: DocumentSnapshot) => {
        const data = doc.data() as Record<string, unknown> | undefined;
        return {
          serviceId: doc.id,
          ...(data ?? {})
        } as CatalogService;
      })

      return res.json({
        success: true,
        data: {
          services,
          total: services.length,
          category
        }
      })
    } catch (error) {
      next(error)
    }
  }
)
