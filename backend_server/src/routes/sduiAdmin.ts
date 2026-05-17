import { Router, Request, Response } from 'express';
import { getDb } from '../services/firestore.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const sduiAdminRouter = Router();

const COLLECTION = 'sdui_layouts';

// GET /api/catalog/sdui-admin/layouts
sduiAdminRouter.get('/layouts', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTION).get();
    const layouts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json({ success: true, data: layouts });
  } catch (error) {
    console.error('[SDUI-ADMIN] GET layouts error:', error);
    res.status(500).json({ success: false, error: 'Failed to load SDUI layouts' });
  }
});

// GET /api/catalog/sdui-admin/layouts/:id
sduiAdminRouter.get('/layouts/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const db = getDb();
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Layout not found' });
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load layout' });
  }
});

// POST /api/catalog/sdui-admin/layouts/:id
sduiAdminRouter.post('/layouts/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { layout, meta } = req.body;
    const db = getDb();
    await db.collection(COLLECTION).doc(id).set({
      layout,
      meta,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    res.json({ success: true, message: `Layout "${id}" updated` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save layout' });
  }
});

// GET /api/catalog/sdui-admin/feature-flags
sduiAdminRouter.get('/feature-flags', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('sdui_feature_flags').get();
    const flags = snapshot.docs.map(doc => ({
      key: doc.id,
      ...doc.data()
    }));
    res.json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load feature flags' });
  }
});

// POST /api/catalog/sdui-admin/layouts/:id/reset
sduiAdminRouter.post('/layouts/:id/reset', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    // Default template layout (matching sduiService defaultHomeLayout)
    const templateLayout = [
      { id: `${id}_location_header`, type: 'location_header', data: { showChangeButton: true } },
      { id: `${id}_spacer_1`, type: 'spacer', data: { height: 18 } },
      { id: `${id}_section_title`, type: 'section_title', data: { text: 'Book a Service' } },
      { id: `${id}_spacer_2`, type: 'spacer', data: { height: 12 } },
      { id: `${id}_service_grid`, type: 'service_grid', data: { columns: 3 } },
      { id: `${id}_spacer_3`, type: 'spacer', data: { height: 18 } },
      { id: `${id}_products_banner`, type: 'banner', data: { title: 'Browse All Products', subtitle: 'Explore our complete catalog with search & filters', gradientColors: ['#0A84FF', '#1E40AF'], icon: 'arrow_forward_rounded' }, action: { type: 'navigate', route: '/products-discovery' }, visibility: { featureFlag: 'show_products_discovery' } },
      { id: `${id}_spacer_4`, type: 'spacer', data: { height: 12 } },
      { id: `${id}_promo_banner`, type: 'promo_banner', data: { title: 'Get 10% OFF on your first installation', subtitle: 'Use code SAFECOM10 at checkout.', icon: 'local_offer_outlined', backgroundColor: '#111827' }, visibility: { featureFlag: 'show_promo_banner' } },
      { id: `${id}_not_serviceable_notice`, type: 'info_card', data: { title: 'Service not available in your area', subtitle: 'We currently serve Patna city and nearby areas. We\'re expanding soon!', icon: 'info_outline', backgroundColor: '#FEF2F2', textColor: '#991B1B' }, visibility: { requireServiceable: false } },
      { id: `${id}_spacer_5`, type: 'spacer', data: { height: 12 } },
      { id: `${id}_announcements`, type: 'announcements_list', data: {
          title: 'Latest Updates',
          maxItems: 3,
          items: [
            { title: 'Free Installation Consultation', body: 'Book a free site survey with our experts this weekend.', icon: 'engineering_outlined', color: '#8B5CF6' },
            { title: 'Expanded Service Areas', body: 'We now serve Danapur, Hajipur, and Bihta regions.', icon: 'map_outlined', color: '#10B981' },
            { title: 'Referral Program Live', body: 'Refer a friend and earn Rs 500 in service credits.', icon: 'card_giftcard_outlined', color: '#F59E0B' },
          ]
        }
      },
      { id: `${id}_spacer_6`, type: 'spacer', data: { height: 12 } },
    ];

    const db = getDb();
    const meta = { cacheSeconds: 300, fallbackScreen: `${id}_fallback`, version: Date.now() };

    await db.collection('sdui_layouts').doc(id).set({
      layout: templateLayout,
      meta,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: `Layout "${id}" reset to default template` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reset layout' });
  }
});

// POST /api/catalog/sdui-admin/feature-flags/:key
sduiAdminRouter.post('/feature-flags/:key', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const key = String(req.params.key);
    const { enabled, description } = req.body;
    const db = getDb();
    await db.collection('sdui_feature_flags').doc(key).set({
      enabled,
      description,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: `Flag "${key}" updated` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update flag' });
  }
});
