import { Router, Request, Response } from 'express';
import { getDb } from '../services/firestore.js';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';

export const servicesAdminRouter = Router();

// ─── Helpers ────────────────────────────────────────────────

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
    map.set(doc.id, { id: doc.id, ...doc.data() } as ProductData);
  });
  return map;
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
}

function extractTree(
  slot: Record<string, unknown>,
  productMap: Map<string, ProductData>
): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const [key, value] of Object.entries(slot)) {
    if (value === null || value === undefined) continue;

    if (typeof value !== 'object') {
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
      });
    } else {
      const children = extractTree(obj, productMap);
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
      });
    }
  }
  return nodes;
}

// ─── ROUTES ─────────────────────────────────────────────────

// GET /list — List all available services in the Services collection
servicesAdminRouter.get('/list', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(SERVICE_COLLECTION).get();
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.id,
      icon: '🔧', // Fallback icon
      enabled: true,
      ...doc.data()
    }));
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

// GET /config/:serviceId — Get full tree for a service
servicesAdminRouter.get('/config/:serviceId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const db = getDb();
    const doc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Service not found' });

    const data = doc.data() || {};
    // Remove metadata from the tree view
    delete data._meta;

    const productMap = await getProductMap();

    const categories = Object.entries(data).map(([categoryKey, setupsRaw]) => {
      const setups = setupsRaw as Record<string, unknown>;
      const setupEntries = Object.entries(setups).map(([setupKey, productsRaw]) => {
        const products = productsRaw as Record<string, unknown>;
        const productSlots = Object.entries(products).map(([productKey, optionsRaw]) => {
          const options = optionsRaw as Record<string, unknown>;
          const tree = extractTree(options, productMap);
          return {
            key: productKey,
            options: tree,
            isClubbed: tree.length > 1
          };
        });
        return { key: setupKey, name: setupKey, products: productSlots };
      });
      return { key: categoryKey, name: categoryKey, setups: setupEntries };
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
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(serviceId).delete();
    res.json({ success: true, message: `Service "${serviceId}" deleted` });
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
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [key]: FieldValue.delete() });
    res.json({ success: true, message: `Category "${key}" deleted` });
  } catch (error) {
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
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${name}`]: {} });
    res.json({ success: true, message: `Setup "${name}" created` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create setup' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/setup/:setupKey
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/setup/:setupKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${setupKey}`]: FieldValue.delete() });
    res.json({ success: true, message: `Setup deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete setup' });
  }
});

// POST /config/:serviceId/category/:categoryKey/product (add directly to category, no setup)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/product', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { productId, defaultQty, minQty, maxQty } = req.body as { productId?: string; defaultQty?: number; minQty?: number; maxQty?: number; };
    if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID required' });

    const db = getDb();
    const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const productDoc = await productRef.get();
    if (!productDoc.exists) return res.status(404).json({ success: false, error: 'Product not found' });

    const serviceDoc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    const categoryData = (serviceDoc.data()?.[categoryKey] || {}) as Record<string, unknown>;
    const nextNum = Object.keys(categoryData).length + 1;
    const productKey = `Product ${nextNum}`;
    const optionKey = `${productKey} Option 1`;

    const optionData = {
      'Deafult q': defaultQty ?? 1,
      'Price': productRef,
      [`${optionKey} ID`]: productRef,
      'available': true,
      'max q': maxQty ?? 50,
      'min q': minQty ?? 0,
      'rigid': false
    };

    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({
      [`${categoryKey}.${productKey}.${optionKey}`]: optionData
    });
    res.json({ success: true, message: `Product added as "${productKey}" directly to category` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add product to category' });
  }
});

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/product
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/product', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    let setupKey = String(req.params.setupKey);
    const { productId, defaultQty, minQty, maxQty } = req.body as { productId?: string; defaultQty?: number; minQty?: number; maxQty?: number; };
    if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID required' });

    // If setupKey is empty, use/create a "General" setup
    if (!setupKey || setupKey === '' || setupKey === '_') {
      setupKey = 'General';
    }

    const db = getDb();
    const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const productDoc = await productRef.get();
    if (!productDoc.exists) return res.status(404).json({ success: false, error: 'Product not found' });

    const serviceDoc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    const setupData = (serviceDoc.data()?.[categoryKey]?.[setupKey] || {}) as Record<string, unknown>;
    const nextNum = Object.keys(setupData).length + 1;
    const productKey = `Product ${nextNum}`;
    const optionKey = `${productKey} Option 1`;

    const optionData = {
      'Deafult q': defaultQty ?? 1,
      'Price': productRef,
      [`${optionKey} ID`]: productRef,
      'available': true,
      'max q': maxQty ?? 50,
      'min q': minQty ?? 0,
      'rigid': false
    };

    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({
      [`${categoryKey}.${setupKey}.${productKey}.${optionKey}`]: optionData
    });
    res.json({ success: true, message: `Product added as "${productKey}" to ${setupKey}` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add product' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/product/:productKey (delete directly from category)
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/product/:productKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const productKey = String(req.params.productKey);
    
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${productKey}`]: FieldValue.delete() });
    res.json({ success: true, message: `Product removed from category` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove product from category' });
  }
});

