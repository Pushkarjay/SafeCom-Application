import { Router, Request, Response } from 'express';
import { getDb } from '../services/firestore.js';
import { FieldValue, DocumentSnapshot } from 'firebase-admin/firestore';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';

export const servicesAdminRouter = Router();

// ─── Helpers ────────────────────────────────────────────────

function safeKey(s: string): string {
  return s.replace(/[\/#?&=%+]+/g, '-').replace(/\s+/g, ' ').trim();
}

function uniqueKey(base: string, existing: Record<string, unknown>): string {
  if (!(base in existing)) return base;
  let counter = 2;
  while (`${base}-${counter}` in existing) counter++;
  return `${base}-${counter}`;
}

function isDocumentReference(value: unknown): value is { id: string } {
  return Boolean(value && typeof value === 'object' && 'id' in (value as Record<string, unknown>));
}

function extractProductRef(
  option: Record<string, unknown>,
  productMap: Map<string, ProductData>
): { id: string } | null {
  // 1. Explicit Reference in "Price" field
  if (isDocumentReference(option.Price)) return option.Price as { id: string };

  // 2. String ID in "Price" field
  if (typeof option.Price === 'string' && productMap.has(option.Price)) {
    return { id: option.Price };
  }

  // 3. Scan for keys ending in " ID" (common in legacy schema)
  for (const [k, v] of Object.entries(option)) {
    if (k.toLowerCase().endsWith(' id')) {
      if (isDocumentReference(v)) return v as { id: string };
      if (typeof v === 'string' && productMap.has(v)) return { id: v };
    }
  }

  // 4. Fallback: scan all values for any reference or known string ID
  for (const value of Object.values(option)) {
    if (isDocumentReference(value)) return value as { id: string };
    if (typeof value === 'string' && productMap.has(value)) return { id: value };
  }
  
  return null;
}

interface ProductData {
  id: string;
  name?: string;
  productName?: string;
  price?: number;
  basePrice?: number;
  category?: string;
  group?: string;
  status?: string;
}

async function getProductMap(): Promise<Map<string, ProductData>> {
  const db = getDb();
  const snapshot = await db.collection(PRODUCT_COLLECTION).get();
  const map = new Map<string, ProductData>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown> | undefined;
    map.set(doc.id, { id: doc.id, ...(data ?? {}) } as ProductData);
  });
  return map;
}

const ACTIVE_META_KEY = '_isActive';
const ORDER_META_KEY = '_order';

function sortByOrder(entries: [string, unknown][]): [string, unknown][] {
  return entries.sort((a, b) => {
    const aVal = a[1] as Record<string, unknown> | undefined;
    const bVal = b[1] as Record<string, unknown> | undefined;
    const aOrder = (aVal && typeof aVal === 'object') ? Number((aVal as any)[ORDER_META_KEY] ?? Infinity) : Infinity;
    const bOrder = (bVal && typeof bVal === 'object') ? Number((bVal as any)[ORDER_META_KEY] ?? Infinity) : Infinity;
    return aOrder - bOrder;
  });
}

function isLeafNode(obj: Record<string, unknown>): boolean {
  return (
    obj.hasOwnProperty('Price') ||
    obj.hasOwnProperty('Deafult q') ||
    obj.hasOwnProperty('available') ||
    obj.hasOwnProperty('rigid')
  );
}

interface TreeNode {
  key: string;
  isLeaf: boolean;
  isField?: boolean;
  fieldType?: 'string' | 'number' | 'boolean' | 'reference' | 'map';
  fieldValue?: any;
  productId: string;
  productName: string;
  price: number;
  category: string;
  defaultQty: number;
  minQty: number;
  maxQty: number;
  available: boolean;
  rigid: boolean;
  children: TreeNode[];
  renderType?: 'option' | 'list';
  selectionType?: 'single' | 'multi';
  collectiveValidation?: boolean;
  displayLabel?: string;
  mandatory?: boolean;
  dependsOn?: string | null;
}

function extractTree(
  slot: Record<string, unknown>,
  productMap: Map<string, ProductData>
): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const [key, value] of Object.entries(slot)) {
    if (value === null || value === undefined) continue;
    if (key === ACTIVE_META_KEY) continue; // skip active metadata

    if (typeof value !== 'object') {
      if (key === ORDER_META_KEY) continue; // skip order metadata
      nodes.push({
        key,
        isLeaf: false,
        isField: true,
        fieldType: typeof value as any,
        fieldValue: value,
        productId: '',
        productName: key,
        price: 0,
        category: '',
        defaultQty: 1,
        minQty: 0,
        maxQty: 999,
        available: true,
        rigid: false,
        children: []
      });
      continue;
    }

    if (isDocumentReference(value)) {
      nodes.push({
        key,
        isLeaf: false,
        isField: true,
        fieldType: 'reference',
        fieldValue: value.id,
        productId: '',
        productName: key,
        price: 0,
        category: '',
        defaultQty: 1,
        minQty: 0,
        maxQty: 999,
        available: true,
        rigid: false,
        children: []
      });
      continue;
    }

    const obj = value as Record<string, unknown>;

    if (isLeafNode(obj)) {
      const ref = extractProductRef(obj, productMap);
      const catalogProduct = ref ? productMap.get(ref.id) : null;
      nodes.push({
        key,
        isLeaf: true,
        productId: ref?.id || '',
        productName: catalogProduct ? String(catalogProduct.name || catalogProduct.productName || '') : key,
        price: catalogProduct ? Number(catalogProduct.price || catalogProduct.basePrice || 0) : 0,
        category: catalogProduct ? String(catalogProduct.category || '') : '',
        defaultQty: Number(obj['Deafult q'] ?? 1),
        minQty: Number(obj['min q'] ?? 0),
        maxQty: Number(obj['max q'] ?? 999),
        available: obj.available !== false,
        rigid: obj.rigid === true,
        children: [],
        renderType: (obj.renderType as 'option' | 'list' | undefined) ?? 'option',
        selectionType: (obj.selectionType as 'single' | 'multi' | undefined),
        collectiveValidation: obj.collectiveValidation === true,
        displayLabel: obj.displayLabel ? String(obj.displayLabel) : undefined,
        mandatory: obj.mandatory !== false,
        dependsOn: obj.dependsOn ? String(obj.dependsOn) : undefined,
        _order: Number(obj[ORDER_META_KEY] ?? Infinity),
      } as any);
    } else {
      const children = extractTree(obj, productMap);
      // Flatten: if a branch wraps exactly one leaf product, merge to skip the wrapper
      if (children.length === 1 && children[0].isLeaf && children[0].productId) {
        nodes.push({ ...children[0], key });
      } else {
        nodes.push({
          key,
          isLeaf: false,
          isField: false,
          fieldType: 'map',
          productId: '',
          productName: key,
          price: 0,
          category: '',
          defaultQty: 1,
          minQty: 0,
          maxQty: 999,
          available: true,
          rigid: false,
          children,
          renderType: (obj.renderType as 'option' | 'list' | undefined) ?? 'option',
          selectionType: (obj.selectionType as 'single' | 'multi' | undefined),
          collectiveValidation: obj.collectiveValidation === true,
          displayLabel: obj.displayLabel ? String(obj.displayLabel) : undefined,
          mandatory: obj.mandatory !== false,
          dependsOn: obj.dependsOn ? String(obj.dependsOn) : undefined,
          _order: Number(obj[ORDER_META_KEY] ?? Infinity),
        } as any);
      }
    }
  }
  return nodes;
}

