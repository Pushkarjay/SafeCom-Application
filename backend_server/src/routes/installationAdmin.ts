import { Router, Request, Response } from 'express';
import { getDb } from '../services/firestore.js';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';

export const installationAdminRouter = Router();

// ─── Helpers ────────────────────────────────────────────────

function isDocumentReference(value: unknown): value is { id: string } {
  return Boolean(value && typeof value === 'object' && 'id' in (value as Record<string, unknown>));
}

function extractProductRef(option: Record<string, unknown>): { id: string } | null {
  if (isDocumentReference(option.Price)) return option.Price;
  for (const value of Object.values(option)) {
    if (isDocumentReference(value)) return value;
  }
  return null;
}

async function getProductMap(): Promise<Map<string, Record<string, unknown>>> {
  const db = getDb();
  const snapshot = await db.collection(PRODUCT_COLLECTION).get();
  const map = new Map<string, Record<string, unknown>>();
  snapshot.docs.forEach((doc) => map.set(doc.id, { id: doc.id, ...doc.data() }));
  return map;
}

// ─── GET /api/catalog/installation-admin ────────────────────
// Returns the full hierarchical config with ALL options per product slot
installationAdminRouter.get('/', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
    if (!doc.exists) {
      return res.json({ success: true, data: { categories: [] } });
    }

    const data = doc.data() || {};
    const productMap = await getProductMap();

    const categories = Object.entries(data).map(([categoryKey, setupsRaw]) => {
      const setups = setupsRaw as Record<string, unknown>;
      const setupEntries = Object.entries(setups).map(([setupKey, productsRaw]) => {
        const products = productsRaw as Record<string, unknown>;
        const productSlots = Object.entries(products).map(([productKey, optionsRaw]) => {
          const options = optionsRaw as Record<string, unknown>;
          const optionEntries = Object.entries(options).map(([optionKey, optionData]) => {
            const opt = optionData as Record<string, unknown>;
            const ref = extractProductRef(opt);
            const catalogProduct = ref ? productMap.get(ref.id) : null;
            return {
              key: optionKey,
              productId: ref?.id || '',
              productName: catalogProduct ? String(catalogProduct.name || '') : '',
              price: catalogProduct ? Number(catalogProduct.price || 0) : 0,
              category: catalogProduct ? String(catalogProduct.category || '') : '',
              defaultQty: Number(opt['Deafult q'] ?? 1),
              minQty: Number(opt['min q'] ?? 0),
              maxQty: Number(opt['max q'] ?? 999),
              available: opt.available !== false,
              rigid: opt.rigid === true
            };
          });
          return {
            key: productKey,
            options: optionEntries,
            isClubbed: optionEntries.length > 1
          };
        });
        return {
          key: setupKey,
          name: setupKey,
          products: productSlots
        };
      });
      return {
        key: categoryKey,
        name: categoryKey,
        setups: setupEntries
      };
    });

    res.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('[INSTALL-ADMIN] GET error:', error);
    res.status(500).json({ success: false, error: 'Failed to load installation config' });
  }
});