// DELETE /config/:serviceId/category/:categoryKey/setup/:setupKey/product/:productKey
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/setup/:setupKey/product/:productKey', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    let setupKey = String(req.params.setupKey);
    const productKey = String(req.params.productKey);
    
    // If setupKey is empty, use "General"
    if (!setupKey || setupKey === '' || setupKey === '_') {
      setupKey = 'General';
    }
    
    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${setupKey}.${productKey}`]: FieldValue.delete() });
    res.json({ success: true, message: `Product slot removed` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove product' });
  }
});

// POST /config/:serviceId/category/:categoryKey/node (add node directly to category)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/node', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, productId, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; productId: string; defaultQty?: number; minQty?: number; maxQty?: number; };
    
    const db = getDb();
    const productRef = db.collection(PRODUCT_COLLECTION).doc(productId);
    const productDoc = await productRef.get();
    if (!productDoc.exists) return res.status(404).json({ success: false, error: 'Product not found' });

    const serviceDoc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    const categoryData = (serviceDoc.data()?.[categoryKey] || {}) as Record<string, unknown>;
    const targetPath = nodePath.length > 0 ? nodePath : [];
    let targetData = categoryData;
    for (const p of targetPath) { targetData = (targetData[p] || {}) as Record<string, unknown>; }
    
    const nextNum = Object.keys(targetData).length + 1;
    const productKey = `Product ${nextNum}`;
    const optionKey = `${productKey} Option 1`;
    const optionData = { 'Deafult q': defaultQty ?? 1, 'Price': productRef, [`${optionKey} ID`]: productRef, 'available': true, 'max q': maxQty ?? 50, 'min q': minQty ?? 0, 'rigid': false };

    const updatePath = targetPath.length > 0 ? `${categoryKey}.${targetPath.join('.')}.${productKey}.${optionKey}` : `${categoryKey}.${productKey}.${optionKey}`;
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [updatePath]: optionData });
    res.json({ success: true, message: `Node added at category level` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to add node' }); }
});

// DELETE /config/:serviceId/category/:categoryKey/node (delete node from category)
servicesAdminRouter.delete('/config/:serviceId/category/:categoryKey/node', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const nodePath = JSON.parse(String(req.query.path) || '[]') as string[];
    if (nodePath.length === 0) return res.status(400).json({ success: false, error: 'Node path required' });
    
    const db = getDb();
    const updatePath = `${categoryKey}.${nodePath.join('.')}`;
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [updatePath]: FieldValue.delete() });
    res.json({ success: true, message: `Node deleted from category` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to delete node' }); }
});

// PATCH /config/:serviceId/category/:categoryKey/node/quantities (update quantities at category level)
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/node/quantities', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; defaultQty?: number; minQty?: number; maxQty?: number; };
    if (!nodePath || nodePath.length === 0) return res.status(400).json({ success: false, error: 'Node path required' });
    
    const db = getDb();
    const basePath = `${categoryKey}.${nodePath.join('.')}`;
    const updates: Record<string, any> = {};
    if (defaultQty !== undefined) updates[`${basePath}.Deafult q`] = defaultQty;
    if (minQty !== undefined) updates[`${basePath}.min q`] = minQty;
    if (maxQty !== undefined) updates[`${basePath}.max q`] = maxQty;
    
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update(updates);
    res.json({ success: true, message: `Quantities updated at category level` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to update quantities' }); }
});

// PATCH /config/:serviceId/category/:categoryKey/node/dynamic-field (update dynamic field at category level)
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/node/dynamic-field', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, field, value } = req.body as { nodePath: string[]; field: string; value: any; };
    if (!nodePath || nodePath.length === 0) return res.status(400).json({ success: false, error: 'Node path required' });
    
    const db = getDb();
    const updatePath = `${categoryKey}.${nodePath.join('.')}.${field}`;
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [updatePath]: value });
    res.json({ success: true, message: `Dynamic field updated at category level` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to update dynamic field' }); }
});

// POST /config/:serviceId/category/:categoryKey/branch (add empty branch node at category level)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/branch', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, branchName } = req.body as { nodePath?: string[]; branchName: string };
    if (!branchName?.trim()) return res.status(400).json({ success: false, error: 'Branch name required' });
    
    const db = getDb();
    const path = nodePath && nodePath.length > 0
      ? `${categoryKey}.${nodePath.join('.')}.${branchName}`
      : `${categoryKey}.${branchName}`;
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [path]: {} });
    res.json({ success: true, message: `Branch "${branchName}" created at category level` });
  } catch (error) { res.status(500).json({ success: false, error: 'Failed to create branch' }); }
});

// POST /config/:serviceId/category/:categoryKey/node/rename (rename node at category level)
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
       let target = data[categoryKey];
       if (!target) throw new Error('Category not found');
       
       for (const p of nodePath) {
          if (target[p] === undefined) throw new Error(`Node path not found`);
          target = target[p];
       }
       
       const parentPath = nodePath.slice(0, -1);
       const oldName = nodePath[nodePath.length - 1];
       
       const firestoreParentPath = parentPath.length > 0 ? `${categoryKey}.${parentPath.join('.')}` : categoryKey;
       
       transaction.update(serviceRef, {
         [`${firestoreParentPath}.${newName}`]: target,
         [`${firestoreParentPath}.${oldName}`]: FieldValue.delete()
       });
    });
    
    res.json({ success: true, message: `Node renamed to ${newName}` });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] POST node rename error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to rename node' });
  }
});

// PATCH /config/:serviceId/category/:categoryKey/node/quantities (update quantities at category level)
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/node/quantities', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, defaultQty, minQty, maxQty } = req.body as { nodePath: string[]; defaultQty?: number; minQty?: number; maxQty?: number };
    if (!Array.isArray(nodePath) || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath required' });

    const db = getDb();
    const updates: Record<string, unknown> = {};
    const firestorePath = `${categoryKey}.${nodePath.join('.')}`;
    if (defaultQty !== undefined) updates[`${firestorePath}.Deafult q`] = defaultQty;
    if (minQty !== undefined) updates[`${firestorePath}.min q`] = minQty;
    if (maxQty !== undefined) updates[`${firestorePath}.max q`] = maxQty;
    if (Object.keys(updates).length > 0) {
      await db.collection(SERVICE_COLLECTION).doc(serviceId).update(updates);
    }
    res.json({ success: true, message: 'Quantities updated' });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] PATCH quantities (category) error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to update quantities' });
  }
});

// PATCH /config/:serviceId/category/:categoryKey/node/dynamic-field (update field at category level)
servicesAdminRouter.patch('/config/:serviceId/category/:categoryKey/node/dynamic-field', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const { nodePath, value } = req.body as { nodePath: string[]; value: any };
    if (!Array.isArray(nodePath) || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath required' });

    const db = getDb();
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${nodePath.join('.')}`]: value });
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
      const updates: Record<string, unknown> = {};
      const basePath = `${categoryKey}.${nodePath.join('.')}`;

      if (renderType !== undefined)          updates[`${basePath}.renderType`] = renderType;
      if (selectionType !== undefined)       updates[`${basePath}.selectionType`] = selectionType;
      if (collectiveValidation !== undefined) updates[`${basePath}.collectiveValidation`] = collectiveValidation;
      if (displayLabel !== undefined)        updates[`${basePath}.displayLabel`] = displayLabel;
      if (mandatory !== undefined)           updates[`${basePath}.mandatory`] = mandatory;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No render config fields provided' });
      }

      await db.collection(SERVICE_COLLECTION).doc(serviceId).update(updates);
      res.json({ success: true, message: 'Render config updated', path: nodePath, renderType });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH render-config (category) error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to update render config' });
    }
  }
);