/**
 * Build a deep nested object for use with set({ merge: true }).
 * Unlike dot-notation update(), this preserves literal dots in keys.
 * e.g., setNested(["a", "b.c", "d"], "v") => { a: { "b.c": { d: "v" } } }
 * Call as: docRef.set(setNested([fullPath...], value), { merge: true })
 */
function setNested(path: string[], value: unknown): Record<string, unknown> {
  const [head, ...tail] = path;
  if (tail.length === 0) return { [head]: value };
  return { [head]: setNested(tail, value) };
}

/**
 * Delete a field at a nested path, handling special characters in key names.
 * Reads the full doc, removes the key from memory, writes back with set().
 */
async function deleteNested(
  docRef: FirebaseFirestore.DocumentReference,
  path: string[],
  transaction?: FirebaseFirestore.Transaction
): Promise<void> {
  const db = getDb();
  await db.runTransaction(async (txn) => {
    const snap = await txn.get(docRef);
    if (!snap.exists) return;
    const data = snap.data()!;
    let current: any = data;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    delete current[path[path.length - 1]];
    txn.set(docRef, data);
  });
}

// ─── ROUTES ─────────────────────────────────────────────────

// PATCH /:serviceId/meta — Update service metadata (title, icon, enabled)
servicesAdminRouter.patch('/:serviceId/meta', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const { title, icon, enabled } = req.body as { title?: string; icon?: string; enabled?: boolean };

    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Service not found' });

    const updates: Record<string, unknown> = {};
    const existingData = doc.data() || {};
    const existingMeta = (existingData._meta || {}) as Record<string, unknown>;

    if (title !== undefined) updates['_meta.title'] = title;
    if (icon !== undefined) updates['_meta.icon'] = icon;
    if (enabled !== undefined) updates['_meta.enabled'] = enabled;
    updates['_meta.updatedAt'] = new Date().toISOString();

    if (Object.keys(updates).length > 0) {
      await docRef.update(updates);
    }

    res.json({ success: true, message: `Service "${serviceId}" metadata updated` });
  } catch (error) {
    console.error('[SERVICES-ADMIN] PATCH meta error:', error);
    res.status(500).json({ success: false, error: 'Failed to update service metadata' });
  }
});

// GET /list — List all available services in the Services collection
servicesAdminRouter.get('/list', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(SERVICE_COLLECTION).get();
    const services = snapshot.docs.map(doc => {
      const data = doc.data() || {};
      const meta = (data._meta || {}) as Record<string, unknown>;
      return {
        id: doc.id,
        title: meta.title || doc.id,
        icon: meta.icon || '🔧',
        enabled: meta.enabled !== false,
        updatedAt: meta.updatedAt || null
      };
    });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('[SERVICES-ADMIN] GET list error:', error);
    res.status(500).json({ success: false, error: 'Failed to load services list' });
  }
});

