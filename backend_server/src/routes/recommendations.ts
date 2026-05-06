import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getCollection, getDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore.js'
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js'
import { DocumentSnapshot, Query } from 'firebase-admin/firestore'
import type {
  CatalogRecommendationRule,
  RecommendationListResponse
} from '../contracts/canonical_contracts.js'

const recommendationCreateUpdateSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  productIds: z.array(z.string().min(1)).min(1, 'At least one product required'),
  placement: z.enum(['checkout', 'cart', 'service', 'general']),
  serviceTypes: z.array(z.enum(['installation', 'maintenance', 'amc', 'repair', 'upgrade', 'accessories'])).optional(),
  isAvailable: z.boolean().default(true),
  displayPriority: z.number().default(0)
})

export const recommendationsRouter = Router()

// GET /api/catalog/recommendations - List all recommendations
recommendationsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || '1')
      const pageSize = Math.min(parseInt((req.query.pageSize as string) || '20'), 100)
      const placement = req.query.placement as string | undefined
      const serviceType = req.query.serviceType as string | undefined
      const available = req.query.available as string | undefined

      let query: Query = getCollection('catalog_recommendations')

      if (placement) {
        query = query.where('placement', '==', placement)
      }
      if (serviceType) {
        query = query.where('serviceTypes', 'array-contains', serviceType)
      }
      if (available !== undefined) {
        query = query.where('isAvailable', '==', available === 'true')
      }

      // Fetch all matching and sort in memory to avoid complex composite index requirements
      const snapshot = await query.get()
      
      let recommendations = snapshot.docs.map((doc: DocumentSnapshot) => {
        const data = doc.data() as any
        return {
          recommendationId: doc.id,
          ...data,
          // Fallback for displayPriority if using old seed data with 'priority'
          displayPriority: data.displayPriority ?? data.priority ?? 0
        }
      }) as (CatalogRecommendationRule & { priority?: number })[]

      // In-memory sort
      recommendations.sort((a, b) => (a.displayPriority ?? 0) - (b.displayPriority ?? 0))

      const total = recommendations.length
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      const paginatedRecommendations = recommendations.slice(startIndex, endIndex)

      return res.json({
        success: true,
        data: {
          recommendations: paginatedRecommendations,
          total,
          page,
          pageSize,
          hasMore: endIndex < total
        } as RecommendationListResponse
      })
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      next(error)
    }
  }
)

// GET /api/catalog/recommendations/:id - Get single recommendation
recommendationsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recommendationId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      const recommendation = await getDocument<CatalogRecommendationRule>('catalog_recommendations', recommendationId)

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        })
      }

      return res.json({
        success: true,
        data: recommendation
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/catalog/recommendations - Create recommendation (ADMIN ONLY)
recommendationsRouter.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = recommendationCreateUpdateSchema.parse(req.body)

      const now = new Date().toISOString()
      const recommendation: Omit<CatalogRecommendationRule, 'recommendationId'> = {
        name: validated.name,
        description: validated.description,
        productIds: validated.productIds,
        placement: validated.placement,
        serviceTypes: validated.serviceTypes,
        isAvailable: validated.isAvailable,
        displayPriority: validated.displayPriority ?? 0,
        createdAt: now,
        updatedAt: now
      }

      const recommendationId = await createDocument('catalog_recommendations', recommendation as unknown as Record<string, unknown>)

      return res.status(201).json({
        success: true,
        data: {
          recommendationId,
          ...recommendation
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

// PATCH /api/catalog/recommendations/:id - Update recommendation (ADMIN ONLY)
recommendationsRouter.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const recommendationId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      const partial = recommendationCreateUpdateSchema.partial().parse(req.body)

      const existing = await getDocument<CatalogRecommendationRule>('catalog_recommendations', recommendationId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Recommendation not found'
        })
      }

      const now = new Date().toISOString()
      await updateDocument('catalog_recommendations', recommendationId, {
        ...partial,
        updatedAt: now
      })

      const updated = await getDocument<CatalogRecommendationRule>('catalog_recommendations', recommendationId)
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

// DELETE /api/catalog/recommendations/:id - Delete recommendation (ADMIN ONLY)
recommendationsRouter.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const recommendationId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      await deleteDocument('catalog_recommendations', recommendationId)
      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
)
