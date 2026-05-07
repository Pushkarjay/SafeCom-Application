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