// POST /create — Create a new service document
servicesAdminRouter.post('/create', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id, title, icon } = req.body as { id: string, title?: string, icon?: string };
    if (!id?.trim()) return res.status(400).json({ success: false, error: 'Service ID is required' });

    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (doc.exists) return res.status(409).json({ success: false, error: 'Service ID already exists' });

    await docRef.set({
      _meta: {
        title: title || id,
        icon: icon || '🔧',
        createdAt: new Date().toISOString()
      }
    });
    res.json({ success: true, message: `Service "${id}" created` });
  } catch (error) {
    console.error('[SERVICES-ADMIN] POST create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

/**
 * Look up a service document by ID, case-insensitively.
 * First tries exact match, then scans all docs for a case-insensitive match.
 */
async function findServiceDoc(serviceId: string): Promise<{ doc: FirebaseFirestore.DocumentSnapshot | null; actualId: string }> {
  const db = getDb();
  const exact = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
  if (exact.exists) return { doc: exact, actualId: serviceId };

  const snapshot = await db.collection(SERVICE_COLLECTION).get();
  for (const doc of snapshot.docs) {
    if (doc.id.toLowerCase() === serviceId.toLowerCase()) {
      return { doc, actualId: doc.id };
    }
  }
  return { doc: null, actualId: serviceId };
}

// GET /config/:serviceId — Get full tree for a service
servicesAdminRouter.get('/config/:serviceId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const { doc, actualId } = await findServiceDoc(serviceId);
    if (!doc || !doc.exists) return res.status(404).json({ success: false, error: 'Service not found' });

    const data = doc.data() || {};
    // Remove metadata from the tree view
    delete data._meta;

    const productMap = await getProductMap();

    const categories = sortByOrder(Object.entries(data)
      .filter(([categoryKey]) => {
        if (categoryKey.startsWith('_')) return false;
        return true;
      }))
      .map(([categoryKey, setupsRaw]) => {
        const setups = setupsRaw as Record<string, unknown>;
        const catOrder = Number(setups?.[ORDER_META_KEY] ?? Infinity);
        const setupEntries = sortByOrder(Object.entries(setups)
          .filter(([setupKey]) => setupKey !== ACTIVE_META_KEY && setupKey !== ORDER_META_KEY))
          .map(([setupKey, productsRaw]) => {
            const products = productsRaw as Record<string, unknown>;
            const isActive = products[ACTIVE_META_KEY] !== false;
            const setupOrder = Number(products?.[ORDER_META_KEY] ?? Infinity);
            const productSlots = sortByOrder(Object.entries(products)
              .filter(([productKey]) => productKey !== ACTIVE_META_KEY && productKey !== ORDER_META_KEY))
              .map(([productKey, optionsRaw]) => {
                const options = optionsRaw as Record<string, unknown>;
                const prodOrder = Number(options?.[ORDER_META_KEY] ?? Infinity);
                const tree = extractTree(options, productMap);
                return {
                  key: productKey,
                  options: tree,
                  isClubbed: tree.length > 1 || tree.length === 0,
                  order: prodOrder
                };
              });
            return { key: setupKey, name: setupKey, products: productSlots, active: isActive, order: setupOrder };
          });
        const catActive = (setups as Record<string, unknown>)[ACTIVE_META_KEY] !== false;
        return { key: categoryKey, name: categoryKey, setups: setupEntries, active: catActive, order: catOrder };
      });

    res.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('[SERVICES-ADMIN] GET config error:', error);
    res.status(500).json({ success: false, error: 'Failed to load service configuration' });
  }
});

// DELETE /config/:serviceId — Delete a whole service
servicesAdminRouter.delete('/config/:serviceId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const { doc, actualId } = await findServiceDoc(serviceId);
    if (!doc || !doc.exists) return res.status(404).json({ success: false, error: 'Service not found' });
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(actualId).delete();
    res.json({ success: true, message: `Service "${actualId}" deleted` });
  } catch (error) {
    console.error('[SERVICES-ADMIN] DELETE service error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete service' });
  }
});

// ─── Nested Mutations (Generic for any serviceId) ────────────

// POST /config/:serviceId/category
servicesAdminRouter.post('/config/:serviceId/category', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Category name required' });
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(serviceId).set({ [name]: {} }, { merge: true });
    res.json({ success: true, message: `Category "${name}" created` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// DELETE /config/:serviceId/category/:key
servicesAdminRouter.delete('/config/:serviceId/category/:key', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const key = String(req.params.key);
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    if (key.includes('.')) {
      await deleteNested(docRef, [key]);
    } else {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) throw new Error('Service not found');
        const data = doc.data()!;
        if (!data[key]) throw new Error('Category not found');
        delete data[key];
        transaction.set(docRef, data);
      });
    }
    res.json({ success: true, message: `Category "${key}" deleted` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE category error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Setup name required' });
    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);

    if ([categoryKey, name].some(s => s.includes('.'))) {
      await serviceRef.set(setNested([categoryKey, name], {}), { merge: true });
    } else {
      await serviceRef.update({ [`${categoryKey}.${name}`]: {} });
    }
    res.json({ success: true, message: `Setup "${name}" created` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST setup error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to create setup' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/setup/:setupKey — Delete a setup
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/setup/:setupKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    await deleteNested(docRef, [categoryKey, setupKey]);
    res.json({ success: true, message: `Setup "${setupKey}" deleted from category "${categoryKey}"` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE setup error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to delete setup' });
  }
});

// POST /config/:serviceId/category/:categoryKey/product — Add product slot directly under category
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/product', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { productId, defaultQty, minQty, maxQty } = req.body as {
      productId?: string; defaultQty?: number; minQty?: number; maxQty?: number;
    };
    if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID is required' });
    const db = getDb();
    const productDoc = await db.collection(PRODUCT_COLLECTION).doc(productId).get();
    if (!productDoc.exists) return res.status(404).json({ success: false, error: `Product ${productId} not found in catalog` });
    const serviceDoc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    const serviceData = serviceDoc.exists ? serviceDoc.data() || {} : {};
    const catData = serviceData[categoryKey] as Record<string, unknown> | undefined;
    const existingKeys = Object.keys(catData || {});
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
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allSegments = [categoryKey, productKey, optionKey];
    if (allSegments.some(s => s.includes('.'))) {
      await docRef.set(setNested(allSegments, optionData), { merge: true });
    } else {
      await docRef.update({ [`${categoryKey}.${productKey}.${optionKey}`]: optionData });
    }
    res.json({ success: true, message: `Product added as "${productKey}"`, productKey, optionKey });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST product error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to add product to category' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/product — Add product slot under setup
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/product', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { productId, defaultQty, minQty, maxQty } = req.body as {
      productId?: string; defaultQty?: number; minQty?: number; maxQty?: number;
    };
    if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID is required' });
    const db = getDb();
    const productDoc = await db.collection(PRODUCT_COLLECTION).doc(productId).get();
    if (!productDoc.exists) return res.status(404).json({ success: false, error: `Product ${productId} not found in catalog` });
    const serviceDoc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    const serviceData = serviceDoc.exists ? serviceDoc.data() || {} : {};
    const catData = serviceData[categoryKey] as Record<string, unknown> | undefined;
    const setupData = (catData?.[setupKey] as Record<string, unknown>) || {};
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
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allSegments = [categoryKey, setupKey, productKey, optionKey];
    if (allSegments.some(s => s.includes('.'))) {
      await docRef.set(setNested(allSegments, optionData), { merge: true });
    } else {
      await docRef.update({ [`${categoryKey}.${setupKey}.${productKey}.${optionKey}`]: optionData });
    }
    res.json({ success: true, message: `Product added as "${productKey}"`, productKey, optionKey });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST product error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to add product' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/product/:productKey — Remove product slot from category
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/product/:productKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const productKey = String(req.params.productKey);
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    await deleteNested(docRef, [categoryKey, productKey]);
    res.json({ success: true, message: `Product "${productKey}" removed from category` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE product error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to remove product from category' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/setup/:setupKey/product/:productKey — Remove product slot from setup
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/setup/:setupKey/product/:productKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const productKey = String(req.params.productKey);
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    await deleteNested(docRef, [categoryKey, setupKey, productKey]);
    res.json({ success: true, message: `Product "${productKey}" removed` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE product error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to remove product' });
  }
});

// PATCH /config/:serviceId/category/:categoryKey/node/quantities (duplicate, keep for backward compat)
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/node/quantities', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; defaultQty?: number; minQty?: number; maxQty?: number };
    if (!Array.isArray(nodePath) || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath required' });

    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allNoDots = [categoryKey, ...nodePath].every(s => !s.includes('.'));

    if (allNoDots) {
      const updates: Record<string, unknown> = {};
      const firestorePath = `${categoryKey}.${nodePath.join('.')}`;
      if (defaultQty !== undefined) updates[`${firestorePath}.Deafult q`] = defaultQty;
      if (minQty !== undefined) updates[`${firestorePath}.min q`] = minQty;
      if (maxQty !== undefined) updates[`${firestorePath}.max q`] = maxQty;
      if (Object.keys(updates).length > 0) { await docRef.update(updates); }
    } else {
      const base = [categoryKey, ...nodePath];
      if (defaultQty !== undefined) await docRef.set(setNested([...base, 'Deafult q'], defaultQty), { merge: true });
      if (minQty !== undefined) await docRef.set(setNested([...base, 'min q'], minQty), { merge: true });
      if (maxQty !== undefined) await docRef.set(setNested([...base, 'max q'], maxQty), { merge: true });
    }
    res.json({ success: true, message: 'Quantities updated' });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] PATCH quantities (category) error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to update quantities' });
  }
});