// ─── POST /category — Add a new category ───────────────────
installationAdminRouter.post('/category', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Category name is required' });

    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc('Installation');
    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};

    if (data[name]) return res.status(409).json({ success: false, error: 'Category already exists' });

    await docRef.set({ [name]: {} }, { merge: true });
    res.json({ success: true, message: `Category "${name}" created` });
  } catch (error) {
    console.error('[INSTALL-ADMIN] POST category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// ─── DELETE /category/:key — Delete a category ─────────────
installationAdminRouter.delete('/category/:key', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const categoryKey = req.params.key as string;
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc('Installation').update({
      [categoryKey]: FieldValue.delete()
    });
    res.json({ success: true, message: `Category "${categoryKey}" deleted` });
  } catch (error) {
    console.error('[INSTALL-ADMIN] DELETE category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

// ─── POST /category/:categoryKey/setup — Add a setup ───────
installationAdminRouter.post('/category/:categoryKey/setup', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { categoryKey } = req.params;
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Setup name is required' });

    const db = getDb();
    const path = `${categoryKey}.${name}`;
    await db.collection(SERVICE_COLLECTION).doc('Installation').update({
      [path]: {}
    });
    res.json({ success: true, message: `Setup "${name}" created in "${categoryKey}"` });
  } catch (error) {
    console.error('[INSTALL-ADMIN] POST setup error:', error);
    res.status(500).json({ success: false, error: 'Failed to create setup' });
  }
});

// ─── DELETE /category/:categoryKey/setup/:setupKey — Delete a setup
installationAdminRouter.delete('/category/:categoryKey/setup/:setupKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { categoryKey, setupKey } = req.params;
    const db = getDb();
    const path = `${categoryKey}.${setupKey}`;
    await db.collection(SERVICE_COLLECTION).doc('Installation').update({
      [path]: FieldValue.delete()
    });
    res.json({ success: true, message: `Setup "${setupKey}" deleted from "${categoryKey}"` });
  } catch (error) {
    console.error('[INSTALL-ADMIN] DELETE setup error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete setup' });
  }
});

// ─── POST /category/:cat/setup/:setup/product — Add a product mapping
installationAdminRouter.post('/category/:categoryKey/setup/:setupKey/product', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { categoryKey, setupKey } = req.params;
    const { productId, defaultQty, minQty, maxQty } = req.body as {
      productId?: string; defaultQty?: number; minQty?: number; maxQty?: number;
    };

    if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID is required' });

    const db = getDb();

    // Verify product exists in catalog
    const productDoc = await db.collection(PRODUCT_COLLECTION).doc(productId).get();
    if (!productDoc.exists) return res.status(404).json({ success: false, error: `Product ${productId} not found in catalog` });

    // Find next available Product N slot
    const installDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
    const installData = installDoc.exists ? installDoc.data() || {} : {};
    const catData = installData[categoryKey as string] as Record<string, unknown> | undefined;
    const setupData = (catData?.[setupKey as string] as Record<string, unknown>) || {};
    
    // Count existing product slots to determine next number
    const existingKeys = Object.keys(setupData);
    const nextNum = existingKeys.length + 1;
    const productKey = `Product ${nextNum}`;
    const optionKey = `${productKey} Option 1`;

    const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const optionData = {
      'Deafult q': defaultQty ?? 1,
      'Price': productRef,
      [`${optionKey} ID`]: productRef,
      'available': true,
      'max q': maxQty ?? 50,
      'min q': minQty ?? 0,
      'rigid': false
    };

    const path = `${categoryKey}.${setupKey}.${productKey}.${optionKey}`;
    await db.collection(SERVICE_COLLECTION).doc('Installation').update({
      [path]: optionData
    });

    res.json({ success: true, message: `Product ${productId} added as "${productKey}"`, productKey, optionKey });
  } catch (error) {
    console.error('[INSTALL-ADMIN] POST product error:', error);
    res.status(500).json({ success: false, error: 'Failed to add product' });
  }
});

