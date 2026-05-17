import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { getDb } from '../services/firestore.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import type { ServiceabilityCheckRequest, ServiceabilityCheckResponse, ApiResponse } from '../contracts/canonical_contracts.js'

export const serviceabilityRouter = Router()

const COLLECTION = 'serviceable_areas'

interface ServiceableArea {
  areaCode: string
  areaName: string
  latitude: number
  longitude: number
  radiusKm: number
  estimatedTimeToService: string
  active: boolean
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchAllAreas(): Promise<ServiceableArea[]> {
  try {
    const db = getDb()
    const snap = await db.collection(COLLECTION).get()
    return snap.docs.map((doc) => {
      const d = doc.data() as ServiceableArea
      return { ...d, areaCode: doc.id }
    })
  } catch {
    return []
  }
}

/**
 * POST /serviceability/check - Check if location is serviceable
 */
serviceabilityRouter.post('/check', async (req, res) => {
  const schema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    serviceType: z.string().optional()
  })

  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request parameters' },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }

  try {
    const { latitude, longitude } = parsed.data
    const areas = await fetchAllAreas()

    for (const area of areas.filter(a => a.active !== false)) {
      const distance = haversineDistance(area.latitude, area.longitude, latitude, longitude)
      if (distance <= area.radiusKm) {
        return res.json({
          success: true,
          data: {
            isServiceable: true,
            message: `Service available in ${area.areaName}`,
            serviceArea: {
              areaCode: area.areaCode,
              areaName: area.areaName,
              estimatedTimeToService: area.estimatedTimeToService
            }
          },
          timestamp: new Date().toISOString()
        } as ApiResponse<ServiceabilityCheckResponse>)
      }
    }

    return res.status(400).json({
      success: true,
      data: {
        isServiceable: false,
        message: 'Sorry, we do not service this area yet. Please select a location in Patna city or nearby areas.'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<ServiceabilityCheckResponse>)
  } catch (error) {
    console.error('Serviceability check failed:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'SERVICEABILITY_CHECK_FAILED', message: 'Failed to check service availability' },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
})

/**
 * GET /serviceability/areas - Get all serviceable areas
 */
serviceabilityRouter.get('/areas', async (req: Request, res: Response) => {
  try {
    const areas = await fetchAllAreas()
    const activeOnly = req.query.active === 'true'
    const filtered = activeOnly ? areas.filter(a => a.active !== false) : areas
    return res.json({ success: true, data: filtered, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Failed to fetch areas:', error)
    return res.status(500).json({ success: false, error: 'Failed to retrieve service areas', timestamp: new Date().toISOString() })
  }
})

/**
 * POST /serviceability/areas - Add a new serviceable area
 */
serviceabilityRouter.post('/areas', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { areaCode, areaName, latitude, longitude, radiusKm, estimatedTimeToService } = req.body
    if (!areaCode || !areaName || latitude === undefined || longitude === undefined || !radiusKm) {
      return res.status(400).json({ success: false, error: 'areaCode, areaName, latitude, longitude, radiusKm are required' })
    }

    const db = getDb()
    const docRef = db.collection(COLLECTION).doc(areaCode)
    const snap = await docRef.get()
    if (snap.exists) {
      return res.status(409).json({ success: false, error: 'Area code already exists' })
    }

    const newArea: ServiceableArea = {
      areaCode,
      areaName,
      latitude,
      longitude,
      radiusKm,
      estimatedTimeToService: estimatedTimeToService || '2-4 hours',
      active: true
    }
    await docRef.set(newArea)
    return res.json({ success: true, data: newArea, message: 'Serviceable area added' })
  } catch (error) {
    console.error('Failed to add area:', error)
    return res.status(500).json({ success: false, error: 'Failed to add serviceable area' })
  }
})

/**
 * PATCH /serviceability/areas/:areaCode - Update a serviceable area
 */
serviceabilityRouter.patch('/areas/:areaCode', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const areaCode = String(req.params.areaCode)
    const db = getDb()
    const docRef = db.collection(COLLECTION).doc(areaCode)
    const snap = await docRef.get()

    if (!snap.exists) {
      return res.status(404).json({ success: false, error: 'Area not found' })
    }

    const allowed = ['areaName', 'latitude', 'longitude', 'radiusKm', 'estimatedTimeToService', 'active']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    if (Object.keys(updates).length > 0) {
      await docRef.update(updates)
    }

    const updated = await docRef.get()
    return res.json({ success: true, data: { areaCode, ...updated.data() }, message: 'Area updated' })
  } catch (error) {
    console.error('Failed to update area:', error)
    return res.status(500).json({ success: false, error: 'Failed to update serviceable area' })
  }
})

/**
 * DELETE /serviceability/areas/:areaCode - Remove a serviceable area
 */
serviceabilityRouter.delete('/areas/:areaCode', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const areaCode = String(req.params.areaCode)
    const db = getDb()
    const docRef = db.collection(COLLECTION).doc(areaCode)
    const snap = await docRef.get()

    if (!snap.exists) {
      return res.status(404).json({ success: false, error: 'Area not found' })
    }

    await docRef.delete()
    return res.json({ success: true, message: 'Area deleted' })
  } catch (error) {
    console.error('Failed to delete area:', error)
    return res.status(500).json({ success: false, error: 'Failed to delete serviceable area' })
  }
})
