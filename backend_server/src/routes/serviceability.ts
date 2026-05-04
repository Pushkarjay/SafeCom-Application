import { Router } from 'express'
import { z } from 'zod'
import type { ServiceabilityCheckRequest, ServiceabilityCheckResponse, ApiResponse } from '../contracts/canonical_contracts.js'

export const serviceabilityRouter = Router()

/**
 * Service Coverage Areas
 * TODO: Move to database configuration
 */
const SERVICEABLE_AREAS = [
  {
    areaCode: 'PATNA_CORE',
    areaName: 'Patna City Core',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 5,
    estimatedTimeToService: '2-4 hours'
  },
  {
    areaCode: 'PATNA_METRO',
    areaName: 'Patna Metropolitan',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 15,
    estimatedTimeToService: '4-8 hours'
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

    // Find matching service area
    for (const area of SERVICEABLE_AREAS) {
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
serviceabilityRouter.get('/areas', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: SERVICEABLE_AREAS,
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
