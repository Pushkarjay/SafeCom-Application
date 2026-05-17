/**
 * SDUI Route
 *
 * GET /api/sdui/layout?screen=home&lat=25.59&lng=85.13
 *
 * Returns a dynamic layout JSON that the Flutter client renders.
 * No authentication required — layouts are public content.
 */

import { Router } from 'express'
import { z } from 'zod'
import { getScreenLayout } from '../services/sduiService.js'
import { getDb } from '../services/firestore.js'
import type { ApiResponse } from '../contracts/canonical_contracts.js'
import type { SduiLayoutResponse } from '../contracts/sdui_contracts.js'

export const sduiRouter = Router()

/**
 * GET /layout - Get dynamic screen layout
 *
 * Query params:
 *   screen (required): Screen identifier (e.g., "home")
 *   lat (optional): User latitude for location-based personalization
 *   lng (optional): User longitude
 *   userId (optional): User ID for personalization (future)
 */
sduiRouter.get('/layout', async (req, res) => {
  const schema = z.object({
    screen: z.string().min(1).max(50),
    lat: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : undefined))
      .pipe(z.number().min(-90).max(90).optional()),
    lng: z
      .string()
      .optional()
      .transform((v) => (v ? parseFloat(v) : undefined))
      .pipe(z.number().min(-180).max(180).optional()),
    userId: z.string().optional(),
  })

  const parsed = schema.safeParse(req.query)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters. "screen" is required.',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse<never>)
  }

  try {
    const { screen, lat, lng, userId } = parsed.data
    const layout = await getScreenLayout(screen, lat, lng, userId)

    return res.json({
      success: true,
      data: layout,
      timestamp: new Date().toISOString(),
    } as ApiResponse<SduiLayoutResponse>)
  } catch (error) {
    console.error('SDUI layout fetch failed:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SDUI_LAYOUT_FAILED',
        message: 'Failed to fetch screen layout',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse<never>)
  }
})

/**
 * GET /screens - List all available SDUI screen identifiers
 */
sduiRouter.get('/screens', async (_req, res) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('sdui_layouts').select().get()
    const screens = snapshot.docs.map(doc => ({
      id: doc.id,
      name: `${doc.id.charAt(0).toUpperCase() + doc.id.slice(1)} Screen`,
      description: `Dynamic layout for ${doc.id} screen`,
    }))
    if (screens.length === 0) {
      screens.push({ id: 'home', name: 'Home Screen', description: 'Main landing page with service grid' })
    }
    return res.json({
      success: true,
      data: screens,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('SDUI screens list failed:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SDUI_SCREENS_FAILED',
        message: 'Failed to list SDUI screens',
      },
      timestamp: new Date().toISOString(),
    } as ApiResponse<never>)
  }
})