// PATCH /config/:serviceId/category/:categoryKey/node/dynamic-field
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/node/dynamic-field', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, value } = req.body as { nodePath: string[]; value: any };
    if (!Array.isArray(nodePath) || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath required' });

    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allNoDots = [categoryKey, ...nodePath].every(s => !s.includes('.'));
    if (allNoDots) {
      await docRef.update({ [`${categoryKey}.${nodePath.join('.')}`]: value });
    } else {
      await docRef.set(setNested([categoryKey, ...nodePath], value), { merge: true });
    }
    res.json({ success: true, message: 'Field updated' });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] PATCH dynamic-field (category) error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to update field' });
  }
});

// ─── PATCH /config/:serviceId/category/:categoryKey/node/render-config
servicesAdminRouter.patch(
  '/config/:serviceId/category/:categoryKey/node/render-config',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const categoryKey = String(req.params.categoryKey);
      const { nodePath, renderType, selectionType, collectiveValidation, displayLabel, mandatory } = req.body as {
        nodePath?: string[];
        renderType?: 'option' | 'list';
        selectionType?: 'single' | 'multi';
        collectiveValidation?: boolean;
        displayLabel?: string;
        mandatory?: boolean;
      };

      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'nodePath array is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
      const allNoDots = [categoryKey, ...nodePath].every(s => !s.includes('.'));

      const configFields: Record<string, unknown> = {};
      if (renderType !== undefined) configFields.renderType = renderType;
      if (selectionType !== undefined) configFields.selectionType = selectionType;
      if (collectiveValidation !== undefined) configFields.collectiveValidation = collectiveValidation;
      if (displayLabel !== undefined) configFields.displayLabel = displayLabel;
      if (mandatory !== undefined) configFields.mandatory = mandatory;

      if (Object.keys(configFields).length === 0) {
        return res.status(400).json({ success: false, error: 'No render config fields provided' });
      }

      if (allNoDots) {
        const basePath = `${categoryKey}.${nodePath.join('.')}`;
        const updates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(configFields)) updates[`${basePath}.${k}`] = v;
        await docRef.update(updates);
      } else {
        for (const [k, v] of Object.entries(configFields)) {
          await docRef.set(setNested([categoryKey, ...nodePath, k], v), { merge: true });
        }
      }
      res.json({ success: true, message: 'Render config updated', path: nodePath, renderType });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH render-config (category) error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to update render config' });
    }
  }
);