// ─── DELETE /category/:cat/setup/:setup/product/:productKey — Delete product slot
installationAdminRouter.delete('/category/:categoryKey/setup/:setupKey/product/:productKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { categoryKey, setupKey, productKey } = req.params;
    const db = getDb();
    const path = `${categoryKey}.${setupKey}.${productKey}`;
    await db.collection(SERVICE_COLLECTION).doc('Installation').update({
      [path]: FieldValue.delete()
    });
    res.json({ success: true, message: `Product slot "${productKey}" removed` });
  } catch (error) {
    console.error('[INSTALL-ADMIN] DELETE product error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// ─── POST /…/product/:productKey/option — Club: add another option
installationAdminRouter.post(
  '/category/:categoryKey/setup/:setupKey/product/:productKey/option',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey, productKey } = req.params;
      const { productId, defaultQty, minQty, maxQty } = req.body as {
        productId?: string; defaultQty?: number; minQty?: number; maxQty?: number;
      };

      if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID is required' });

      const db = getDb();

      // Verify product exists
      const productDoc = await db.collection(PRODUCT_COLLECTION).doc(productId).get();
      if (!productDoc.exists) return res.status(404).json({ success: false, error: `Product ${productId} not found` });

      // Find next option number
      const installDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
      const installData = installDoc.exists ? installDoc.data() || {} : {};
      const catData2 = installData[categoryKey as string] as Record<string, unknown> | undefined;
      const setupData2 = catData2?.[setupKey as string] as Record<string, unknown> | undefined;
      const productSlot = (setupData2?.[productKey as string] as Record<string, unknown>) || {};
      const optionCount = Object.keys(productSlot).length;
      const nextOptionNum = optionCount + 1;
      const optionKey = `${productKey} Option ${nextOptionNum}`;

      const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
      const optionData = {
        'Deafult q': defaultQty ?? 1,
        'Price': productRef,
        [`${optionKey} ID`]: productRef,
        'available': true,
        'max q': maxQty ?? 50,
        'min q': minQty ?? 0,
        'rigid': false
      };

      const path = `${categoryKey}.${setupKey}.${productKey}.${optionKey}`;
      await db.collection(SERVICE_COLLECTION).doc('Installation').update({
        [path]: optionData
      });

      res.json({ success: true, message: `Option "${optionKey}" added (clubbed under "${productKey}")`, optionKey });
    } catch (error) {
      console.error('[INSTALL-ADMIN] POST club-option error:', error);
      res.status(500).json({ success: false, error: 'Failed to add club option' });
    }
  }
);

// ─── DELETE /…/product/:productKey/option/:optionKey — Remove a club option
installationAdminRouter.delete(
  '/category/:categoryKey/setup/:setupKey/product/:productKey/option/:optionKey',
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey, productKey, optionKey } = req.params;
      const db = getDb();
      const path = `${categoryKey}.${setupKey}.${productKey}.${optionKey}`;
      await db.collection(SERVICE_COLLECTION).doc('Installation').update({
        [path]: FieldValue.delete()
      });
      res.json({ success: true, message: `Option "${optionKey}" removed from "${productKey}"` });
    } catch (error) {
      console.error('[INSTALL-ADMIN] DELETE club-option error:', error);
      res.status(500).json({ success: false, error: 'Failed to remove club option' });
    }
  }
);

// ─── PATCH /…/option/:optionKey/quantities — Update min, max, default quantities
installationAdminRouter.patch(
  '/category/:categoryKey/setup/:setupKey/product/:productKey/option/:optionKey/quantities',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey, productKey, optionKey } = req.params;
      const { defaultQty, minQty, maxQty } = req.body as { defaultQty?: number; minQty?: number; maxQty?: number };
      const db = getDb();
      const updates: Record<string, unknown> = {};
      if (defaultQty !== undefined) updates[`${categoryKey}.${setupKey}.${productKey}.${optionKey}.Deafult q`] = defaultQty;
      if (minQty !== undefined) updates[`${categoryKey}.${setupKey}.${productKey}.${optionKey}.min q`] = minQty;
      if (maxQty !== undefined) updates[`${categoryKey}.${setupKey}.${productKey}.${optionKey}.max q`] = maxQty;
      
      if (Object.keys(updates).length > 0) {
        await db.collection(SERVICE_COLLECTION).doc('Installation').update(updates);
      }
      res.json({ success: true, message: `Quantities updated for "${optionKey}"` });
    } catch (error) {
      console.error('[INSTALL-ADMIN] PATCH quantities error:', error);
      res.status(500).json({ success: false, error: 'Failed to update quantities' });
    }
  }
);

