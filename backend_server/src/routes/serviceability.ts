import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import type { ServiceabilityCheckRequest, ServiceabilityCheckResponse, ApiResponse } from '../contracts/canonical_contracts.js'

export const serviceabilityRouter = Router()

interface ServiceableArea {
  areaCode: string
  areaName: string
  latitude: number
  longitude: number
  radiusKm: number
  estimatedTimeToService: string
  active?: boolean
}

/**
 * In-memory store (Phase 1.3 — replace with Firestore in production)
 * TODO: Move to database configuration
 */
let SERVICEABLE_AREAS: ServiceableArea[] = [
  {
    areaCode: 'PATNA_CORE',
    areaName: 'Patna City Core',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 5,
    estimatedTimeToService: '2-4 hours',
    active: true
  },
  {
    areaCode: 'PATNA_METRO',
    areaName: 'Patna Metropolitan',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 15,
    estimatedTimeToService: '4-8 hours',
    active: true
  }
]

/**
 * Helper: Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * POST /serviceability/check - Check if location is serviceable
 * 
 * Request body:
 * {
 *   latitude: number,
 *   longitude: number,
 *   serviceType?: string  // Optional filter
 * }
 * 
 * Response: ServiceabilityCheckResponse
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
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }

  try {
    const { latitude, longitude } = parsed.data

    // Find matching active service area
    for (const area of SERVICEABLE_AREAS.filter(a => a.active !== false)) {
      const distance = calculateDistance(area.latitude, area.longitude, latitude, longitude)

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

    // No matching area found
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
      error: {
        code: 'SERVICEABILITY_CHECK_FAILED',
        message: 'Failed to check service availability'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<never>)
  }
})

/**
 * GET /serviceability/areas - Get all serviceable areas (admin only)
 */
serviceabilityRouter.get('/areas', async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active === 'true'
    const areas = activeOnly
      ? SERVICEABLE_AREAS.filter(a => a.active !== false)
      : SERVICEABLE_AREAS
    return res.json({
      success: true,
      data: areas,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch areas:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'AREAS_FETCH_FAILED',
        message: 'Failed to retrieve service areas'
      },
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * POST /serviceability/areas - Add a new serviceable area
 */
serviceabilityRouter.post('/areas', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { areaCode, areaName, latitude, longitude, radiusKm, estimatedTimeToService } = req.body as {
      areaCode: string
      areaName: string
      latitude: number
      longitude: number
      radiusKm: number
      estimatedTimeToService: string
    }

    if (!areaCode || !areaName || latitude === undefined || longitude === undefined || !radiusKm) {
      return res.status(400).json({ success: false, error: 'areaCode, areaName, latitude, longitude, radiusKm are required' })
    }

    if (SERVICEABLE_AREAS.some(a => a.areaCode === areaCode)) {
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

    SERVICEABLE_AREAS.push(newArea)
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
    const { areaCode } = req.params
    const idx = SERVICEABLE_AREAS.findIndex(a => a.areaCode === areaCode)

    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Area not found' })
    }

    const { areaName, latitude, longitude, radiusKm, estimatedTimeToService, active } = req.body as Partial<ServiceableArea>

    if (areaName !== undefined) SERVICEABLE_AREAS[idx].areaName = areaName
    if (latitude !== undefined) SERVICEABLE_AREAS[idx].latitude = latitude
    if (longitude !== undefined) SERVICEABLE_AREAS[idx].longitude = longitude
    if (radiusKm !== undefined) SERVICEABLE_AREAS[idx].radiusKm = radiusKm
    if (estimatedTimeToService !== undefined) SERVICEABLE_AREAS[idx].estimatedTimeToService = estimatedTimeToService
    if (active !== undefined) SERVICEABLE_AREAS[idx].active = active

    return res.json({ success: true, data: SERVICEABLE_AREAS[idx], message: 'Area updated' })
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
    const { areaCode } = req.params
    const idx = SERVICEABLE_AREAS.findIndex(a => a.areaCode === areaCode)

    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Area not found' })
    }

    SERVICEABLE_AREAS.splice(idx, 1)
    return res.json({ success: true, message: 'Area deleted' })
  } catch (error) {
    console.error('Failed to delete area:', error)
    return res.status(500).json({ success: false, error: 'Failed to delete serviceable area' })
  }
})