// POST /config/:serviceId/category/:categoryKey/setup/:setupKey/branch (add empty branch node at setup level)
servicesAdminRouter.post('/config/:serviceId/category/:categoryKey/setup/:setupKey/branch', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const categoryKey = String(req.params.categoryKey);
    const setupKey = String(req.params.setupKey);
    const { nodePath, branchName } = req.body as { nodePath?: string[]; branchName: string };
    if (!branchName?.trim()) return res.status(400).json({ success: false, error: 'Branch name required' });
    
    const db = getDb();
    const path = nodePath && nodePath.length > 0
      ? `${categoryKey}.${setupKey}.${nodePath.join('.')}.${branchName}`
      : `${categoryKey}.${setupKey}.${branchName}`;
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [path]: {} });
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
    const parentName = nodePath[nodePath.length - 1];
    const optionKey = `${parentName} Option ${Date.now().toString().slice(-4)}`; // Simple unique name

    const optionData = {
      'Deafult q': defaultQty ?? 1,
      'Price': productRef,
      [`${optionKey} ID`]: productRef,
      'available': true,
      'max q': maxQty ?? 50,
      'min q': minQty ?? 0,
      'rigid': false
    };

    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({
      [`${categoryKey}.${setupKey}.${nodePath.join('.')}.${optionKey}`]: optionData
    });
    res.json({ success: true, message: `Node added` });
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
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${setupKey}.${path.join('.')}`]: FieldValue.delete() });
    res.json({ success: true, message: 'Node deleted' });
  } catch (error: any) {
    console.error('[SERVICES-ADMIN] DELETE node error:', error?.message || error);
    res.status(500).json({ success: false, error: 'Failed to delete node' });
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
    const firestorePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
    const updates: any = {};
    if (defaultQty !== undefined) updates[`${firestorePath}.Deafult q`] = defaultQty;
    if (minQty !== undefined) updates[`${firestorePath}.min q`] = minQty;
    if (maxQty !== undefined) updates[`${firestorePath}.max q`] = maxQty;
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update(updates);
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
    await db.collection(SERVICE_COLLECTION).doc(serviceId).update({ [`${categoryKey}.${setupKey}.${nodePath.join('.')}`]: value });
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
       let target = data[categoryKey]?.[setupKey];
       if (!target) throw new Error('Setup not found');
       
       for (const p of nodePath) {
          if (target[p] === undefined) throw new Error(`Node path not found`);
          target = target[p];
       }
       
       const parentPath = nodePath.slice(0, -1);
       const oldName = nodePath[nodePath.length - 1];
       
       const firestoreParentPath = parentPath.length > 0 ? `${categoryKey}.${setupKey}.${parentPath.join('.')}` : `${categoryKey}.${setupKey}`;
       
       transaction.update(serviceRef, {
         [`${firestoreParentPath}.${newName}`]: target,
         [`${firestoreParentPath}.${oldName}`]: FieldValue.delete()
       });
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
    res.json({ success: true, message: `Category renamed to ${newName}` });
  } catch (error: any) {
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
       const setupData = data[categoryKey]?.[setupKey];
       if (!setupData) throw new Error('Setup not found');
       
       transaction.update(serviceRef, {
         [`${categoryKey}.${newName}`]: setupData,
         [`${categoryKey}.${setupKey}`]: FieldValue.delete()
       });
    });
    res.json({ success: true, message: `Setup renamed to ${newName}` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to rename setup' });
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
      const updates: Record<string, unknown> = {};
      const basePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;

      if (renderType !== undefined)          updates[`${basePath}.renderType`] = renderType;
      if (selectionType !== undefined)       updates[`${basePath}.selectionType`] = selectionType;
      if (collectiveValidation !== undefined) updates[`${basePath}.collectiveValidation`] = collectiveValidation;
      if (displayLabel !== undefined)        updates[`${basePath}.displayLabel`] = displayLabel;
      if (mandatory !== undefined)           updates[`${basePath}.mandatory`] = mandatory;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: 'No render config fields provided' });
      }

      await db.collection(SERVICE_COLLECTION).doc(serviceId).update(updates);
      res.json({ success: true, message: 'Render config updated', path: nodePath, renderType });
    } catch (error: unknown) {
      console.error('[SERVICES-ADMIN] PATCH render-config error:', error instanceof Error ? error.message : error);
      res.status(500).json({ success: false, error: 'Failed to update render config' });
    }
  }
);
