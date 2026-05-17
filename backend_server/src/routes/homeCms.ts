/**
 * Home CMS Route
 *
 * Admin CRUD for managing home page content blocks (banners, promos, updates, etc.)
 * GET is public (for Flutter), POST/PATCH/DELETE are admin-only.
 */

import { Router, Request, Response } from 'express'
import { getDb } from '../services/firestore.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { FieldValue } from 'firebase-admin/firestore'

const CMS_COLLECTION = 'home_cms'

interface CmsBlock {
  id: string
  type: 'banner' | 'promo' | 'update' | 'category_grid' | 'featured'
  order: number
  visible: boolean
  title?: string
  subtitle?: string
  imageUrl?: string
  ctaLabel?: string
  ctaRoute?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export const homeCmsRouter = Router()

// ─── Public GET ──────────────────────────────────────────────
homeCmsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const db = getDb()
    const now = new Date().toISOString()

    // Fetch all visible, non-expired blocks ordered by `order`
    const snapshot = await db
      .collection(CMS_COLLECTION)
      .where('visible', '==', true)
      .orderBy('order', 'asc')
      .get()

    const blocks = snapshot.docs
      .map((doc) => {
        const data = doc.data() as CmsBlock
        return {
          id: doc.id,
          type: data.type,
          order: data.order,
          visible: data.visible,
          title: data.title,
          subtitle: data.subtitle,
          imageUrl: data.imageUrl,
          ctaLabel: data.ctaLabel,
          ctaRoute: data.ctaRoute,
          expiresAt: data.expiresAt,
        }
      })
      .filter((b) => !b.expiresAt || b.expiresAt > now)

    res.json({ success: true, data: { blocks }, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('[HOME-CMS] GET error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch CMS blocks' })
  }
})

// ─── Admin List ─────────────────────────────────
homeCmsRouter.get(
  '/admin',
  authenticateToken,
  requireRole(['admin']),
  async (_req: Request, res: Response) => {
    try {
      const db = getDb()
      const snapshot = await db.collection(CMS_COLLECTION).orderBy('order', 'asc').get()
      let blocks: (CmsBlock & { id: string })[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<CmsBlock, 'id'>),
      }))

      // Dedup: filter out CMS blocks whose content matches SDUI template components.
      // The defaultHomeLayout() in sduiService.ts already includes banner, promo_banner,
      // info_card, and announcements_list — CMS blocks with identical titles would duplicate them.
      const templateTitles = new Set<string>()
      try {
        const sduiDoc = await db.collection('sdui_layouts').doc('home').get()
        if (sduiDoc.exists) {
          const layout = (sduiDoc.data()?.layout || []) as any[]
          for (const c of layout) {
            const t = c.data?.title || c.data?.text || ''
            if (t) templateTitles.add(t.trim().toLowerCase())
          }
        }
      } catch { /* best-effort dedup */ }

      // Also add known default template titles as a safety net
      const KNOWN_TEMPLATE_TITLES = [
        'browse all products',
        'get 10% off on your first installation',
        'service not available in your area',
        'latest updates',
        'book a service',
        'current location',
      ]
      for (const t of KNOWN_TEMPLATE_TITLES) templateTitles.add(t)

      if (templateTitles.size > 0) {
        const before = blocks.length
        blocks = blocks.filter((b) => {
          const bt = (b.title || '').trim().toLowerCase()
          return !templateTitles.has(bt)
        })
        if (blocks.length < before) {
          console.log(`[HOME-CMS] Admin dedup: filtered ${before - blocks.length} duplicate block(s) matching template content`)
        }
      }

      res.json({ success: true, data: { blocks }, timestamp: new Date().toISOString() })
    } catch (error) {
      console.error('[HOME-CMS] GET admin error:', error)
      res.status(500).json({ success: false, error: 'Failed to fetch CMS blocks' })
    }
  }
)

// ─── Admin Create ─────────────────────────────────────────────
homeCmsRouter.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { type, order, visible, title, subtitle, imageUrl, ctaLabel, ctaRoute, expiresAt } = req.body

      if (!type) {
        return res.status(400).json({ success: false, error: 'type is required' })
      }

      const db = getDb()
      const now = new Date().toISOString()
      const docRef = db.collection(CMS_COLLECTION).doc()

      const block: Omit<CmsBlock, 'id'> = {
        type,
        order: order ?? 0,
        visible: visible ?? true,
        title: title || '',
        subtitle: subtitle || '',
        imageUrl: imageUrl || '',
        ctaLabel: ctaLabel || '',
        ctaRoute: ctaRoute || '',
        expiresAt: expiresAt || '',
        createdAt: now,
        updatedAt: now,
      }

      await docRef.set(block)
      res.json({ success: true, data: { id: docRef.id, ...block }, timestamp: now })
    } catch (error) {
      console.error('[HOME-CMS] POST error:', error)
      res.status(500).json({ success: false, error: 'Failed to create CMS block' })
    }
  }
)

// ─── Admin Update ─────────────────────────────────────────────
homeCmsRouter.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id)
      const { order, visible, title, subtitle, imageUrl, ctaLabel, ctaRoute, expiresAt } = req.body

      const db = getDb()
      const docRef = db.collection(CMS_COLLECTION).doc(id)
      const snap = await docRef.get()

      if (!snap.exists) {
        return res.status(404).json({ success: false, error: 'Block not found' })
      }

      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
      if (order !== undefined) updates.order = order
      if (visible !== undefined) updates.visible = visible
      if (title !== undefined) updates.title = title
      if (subtitle !== undefined) updates.subtitle = subtitle
      if (imageUrl !== undefined) updates.imageUrl = imageUrl
      if (ctaLabel !== undefined) updates.ctaLabel = ctaLabel
      if (ctaRoute !== undefined) updates.ctaRoute = ctaRoute
      if (expiresAt !== undefined) updates.expiresAt = expiresAt

      await docRef.update(updates)
      const updated = { ...snap.data(), id, ...updates }
      res.json({ success: true, data: updated, timestamp: new Date().toISOString() })
    } catch (error) {
      console.error('[HOME-CMS] PATCH error:', error)
      res.status(500).json({ success: false, error: 'Failed to update CMS block' })
    }
  }
)

// ─── Admin Delete ──────────────────────────────────────────────
homeCmsRouter.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id)
      const db = getDb()
      await db.collection(CMS_COLLECTION).doc(id).delete()
      res.json({ success: true, message: 'Block deleted', timestamp: new Date().toISOString() })
    } catch (error) {
      console.error('[HOME-CMS] DELETE error:', error)
      res.status(500).json({ success: false, error: 'Failed to delete CMS block' })
    }
  }
)