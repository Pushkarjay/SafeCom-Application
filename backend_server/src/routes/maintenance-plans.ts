import express, { Request, Response } from 'express'
import { z } from 'zod'
import { getDb } from '../services/firestore.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import type {
  MaintenancePlan,
  MaintenancePlanItem,
  CreateUpdateMaintenancePlanRequest
} from '../contracts/canonical_contracts.js'
import { DocumentSnapshot, Query, QueryDocumentSnapshot } from 'firebase-admin/firestore'

export const maintenancePlansRouter = express.Router()

// Validation schema
const maintenancePlanItemSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  lineTotal: z.number().positive()
})

const createUpdatePlanSchema = z.object({
  planName: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  planItems: z.array(maintenancePlanItemSchema).min(1),
  basePrice: z.number().positive(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'semi-annual', 'annual']),
  durationMonths: z.number().int().positive(),
  renewalPrice: z.number().positive().optional(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean().optional(),
  imageUrl: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  displayPriority: z.number().int().nonnegative().optional()
})

// GET /api/catalog/maintenance-plans - Get all maintenance plans with filtering
maintenancePlansRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDb()
    const { category, featured, frequency, page = '1', pageSize = '20' } = req.query

    const pageNum = parseInt(page as string) || 1
    const pageSizeNum = parseInt(pageSize as string) || 20
    const skip = (pageNum - 1) * pageSizeNum

    let query: Query = db.collection('catalog_maintenance_plans')

    // Apply filters
    if (category && category !== 'all') {
      query = query.where('category', '==', category as string)
    }
    if (featured === 'true') {
      query = query.where('isFeatured', '==', true)
    }
    if (frequency) {
      query = query.where('frequency', '==', frequency as string)
    }

    // Order by priority and name
    query = query.orderBy('displayPriority', 'asc').orderBy('planName', 'asc')

    const snapshot = await query.get()
    const total = snapshot.size

    // Memory-based pagination (free tier Firestore limitation)
    const plans: MaintenancePlan[] = []
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      plans.push({
        planId: doc.id,
        ...data
      } as MaintenancePlan)
    })

    const paginatedPlans = plans.slice(skip, skip + pageSizeNum)

    res.json({
      success: true,
      data: {
        plans: paginatedPlans,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore: skip + pageSizeNum < total
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance plans',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/catalog/maintenance-plans/frequency/:frequency - Filter by frequency
maintenancePlansRouter.get('/frequency/:frequency', async (req: Request, res: Response) => {
  try {
    const { frequency } = req.params
    const db = getDb()

    const query = db
      .collection('catalog_maintenance_plans')
      .where('frequency', '==', frequency)
      .orderBy('displayPriority', 'asc')

    const snapshot = await query.get()
    const plans: MaintenancePlan[] = []

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      plans.push({
        planId: doc.id,
        ...data
      } as MaintenancePlan)
    })

    res.json({
      success: true,
      data: { plans }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance plans by frequency',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/catalog/maintenance-plans/:id - Get single maintenance plan
maintenancePlansRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const db = getDb()

    const doc: DocumentSnapshot = await db.collection('catalog_maintenance_plans').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance plan not found'
      })
    }

    const data = doc.data() as unknown as Record<string, unknown>
    res.json({
      success: true,
      data: {
        planId: doc.id,
        ...data
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance plan',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/catalog/maintenance-plans - Create maintenance plan (admin only)
maintenancePlansRouter.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const validated = createUpdatePlanSchema.parse(req.body)
      const db = getDb()

      const docRef = await db.collection('catalog_maintenance_plans').add({
        ...validated,
        taxRate: validated.taxRate || 18,
        displayPriority: validated.displayPriority || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as unknown as Record<string, unknown>)

      res.status(201).json({
        success: true,
        message: 'Maintenance plan created',
        data: { planId: docRef.id }
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create maintenance plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// PATCH /api/catalog/maintenance-plans/:id - Update maintenance plan (admin only)
maintenancePlansRouter.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const db = getDb()

      // Verify document exists
      const doc: DocumentSnapshot = await db.collection('catalog_maintenance_plans').doc(id).get()
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance plan not found'
        })
      }

      // Validate only provided fields
      const partialSchema = createUpdatePlanSchema.partial()
      const validated = partialSchema.parse(req.body)

      await db.collection('catalog_maintenance_plans').doc(id).update({
        ...validated,
        updatedAt: new Date().toISOString()
      } as unknown as Record<string, unknown>)

      res.json({
        success: true,
        message: 'Maintenance plan updated'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        })
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update maintenance plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// DELETE /api/catalog/maintenance-plans/:id - Delete maintenance plan (admin only)
maintenancePlansRouter.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string
      const db = getDb()

      // Verify exists first
      const doc: DocumentSnapshot = await db.collection('catalog_maintenance_plans').doc(id).get()
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance plan not found'
        })
      }

      await db.collection('catalog_maintenance_plans').doc(id).delete()

      res.json({
        success: true,
        message: 'Maintenance plan deleted'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintenance plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// GET /api/catalog/maintenance-plans/frequency/:frequency - Filter by frequency
maintenancePlansRouter.get('/frequency/:frequency', async (req: Request, res: Response) => {
  try {
    const { frequency } = req.params
    const db = getDb()

    const query = db
      .collection('catalog_maintenance_plans')
      .where('frequency', '==', frequency)
      .orderBy('displayPriority', 'asc')

    const snapshot = await query.get()
    const plans: MaintenancePlan[] = []

    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as unknown as Record<string, unknown>
      plans.push({
        planId: doc.id,
        ...data
      } as MaintenancePlan)
    })

    res.json({
      success: true,
      data: { plans }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance plans by frequency',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})