// ─── PATCH /config/:serviceId/category/:categoryKey/node/dependency
servicesAdminRouter.patch(
  '/config/:serviceId/category/:categoryKey/node/dependency',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const categoryKey = String(req.params.categoryKey);
      const { nodePath, dependsOn } = req.body as { nodePath?: string[]; dependsOn?: string | null };

      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'nodePath array is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
      const allNoDots = [categoryKey, ...nodePath].every(s => !s.includes('.'));

      if (allNoDots) {
        const basePath = `${categoryKey}.${nodePath.join('.')}`;
        await docRef.update({ [`${basePath}.dependsOn`]: dependsOn || null });
      } else {
        await docRef.set(setNested([categoryKey, ...nodePath, 'dependsOn'], dependsOn || null), { merge: true });
      }
      res.json({ success: true, message: 'Dependency updated', path: nodePath, dependsOn });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH dependency (category) error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to update dependency' });
    }
  }
);

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/branch
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/branch', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { nodePath, branchName } = req.body as { nodePath?: string[]; branchName: string };
    if (!branchName?.trim()) return res.status(400).json({ success: false, error: 'Branch name required' });
    
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allSegments = nodePath && nodePath.length > 0
      ? [categoryKey, setupKey, ...nodePath, branchName]
      : [categoryKey, setupKey, branchName];
    if (allSegments.some(s => s.includes('.'))) {
      await docRef.set(setNested(allSegments, {}), { merge: true });
    } else {
      const path = nodePath && nodePath.length > 0
        ? `${categoryKey}.${setupKey}.${nodePath.join('.')}.${branchName}`
        : `${categoryKey}.${setupKey}.${branchName}`;
      await docRef.update({ [path]: {} });
    }
    res.json({ success: true, message: `Branch "${branchName}" created` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to create branch' }); }
});

// POST /config/:serviceId/category/:categoryKey/branch — Add branch at category level (no setup)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/branch', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, branchName } = req.body as { nodePath?: string[]; branchName: string };
    if (!branchName?.trim()) return res.status(400).json({ success: false, error: 'Branch name required' });

    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allSegments = nodePath && nodePath.length > 0
      ? [categoryKey, ...nodePath, branchName]
      : [categoryKey, branchName];
    if (allSegments.some(s => s.includes('.'))) {
      await docRef.set(setNested(allSegments, {}), { merge: true });
    } else {
      const path = nodePath && nodePath.length > 0
        ? `${categoryKey}.${nodePath.join('.')}.${branchName}`
        : `${categoryKey}.${branchName}`;
      await docRef.update({ [path]: {} });
    }
    res.json({ success: true, message: `Branch "${branchName}" created` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to create branch' }); }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/node
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/node', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { nodePath, productId, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; productId: string; defaultQty?: number; minQty?: number; maxQty?: number; };
    
    const db = getDb();
    const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const productDoc = await productRef.get();
    let optionKey: string;
    if (productDoc.exists) {
      const productData = productDoc.data()!;
      const rawName = (productData.name ?? productData.productName ?? productId) as string;
      optionKey = safeKey(rawName);
    } else {
      optionKey = productId;
    }

    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allSegments = [categoryKey, setupKey, ...nodePath];
    const parentSnapshot = await docRef.get();
    const parentData = parentSnapshot.data() || {};
    let currentLevel = parentData;
    for (const seg of allSegments) {
      currentLevel = (currentLevel[seg] as Record<string, unknown>) || {};
    }
    optionKey = uniqueKey(optionKey, currentLevel);

    const optionData = {
      'Deafult q': defaultQty ?? 1,
      'Price': productRef,
      [`${optionKey} ID`]: productRef,
      'available': true,
      'max q': maxQty ?? 50,
      'min q': minQty ?? 0,
      'rigid': false
    };

    allSegments.push(optionKey);
    if (allSegments.some(s => s.includes('.'))) {
      await docRef.set(setNested(allSegments, optionData), { merge: true });
    } else {
      await docRef.update({ [`${categoryKey}.${setupKey}.${nodePath.join('.')}.${optionKey}`]: optionData });
    }
    res.json({ success: true, message: `Node "${optionKey}" added` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST node error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to add node' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/setup/:setupKey/node
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/setup/:setupKey/node', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const path = JSON.parse(req.query.path as string) as string[];
    const db = getDb();
    await deleteNested(db.collection(SERVICE_COLLECTION).doc(serviceId), [categoryKey, setupKey, ...path]);
    res.json({ success: true, message: 'Node deleted' });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE node error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to delete node' });
  }
});

// POST /config/:serviceId/category/:categoryKey/node — Add a node at category level (no setup)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/node', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, productId, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; productId: string; defaultQty?: number; minQty?: number; maxQty?: number; };

    const db = getDb();
    const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const productDoc = await productRef.get();
    let optionKey: string;
    if (productDoc.exists) {
      const productData = productDoc.data()!;
      const rawName = (productData.name ?? productData.productName ?? productId) as string;
      optionKey = safeKey(rawName);
    } else {
      optionKey = productId;
    }

    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allSegments = [categoryKey, ...nodePath];
    const parentSnapshot = await docRef.get();
    const parentData = parentSnapshot.data() || {};
    let currentLevel = parentData;
    for (const seg of allSegments) {
      currentLevel = (currentLevel[seg] as Record<string, unknown>) || {};
    }
    optionKey = uniqueKey(optionKey, currentLevel);

    const optionData = {
      'Deafult q': defaultQty ?? 1,
      'Price': productRef,
      [`${optionKey} ID`]: productRef,
      'available': true,
      'max q': maxQty ?? 50,
      'min q': minQty ?? 0,
      'rigid': false
    };

    allSegments.push(optionKey);
    if (allSegments.some(s => s.includes('.'))) {
      await docRef.set(setNested(allSegments, optionData), { merge: true });
    } else {
      await docRef.update({ [`${categoryKey}.${nodePath.join('.')}.${optionKey}`]: optionData });
    }
    res.json({ success: true, message: `Node "${optionKey}" added` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST node (category) error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to add node' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/node — Delete a node at category level (no setup)
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/node', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const path = JSON.parse(req.query.path as string) as string[];
    const db = getDb();
    await deleteNested(db.collection(SERVICE_COLLECTION).doc(serviceId), [categoryKey, ...path]);
    res.json({ success: true, message: 'Node deleted' });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE node (category) error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to delete node' });
  }
});