// ─── POST /…/setup/:setupKey/club-existing — Club already mapped products together
installationAdminRouter.post(
  '/category/:categoryKey/setup/:setupKey/club-existing',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey } = req.params;
      const { productKeys } = req.body as { productKeys: string[] };

      if (!productKeys || productKeys.length < 2) {
        return res.status(400).json({ success: false, error: 'At least two products must be selected to club.' });
      }

      const db = getDb();
      const installDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
      const installData = installDoc.exists ? installDoc.data() || {} : {};
      
      const catData = installData[categoryKey as string] as Record<string, unknown> | undefined;
      const setupData = (catData?.[setupKey as string] as Record<string, unknown>) || {};

      // 1. Extract existing options
      const optionsToClub: any[] = [];
      for (const pk of productKeys) {
        const slotData = setupData[pk] as Record<string, unknown>;
        if (slotData) {
          // just grab the first option from each product slot, as we're combining top-level ones
          const optionKeys = Object.keys(slotData);
          if (optionKeys.length > 0) {
             optionsToClub.push(slotData[optionKeys[0]]);
          }
        }
      }

      if (optionsToClub.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid options found for selected products.' });
      }

      // 2. Find next available Product N slot
      const existingKeys = Object.keys(setupData);
      const nextNum = existingKeys.length + 1; // Not perfectly safe if deleted, but sufficient for visual builder
      let newProductKey = `Product ${nextNum}`;
      while (existingKeys.includes(newProductKey)) {
        newProductKey = `Product ${parseInt(newProductKey.split(' ')[1]) + 1}`;
      }

      // 3. Prepare batched updates
      const updates: Record<string, unknown> = {};
      
      // Add new clubbed options
      optionsToClub.forEach((optData, idx) => {
        const newOptKey = `${newProductKey} Option ${idx + 1}`;
        
        // Make sure to update the key name reference inside the object if it exists
        const newOptData = { ...optData };
        // Delete old ID key reference
        const oldIdKey = Object.keys(newOptData).find(k => k.endsWith(' ID'));
        if (oldIdKey) {
            newOptData[`${newOptKey} ID`] = newOptData[oldIdKey];
            delete newOptData[oldIdKey];
        }

        updates[`${categoryKey}.${setupKey}.${newProductKey}.${newOptKey}`] = newOptData;
      });

      // Delete old product slots
      for (const pk of productKeys) {
        updates[`${categoryKey}.${setupKey}.${pk}`] = FieldValue.delete();
      }

      await db.collection(SERVICE_COLLECTION).doc('Installation').update(updates);

      res.json({ success: true, message: `Successfully clubbed products into "${newProductKey}"` });
    } catch (error) {
      console.error('[INSTALL-ADMIN] POST club-existing error:', error);
      res.status(500).json({ success: false, error: 'Failed to club existing products' });
    }
  }
);

// ─── PATCH /products/:productId/price — Update price in master catalog
installationAdminRouter.patch('/products/:productId/price', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { price } = req.body as { price?: number };
    if (price === undefined || price < 0) return res.status(400).json({ success: false, error: 'Invalid price' });

    const db = getDb();
    await db.collection(PRODUCT_COLLECTION).doc(productId as string).update({ price });
    
    res.json({ success: true, message: `Price updated for product ${productId}` });
  } catch (error) {
    console.error('[INSTALL-ADMIN] PATCH product price error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product price' });
  }
});

// ─── GET /products — Search master catalog products ─────────
installationAdminRouter.get('/products', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const productMap = await getProductMap();
    let products = Array.from(productMap.values()).map((p) => ({
      id: String(p.id || ''),
      name: String(p.name || ''),
      category: String(p.category || ''),
      group: String(p.group || ''),
      price: Number(p.price || 0),
      status: String(p.status || 'active')
    }));

    if (q) {
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('[INSTALL-ADMIN] GET products error:', error);
    res.status(500).json({ success: false, error: 'Failed to search products' });
  }
});
