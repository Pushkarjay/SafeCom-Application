import { Router, Request, Response } from 'express';
import { getDb } from '../services/firestore.js';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';

export const installationAdminRouter = Router();

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
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown> | undefined;
    map.set(doc.id, { id: doc.id, ...(data ?? {}) });
  });
  return map;
}

// ─── Recursive node extraction ──────────────────────────────
// Detects leaf vs branch nodes in the deeply nested Firestore map.
// Leaf: has 'Price', 'Deafult q', 'available', 'rigid' fields.
// Branch: children are maps → recurse.
const ACTIVE_META_KEY = '__active__';

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
  // Leaf fields
  productId: string;
  productName: string;
  price: number;
  category: string;
  defaultQty: number;
  minQty: number;
  maxQty: number;
  available: boolean;
  rigid: boolean;
  // Branch fields
  children: TreeNode[];
  // Render control fields (Phase 1.1 — renderType system)
  renderType?: 'option' | 'list';       // default: 'option'
  selectionType?: 'single' | 'multi';   // for renderType=option
  collectiveValidation?: boolean;        // for renderType=list: sum(children.qty) must be within [minQty,maxQty]
  displayLabel?: string;                 // human-readable label override
  mandatory?: boolean;                   // default: true
}

function extractTree(
  slot: Record<string, unknown>,
  productMap: Map<string, Record<string, unknown>>
): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const [key, value] of Object.entries(slot)) {
    if (value === null || value === undefined) continue;
    if (key === ACTIVE_META_KEY) continue; // skip active metadata

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
      const ref = extractProductRef(obj);
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
        // Render control — pass-through from Firestore
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
        // Render control — pass-through from Firestore (branch nodes can also carry renderType)
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

/**
 * Build a deep nested object for use with set({ merge: true }).
 * Unlike dot-notation update(), this preserves literal dots in keys.
 * e.g., setNested(["a", "b.c", "d"], "v") => { a: { "b.c": { d: "v" } } }
 */
function setNested(path: string[], value: unknown): Record<string, unknown> {
  const [head, ...tail] = path;
  if (tail.length === 0) return { [head]: value };
  return { [head]: setNested(tail, value) };
}

/**
 * Delete a field at a nested path, handling dots in key names correctly.
 * Falls back to update() with dot-notation when no path segment has a dot (faster).
 */
async function deleteNested(
  docRef: FirebaseFirestore.DocumentReference,
  path: string[]
): Promise<void> {
  const hasDots = path.some(s => s.includes('.'));
  if (!hasDots) {
    const upd: Record<string, unknown> = {};
    upd[path.join('.')] = FieldValue.delete();
    await docRef.update(upd);
    return;
  }
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

// ─── GET /api/catalog/installation-admin ────────────────────
// Returns the full recursive hierarchical config
installationAdminRouter.get('/', authenticateToken, requireRole(['admin']), async (_req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
    if (!doc.exists) {
      return res.json({ success: true, data: { categories: [] } });
    }

    const data = doc.data() || {};
    const productMap = await getProductMap();

    const categories = Object.entries(data)
      .filter(([categoryKey]) => {
        if (categoryKey.startsWith('_')) return false;
        const catData = data[categoryKey] as Record<string, unknown>;
        if (catData && typeof catData === 'object' && catData[ACTIVE_META_KEY] === false) return false;
        return true;
      })
      .map(([categoryKey, setupsRaw]) => {
        const setups = setupsRaw as Record<string, unknown>;
        const setupEntries = Object.entries(setups)
          .filter(([setupKey]) => setupKey !== ACTIVE_META_KEY)
          .map(([setupKey, productsRaw]) => {
            const products = productsRaw as Record<string, unknown>;
            const isActive = products[ACTIVE_META_KEY] !== false;
            const productSlots = Object.entries(products)
              .filter(([productKey]) => productKey !== ACTIVE_META_KEY)
              .map(([productKey, optionsRaw]) => {
                const options = optionsRaw as Record<string, unknown>;
                const tree = extractTree(options, productMap);
                const hasMultipleTopLevel = tree.length > 1;
                return {
                  key: productKey,
                  options: tree,
                  isClubbed: hasMultipleTopLevel
                };
              });
            return {
              key: setupKey,
              name: setupKey,
              products: productSlots,
              active: isActive
            };
          });
        const catActive = (setups as Record<string, unknown>)[ACTIVE_META_KEY] !== false;
        return {
          key: categoryKey,
          name: categoryKey,
          setups: setupEntries,
          active: catActive
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

// ─── POST /category/:cat/setup/:setup/node — Add an option at any depth
installationAdminRouter.post(
  '/category/:categoryKey/setup/:setupKey/node',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey } = req.params;
      const { nodePath, productId, defaultQty, minQty, maxQty } = req.body as {
        nodePath?: string[]; // e.g. ['Product 2', 'Product 2 Option 1']
        productId?: string; defaultQty?: number; minQty?: number; maxQty?: number;
      };

      if (!productId?.trim()) return res.status(400).json({ success: false, error: 'Product ID is required' });
      if (!Array.isArray(nodePath) || nodePath.length === 0) return res.status(400).json({ success: false, error: 'nodePath is required' });

      const db = getDb();
      const productDoc = await db.collection(PRODUCT_COLLECTION).doc(productId).get();
      if (!productDoc.exists) return res.status(404).json({ success: false, error: `Product ${productId} not found` });

      const productData = productDoc.data()!;
      const rawName = (productData.name ?? productData.productName ?? productId) as string;
      let optionKey = safeKey(rawName);

      const installDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
      const installData = installDoc.exists ? installDoc.data() || {} : {};
      
      let currentLevel = installData[categoryKey as string] as Record<string, unknown> | undefined;
      currentLevel = currentLevel?.[setupKey as string] as Record<string, unknown> | undefined;
      
      for (const segment of nodePath) {
        currentLevel = currentLevel?.[segment] as Record<string, unknown> | undefined;
      }

      const parentNode = currentLevel || {};
      optionKey = uniqueKey(optionKey, parentNode);

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

      const firestorePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}.${optionKey}`;
      await db.collection(SERVICE_COLLECTION).doc('Installation').update({
        [firestorePath]: optionData
      });

      res.json({ success: true, message: `Node "${optionKey}" added`, optionKey });
    } catch (error) {
      console.error('[INSTALL-ADMIN] POST node error:', error);
      res.status(500).json({ success: false, error: 'Failed to add node option' });
    }
  }
);

// ─── DELETE /category/:cat/setup/:setup/node — Remove a node at any depth
installationAdminRouter.delete(
  '/category/:categoryKey/setup/:setupKey/node',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey } = req.params;
      const nodePathStr = req.query.path as string;
      if (!nodePathStr) return res.status(400).json({ success: false, error: 'path array is required in query' });
      
      const nodePath = JSON.parse(nodePathStr);
      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'invalid path array' });
      }

      const db = getDb();
      const firestorePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
      await db.collection(SERVICE_COLLECTION).doc('Installation').update({
        [firestorePath]: FieldValue.delete()
      });

      res.json({ success: true, message: `Node removed` });
    } catch (error) {
      console.error('[INSTALL-ADMIN] DELETE node error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete node' });
    }
  }
);

// ─── PATCH /active — Toggle active status on category or setup ──
installationAdminRouter.patch(
  '/active',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey, active } = req.body as {
        categoryKey?: string;
        setupKey?: string;
        active: boolean;
      };

      if (!categoryKey) {
        return res.status(400).json({ success: false, error: 'categoryKey is required' });
      }

      const db = getDb();
      const docRef = db.collection(SERVICE_COLLECTION).doc('Installation');

      if (setupKey) {
        const path = `${categoryKey}.${setupKey}.${ACTIVE_META_KEY}`;
        await docRef.update({ [path]: active });
        res.json({ success: true, message: `Setup "${setupKey}" ${active ? 'activated' : 'deactivated'}` });
      } else {
        const path = `${categoryKey}.${ACTIVE_META_KEY}`;
        await docRef.update({ [path]: active });
        res.json({ success: true, message: `Category "${categoryKey}" ${active ? 'activated' : 'deactivated'}` });
      }
    } catch (error) {
      console.error('[INSTALL-ADMIN] PATCH active error:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle active status' });
    }
  }
);

// ─── PATCH /category/:cat/setup/:setup/node/quantities — Update min, max, default quantities at any depth
installationAdminRouter.patch(
  '/category/:categoryKey/setup/:setupKey/node/quantities',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey } = req.params;
      const { nodePath, defaultQty, minQty, maxQty } = req.body as { nodePath?: string[]; defaultQty?: number; minQty?: number; maxQty?: number };
      
      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'nodePath array is required' });
      }

      const db = getDb();
      const updates: Record<string, unknown> = {};
      const firestorePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
      
      if (defaultQty !== undefined) updates[`${firestorePath}.Deafult q`] = defaultQty;
      if (minQty !== undefined) updates[`${firestorePath}.min q`] = minQty;
      if (maxQty !== undefined) updates[`${firestorePath}.max q`] = maxQty;
      
      if (Object.keys(updates).length > 0) {
        await db.collection(SERVICE_COLLECTION).doc('Installation').update(updates);
      }
      res.json({ success: true, message: `Quantities updated` });
    } catch (error) {
      console.error('[INSTALL-ADMIN] PATCH quantities error:', error);
      res.status(500).json({ success: false, error: 'Failed to update quantities' });
    }
  }
);

// ─── PATCH /category/:cat/setup/:setup/node/dynamic-field — Add/update primitive fields or maps
installationAdminRouter.patch(
  '/category/:categoryKey/setup/:setupKey/node/dynamic-field',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey } = req.params;
      const { nodePath, value } = req.body as { nodePath?: string[]; value?: any };
      
      if (!Array.isArray(nodePath) || nodePath.length === 0) {
        return res.status(400).json({ success: false, error: 'nodePath array is required' });
      }

      const db = getDb();
      const firestorePath = `${categoryKey}.${setupKey}.${nodePath.join('.')}`;
      
      await db.collection(SERVICE_COLLECTION).doc('Installation').update({
        [firestorePath]: value
      });
      
      res.json({ success: true, message: `Field updated` });
    } catch (error) {
      console.error('[INSTALL-ADMIN] PATCH dynamic-field error:', error);
      res.status(500).json({ success: false, error: 'Failed to update dynamic field' });
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

// ─── PATCH /…/setup/:setupKey/node/render-config — Set renderType, selectionType, collectiveValidation
installationAdminRouter.patch(
  '/category/:categoryKey/setup/:setupKey/node/render-config',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { categoryKey, setupKey } = req.params;
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

      await db.collection(SERVICE_COLLECTION).doc('Installation').update(updates);
      res.json({ success: true, message: 'Render config updated', path: nodePath, renderType });
    } catch (error) {
      console.error('[INSTALL-ADMIN] PATCH render-config error:', error);
      res.status(500).json({ success: false, error: 'Failed to update render config' });
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