// POST /config/:serviceId/category/:categoryKey/node/rename — Rename a node at category level (no setup)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/node/rename', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, newName } = req.body as { nodePath: string[]; newName: string; };

    if (!nodePath || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath required' });
    if (!newName?.trim()) return res.status(400).json({ success: false, error: 'newName required' });

    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(serviceRef);
      if (!doc.exists) throw new Error('Service not found');
      const data = doc.data()!;
      let current = data[categoryKey];
      if (!current) throw new Error('Category not found');
      const parentPath = nodePath.slice(0, -1);
      for (const p of parentPath) { current = current[p]; }
      const oldName = nodePath[nodePath.length - 1];
      current[newName] = current[oldName];
      delete current[oldName];
      transaction.set(serviceRef, data);
    });

    res.json({ success: true, message: `Node renamed to ${newName}` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST node rename (category) error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to rename node' });
  }
});

// PATCH /config/:serviceId/category/:categoryKey/setup/:setupKey/node/quantities
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/setup/:setupKey/node/quantities', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { nodePath, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; defaultQty?: number; minQty?: number; maxQty?: number; };
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allNoDots = [categoryKey, setupKey, ...nodePath].every(s => !s.includes('.'));
    if (allNoDots) {
      const firestorePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
      const updates: any = {};
      if (defaultQty !== undefined) updates[`${firestorePath}.Deafult q`] = defaultQty;
      if (minQty !== undefined) updates[`${firestorePath}.min q`] = minQty;
      if (maxQty !== undefined) updates[`${firestorePath}.max q`] = maxQty;
      await docRef.update(updates);
    } else {
      const base = [categoryKey, setupKey, ...nodePath];
      if (defaultQty !== undefined) await docRef.set(setNested([...base, 'Deafult q'], defaultQty), { merge: true });
      if (minQty !== undefined) await docRef.set(setNested([...base, 'min q'], minQty), { merge: true });
      if (maxQty !== undefined) await docRef.set(setNested([...base, 'max q'], maxQty), { merge: true });
    }
    res.json({ success: true, message: 'Quantities updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update quantities' });
  }
});

// PATCH /config/:serviceId/category/:categoryKey/setup/:setupKey/node/dynamic-field
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/setup/:setupKey/node/dynamic-field', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { nodePath, value } = req.body as { nodePath: string[]; value: any; };
    const db = getDb();
    const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const allNoDots = [categoryKey, setupKey, ...nodePath].every(s => !s.includes('.'));
    if (allNoDots) {
      await docRef.update({ [`${categoryKey}.${setupKey}.${nodePath.join('.')}`]: value });
    } else {
      await docRef.set(setNested([categoryKey, setupKey, ...nodePath], value), { merge: true });
    }
    res.json({ success: true, message: 'Field updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update field' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/node/rename
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/node/rename', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { nodePath, newName } = req.body as { nodePath: string[]; newName: string; };
    
    if (!nodePath || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath required' });
    if (!newName?.trim()) return res.status(400).json({ success: false, error: 'newName required' });
    
    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(serviceRef);
      if (!doc.exists) throw new Error('Service not found');
      const data = doc.data()!;
      let current = data[categoryKey]?.[setupKey];
      if (!current) throw new Error('Setup not found');
      const parentPath = nodePath.slice(0, -1);
      for (const p of parentPath) { current = current[p]; }
      const oldName = nodePath[nodePath.length - 1];
      current[newName] = current[oldName];
      delete current[oldName];
      transaction.set(serviceRef, data);
    });
    
    res.json({ success: true, message: `Node renamed to ${newName}` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST node rename error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to rename node' });
  }
});


// POST /config/:serviceId/category/:categoryKey/rename
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/rename', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { newName } = req.body as { newName: string; };
    if (!newName?.trim()) return res.status(400).json({ success: false, error: 'newName required' });
    
    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const hasDots = [categoryKey, newName].some(s => s.includes('.'));
    
    if (!hasDots) {
      await db.runTransaction(async (transaction) => {
         const doc = await transaction.get(serviceRef);
         if (!doc.exists) throw new Error('Service not found');
         const data = doc.data()!;
         const categoryData = data[categoryKey];
         if (!categoryData) throw new Error('Category not found');
         
         transaction.update(serviceRef, {
           [newName]: categoryData,
           [categoryKey]: FieldValue.delete()
         });
      });
    } else {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(serviceRef);
        if (!doc.exists) throw new Error('Service not found');
        const data = doc.data()!;
        if (!data[categoryKey]) throw new Error('Category not found');
        data[newName] = data[categoryKey];
        delete data[categoryKey];
        transaction.set(serviceRef, data);
      });
    }
    res.json({ success: true, message: `Category renamed to ${newName}` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST category rename error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to rename category' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/rename
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/rename', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { newName } = req.body as { newName: string; };
    if (!newName?.trim()) return res.status(400).json({ success: false, error: 'newName required' });
    
    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(serviceRef);
      if (!doc.exists) throw new Error('Service not found');
      const data = doc.data()!;
      data[categoryKey][newName] = data[categoryKey][setupKey];
      delete data[categoryKey][setupKey];
      transaction.set(serviceRef, data);
    });
    res.json({ success: true, message: `Setup renamed to ${newName}` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST setup rename error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to rename setup' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/club — Group selected product slots/branches under a new group
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/club', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { groupName, keys, nodePath } = req.body as { groupName: string; keys: string[]; nodePath?: string[] };

    if (!groupName?.trim()) return res.status(400).json({ success: false, error: 'groupName is required' });
    if (!Array.isArray(keys) || keys.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 keys are required' });
    }

    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);

    const parentSegments = nodePath && nodePath.length > 0
      ? [categoryKey, setupKey, ...nodePath]
      : [categoryKey, setupKey];

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(serviceRef);
      if (!doc.exists) throw new Error('Service not found');
      const data = doc.data()!;

      // Traverse to parent, creating missing segments as empty objects so
      // parent stays a live reference into the data object (avoids detachment).
      let parent: Record<string, unknown> = data;
      for (const seg of parentSegments) {
        if (!parent[seg] || typeof parent[seg] !== 'object') parent[seg] = {};
        parent = parent[seg] as Record<string, unknown>;
      }

      // Build the group map from selected child keys
      const groupMap: Record<string, unknown> = {};
      for (const key of keys) {
        if (parent[key] !== undefined) {
          groupMap[key] = parent[key];
        }
      }

      // Write the new group and remove the original keys
      parent[groupName] = groupMap;
      for (const key of keys) {
        delete parent[key];
      }

      transaction.set(serviceRef, data);
    });

    res.json({ success: true, message: `Items clubbed under "${groupName}"` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST club error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to club items' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/clone — Deep-clone a setup from any category
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/clone', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const destCategoryKey = String(req.params.categoryKey);
    const { sourceCategoryKey, sourceSetupKey, newName } = req.body as { sourceCategoryKey: string; sourceSetupKey: string; newName: string; };

    if (!sourceCategoryKey?.trim() || !sourceSetupKey?.trim() || !newName?.trim()) {
      return res.status(400).json({ success: false, error: 'sourceCategoryKey, sourceSetupKey, and newName are required' });
    }

    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const doc = await serviceRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Service not found' });

    const data = doc.data()!;
    const sourceData = data[sourceCategoryKey]?.[sourceSetupKey];
    if (!sourceData) {
      return res.status(404).json({ success: false, error: `Source setup "${sourceCategoryKey}.${sourceSetupKey}" not found` });
    }

    // Always use setNested + set({ merge: true }) to preserve literal dots
    // in any nested keys within sourceData (legacy data, user-entered decimals, etc.)
    await serviceRef.set(setNested([destCategoryKey, newName], sourceData), { merge: true });
    res.json({ success: true, message: `Setup cloned as "${newName}"` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST clone setup error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to clone setup' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/node/clone — Deep-clone any node
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/node/clone', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { sourceNodePath, destNodePath, newKey, sourceCategoryKey, sourceSetupKey } = req.body as { sourceNodePath: string[]; destNodePath: string[]; newKey: string; sourceCategoryKey?: string; sourceSetupKey?: string; };

    if (!Array.isArray(sourceNodePath) || sourceNodePath.length === 0) {
      return res.status(400).json({ success: false, error: 'sourceNodePath is required' });
    }
    if (!Array.isArray(destNodePath)) {
      return res.status(400).json({ success: false, error: 'destNodePath is required' });
    }
    if (!newKey?.trim()) {
      return res.status(400).json({ success: false, error: 'newKey is required' });
    }

    const db = getDb();
    const serviceRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
    const doc = await serviceRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Service not found' });

    const data = doc.data()!;
    const srcCat = sourceCategoryKey || categoryKey;
    const srcSetup = sourceSetupKey || setupKey;
    const setupData = data[srcCat]?.[srcSetup];
    if (!setupData) {
      return res.status(404).json({ success: false, error: `Setup "${srcCat}.${srcSetup}" not found` });
    }

    // Navigate to source node
    let sourceNode: unknown = setupData;
    for (const seg of sourceNodePath) {
      if (sourceNode && typeof sourceNode === 'object' && seg in (sourceNode as Record<string, unknown>)) {
        sourceNode = (sourceNode as Record<string, unknown>)[seg];
      } else {
        return res.status(404).json({ success: false, error: `Source node "${sourceNodePath.join('.')}" not found` });
      }
    }

    if (typeof sourceNode !== 'object' || sourceNode === null) {
      return res.status(400).json({ success: false, error: 'Source node is not a valid object to clone' });
    }

    // Deep clone the source data (plain object, safe to spread)
    const cloneData = JSON.parse(JSON.stringify(sourceNode));

    // Write to destination
    const destSegments = [categoryKey, setupKey, ...destNodePath, newKey];
    await serviceRef.set(setNested(destSegments, cloneData), { merge: true });
    res.json({ success: true, message: `Node cloned as "${newKey}"` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST node clone error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to clone node' });
  }
});

// ─── Shared Catalog Helpers ─────────────────────────────────

servicesAdminRouter.get('/products', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const productMap = await getProductMap();
    let products = Array.from(productMap.values()).map(p => ({
      id: p.id, 
      name: p.name || p.productName || '', 
      category: p.category || '', 
      price: p.price || p.basePrice || 0, 
      status: p.status || 'active'
    }));
    if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    res.json({ success: true, data: { products } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search products' });
  }
});

// PATCH /product/:productId/price — Update master catalog price
servicesAdminRouter.patch('/product/:productId/price', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.productId);
    const { price } = req.body as { price: number };
    const db = getDb();
    await db.collection(PRODUCT_COLLECTION).doc(productId).update({
      price: price,
      basePrice: price
    });
    res.json({ success: true, message: `Price updated for ${productId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update product price' });
  }
});

// ─── PATCH /config/:serviceId/category/:categoryKey/setup/:setupKey/node/render-config
servicesAdminRouter.patch(
  '/config/:serviceId/category/:categoryKey/setup/:setupKey/node/render-config',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const categoryKey = String(req.params.categoryKey);
      const setupKey = String(req.params.setupKey);
      const { nodePath, renderType, selectionType, collectiveValidation, displayLabel, mandatory } = req.body as {
        nodePath?: string[];
        renderType?: 'option' | 'list';
        selectionType?: 'single' | 'multi';
        collectiveValidation?: boolean;
        displayLabel?: string;
        mandatory?: boolean;
      };

      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'nodePath array is required' });
      }
      if (renderType && renderType !== 'option' && renderType !== 'list') {
        return res.status(400).json({ success: false, error: 'renderType must be "option" or "list"' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
      const allNoDots = [categoryKey, setupKey, ...nodePath].every(s => !s.includes('.'));

      const configFields: Record<string, unknown> = {};
      if (renderType !== undefined) configFields.renderType = renderType;
      if (selectionType !== undefined) configFields.selectionType = selectionType;
      if (collectiveValidation !== undefined) configFields.collectiveValidation = collectiveValidation;
      if (displayLabel !== undefined) configFields.displayLabel = displayLabel;
      if (mandatory !== undefined) configFields.mandatory = mandatory;

      if (Object.keys(configFields).length === 0) {
        return res.status(400).json({ success: false, error: 'No render config fields provided' });
      }

      if (allNoDots) {
        const basePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
        const updates: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(configFields)) updates[`${basePath}.${k}`] = v;
        await docRef.update(updates);
      } else {
        for (const [k, v] of Object.entries(configFields)) {
          await docRef.set(setNested([categoryKey, setupKey, ...nodePath, k], v), { merge: true });
        }
      }
      res.json({ success: true, message: 'Render config updated', path: nodePath, renderType });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH render-config error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to update render config' });
    }
  }
);

// ─── PATCH /config/:serviceId/active — Toggle active status on category or setup
servicesAdminRouter.patch(
  '/config/:serviceId/active',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const { categoryKey, setupKey, active } = req.body as {
        categoryKey?: string;
        setupKey?: string;
        active: boolean;
      };

      if (!categoryKey) {
        return res.status(400).json({ success: false, error: 'categoryKey is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);

      const segments = setupKey
        ? [categoryKey, setupKey, ACTIVE_META_KEY]
        : [categoryKey, ACTIVE_META_KEY];
      const allNoDots = segments.every(s => !s.includes('.'));

      if (allNoDots) {
        const path = segments.join('.');
        await docRef.update({ [path]: active });
      } else {
        await docRef.set(setNested(segments, active), { merge: true });
      }

      const label = setupKey || categoryKey;
      const kind = setupKey ? 'Setup' : 'Category';
      res.json({ success: true, message: `${kind} "${label}" ${active ? 'activated' : 'deactivated'}` });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH active error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to toggle active status' });
    }
  }
);

// ─── PATCH /config/:serviceId/order — Set display order ──
servicesAdminRouter.patch(
  '/config/:serviceId/order',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const { categoryKey, setupKey, productKey, nodePath, order } = req.body as {
        categoryKey?: string;
        setupKey?: string;
        productKey?: string;
        nodePath?: string[];
        order: number;
      };

      if (order === undefined && order !== 0) {
        return res.status(400).json({ success: false, error: 'order is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);

      const segments: string[] = [];
      if (nodePath && Array.isArray(nodePath)) {
        if (categoryKey) segments.push(categoryKey);
        if (setupKey) segments.push(setupKey);
        segments.push(...nodePath);
      } else {
        if (categoryKey) segments.push(categoryKey);
        if (setupKey) segments.push(setupKey);
        if (productKey) segments.push(productKey);
      }
      segments.push(ORDER_META_KEY);

      const allNoDots = segments.every(s => !s.includes('.'));
      if (allNoDots) {
        const path = segments.join('.');
        await docRef.update({ [path]: order });
      } else {
        await docRef.set(setNested(segments, order), { merge: true });
      }

      res.json({ success: true, message: `Order set to ${order}` });
    } catch (error) {
      console.error('[SERVICES-ADMIN] PATCH order error:', error);
      res.status(500).json({ success: false, error: 'Failed to update order' });
    }
  }
);

// ─── PATCH /config/:serviceId/order/bulk — Set display order for multiple items ──
servicesAdminRouter.patch(
  '/config/:serviceId/order/bulk',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const { items } = req.body as { items: Array<{ categoryKey?: string; setupKey?: string; productKey?: string; order: number }> };

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'items array is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
      const updates: Record<string, unknown> = {};

      for (const item of items) {
        const segments: string[] = [];
        if (item.categoryKey) segments.push(item.categoryKey);
        if (item.setupKey) segments.push(item.setupKey);
        if (item.productKey) segments.push(item.productKey);
        segments.push(ORDER_META_KEY);
        const path = segments.join('.');
        updates[path] = item.order;
      }

      await docRef.update(updates);
      res.json({ success: true, message: `${items.length} items reordered` });
    } catch (error) {
      console.error('[SERVICES-ADMIN] PATCH order/bulk error:', error);
      res.status(500).json({ success: false, error: 'Failed to batch update order' });
    }
  }
);

// ─── PATCH /config/:serviceId/category/:categoryKey/setup/:setupKey/node/dependency
servicesAdminRouter.patch(
  '/config/:serviceId/category/:categoryKey/setup/:setupKey/node/dependency',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const serviceId = String(req.params.serviceId);
      const categoryKey = String(req.params.categoryKey);
      const setupKey = String(req.params.setupKey);
      const { nodePath, dependsOn } = req.body as { nodePath?: string[]; dependsOn?: string | null };

      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'nodePath array is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc(serviceId);
      const allNoDots = [categoryKey, setupKey, ...nodePath].every(s => !s.includes('.'));

      if (allNoDots) {
        const basePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
        await docRef.update({ [`${basePath}.dependsOn`]: dependsOn || null });
      } else {
        await docRef.set(setNested([categoryKey, setupKey, ...nodePath, 'dependsOn'], dependsOn || null), { merge: true });
      }
      res.json({ success: true, message: 'Dependency updated', path: nodePath, dependsOn });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH dependency error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to update dependency' });
    }
  }
);
