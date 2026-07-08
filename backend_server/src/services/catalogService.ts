import { Request, Response } from 'express';
import { getDb } from './firestore.js';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';
const ACTIVE_META_KEY = '_isActive';

const MAINTENANCE_ICON_MAP: Record<string, string> = {
  'Preventive Maintenance': 'settings_suggest_outlined',
  'Fault Diagnosis': 'troubleshoot',
  'Performance Tuning': 'tune'
};

const MAINTENANCE_PLAN_VISITS: Record<string, number> = {
  'Basic Plan': 1,
  'Standard Plan': 2,
  'Comprehensive Plan': 4
};

const UPGRADE_DESCRIPTIONS: Record<string, string> = {
  '2MP to 5MP Upgrade': 'Upgrade existing cameras for better clarity.',
  'NVR + Storage Upgrade': 'Increase channel and storage capacity.',
  'Full Surveillance Upgrade': 'Camera, NVR, and network optimization bundle.'
};

const MAINTENANCE_FIXED_ITEMS = new Set([
  'System Inspection Visit',
  'Service Labor Charges'
]);

const MAINTENANCE_EDITABLE_ITEMS = new Set([
  'Camera Cleaning & Refocus',
  'NVR/DVR Health Check',
  'Minor Rewiring Support'
]);

const REPAIR_EDITABLE_ITEMS = new Set([
  'Camera Repair Unit',
  'Connector Replacement'
]);

function isDocumentReference(value: unknown): value is { id: string } {
  return Boolean(value && typeof value === 'object' && 'id' in (value as Record<string, unknown>));
}

function extractProductRef(
  option: Record<string, unknown>,
  productMap?: Map<string, Record<string, unknown>>
): { id: string } | null {
  // 1. Explicit Reference in "Price" field
  if (isDocumentReference(option.Price)) {
    return option.Price as { id: string };
  }

  // 2. String ID in "Price" field
  if (typeof option.Price === 'string' && productMap?.has(option.Price)) {
    return { id: option.Price };
  }

  // 3. Scan for keys ending in " ID" (common in legacy schema)
  for (const [k, v] of Object.entries(option)) {
    if (k.toLowerCase().endsWith(' id')) {
      if (isDocumentReference(v)) return v as { id: string };
      if (typeof v === 'string' && productMap?.has(v)) return { id: v };
    }
  }

  // 4. Fallback: scan all values for any reference or known string ID
  for (const value of Object.values(option)) {
    if (isDocumentReference(value)) return value as { id: string };
    if (typeof value === 'string' && productMap?.has(value)) return { id: value };
  }

  return null;
}

function normalizeProduct(productId: string, data: Record<string, unknown>) {
  return {
    id: productId,
    productName: (data.name ?? data.productName ?? '').toString(),
    description: (data.description ?? '').toString(),
    category: (data.category ?? '').toString(),
    group: data.group ? data.group.toString() : undefined,
    basePrice: Number(data.price ?? data.basePrice ?? 0),
    isAvailable: data.status ? data.status === 'active' : (data.isAvailable ?? true),
    imageUrl: data.imageUrl ? data.imageUrl.toString() : undefined,
    stock: data.stock !== undefined ? Number(data.stock) : undefined,
    taxRate: data.taxRate !== undefined ? Number(data.taxRate) : undefined
  };
}

interface ClubbedOption {
  optionKey: string;
  productId: string;
  productName: string;
  price: number;
  category: string;
  defaultQty: number;
  minQty: number;
  maxQty: number;
  available: boolean;
  rigid: boolean;
  isLeaf: boolean;
  children: ClubbedOption[];
  renderType?: string;           // 'option' | 'list'
  selectionType?: string;        // 'single' | 'multi'
  collectiveValidation?: boolean; // for LIST groups
  displayLabel?: string;         // human-readable label override
  mandatory?: boolean;           // whether customer must select
  dependsOn?: string;            // product key this leaf's quantity depends on
}

/**
 * Detect whether a Firestore map is a LEAF node (has product detail fields)
 * or a BRANCH node (children are maps that need further traversal).
 *
 * Leaf signature: contains 'Deafult q', 'Price', 'available', etc.
 */
function isLeafNode(obj: Record<string, unknown>): boolean {
  return (
    obj.hasOwnProperty('Price') ||
    obj.hasOwnProperty('Deafult q') ||
    obj.hasOwnProperty('available') ||
    obj.hasOwnProperty('rigid')
  );
}

/**
 * Recursively extract clubbed options from a deeply nested Firestore map.
 *
 * Schema pattern:
 *   Product N (map) →
 *     Product N Option M (map) →
 *       Product N Option M sub K (map) →
 *         ... → LEAF { Deafult q, Price, available, rigid, min q, max q }
 *
 * If a node is a LEAF → extract product details from catalog reference.
 * If a node is a BRANCH → recurse into children.
 */
function extractClubbedOptions(
  productSlot: Record<string, unknown>,
  productMap: Map<string, Record<string, unknown>>
): ClubbedOption[] {
  const options: ClubbedOption[] = [];
  for (const [optionKey, optionData] of Object.entries(productSlot)) {
    if (optionData === null || optionData === undefined || typeof optionData !== 'object') {
      continue; // skip primitives at this level
    }
    const opt = optionData as Record<string, unknown>;

    if (isLeafNode(opt)) {
      // LEAF: extract product reference and details
      const ref = extractProductRef(opt, productMap);
      const catalogProduct = ref ? productMap.get(ref.id) : null;
      options.push({
        optionKey,
        productId: ref?.id || '',
        productName: catalogProduct ? String(catalogProduct.name || catalogProduct.productName || '') : optionKey,
        price: catalogProduct ? Number(catalogProduct.price || catalogProduct.basePrice || 0) : 0,
        category: catalogProduct ? String(catalogProduct.category || '') : '',
        defaultQty: Number(opt['Deafult q'] ?? 1),
        minQty: Number(opt['min q'] ?? 0),
        maxQty: Number(opt['max q'] ?? 999),
        available: opt.available !== false,
        rigid: opt.rigid === true,
        isLeaf: true,
        children: [],
        renderType: typeof opt['renderType'] === 'string' ? (opt['renderType'] as string) : undefined,
        selectionType: typeof opt['selectionType'] === 'string' ? (opt['selectionType'] as string) : undefined,
        collectiveValidation: Boolean(opt['collectiveValidation']),
        displayLabel: typeof opt['displayLabel'] === 'string' ? (opt['displayLabel'] as string) : undefined,
        mandatory: opt['mandatory'] !== false,
        dependsOn: typeof opt['dependsOn'] === 'string' ? (opt['dependsOn'] as string) : undefined,
      });
    } else {
      // BRANCH: children are maps — recurse
      const children = extractClubbedOptions(opt, productMap);
      options.push({
        optionKey,
        productId: '',
        productName: optionKey, // branch label is the key itself
        price: 0,
        category: '',
        defaultQty: 1,
        minQty: 0,
        maxQty: 999,
        available: true,
        rigid: false,
        isLeaf: false,
        children,
        renderType: typeof opt['renderType'] === 'string' ? (opt['renderType'] as string) : undefined,
        selectionType: typeof opt['selectionType'] === 'string' ? (opt['selectionType'] as string) : undefined,
        collectiveValidation: Boolean(opt['collectiveValidation']),
        displayLabel: typeof opt['displayLabel'] === 'string' ? (opt['displayLabel'] as string) : undefined,
        mandatory: opt['mandatory'] !== false,
        dependsOn: typeof opt['dependsOn'] === 'string' ? (opt['dependsOn'] as string) : undefined,
      });
    }
  }
  return options;
}

/** Recursively collect ALL leaf nodes from a clubbed option tree. */
function collectAllLeaves(options: ClubbedOption[]): ClubbedOption[] {
  const leaves: ClubbedOption[] = [];
  for (const opt of options) {
    if (opt.isLeaf) {
      leaves.push(opt);
    } else if (opt.children.length > 0) {
      leaves.push(...collectAllLeaves(opt.children));
    }
  }
  return leaves;
}

function toKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const ORDER_META_KEY = '_order';

/** Sort [key, value] entries by their _order field (missing = Infinity → end). */
function sortByOrder(entries: [string, unknown][]): [string, unknown][] {
  return entries.sort((a, b) => {
    const aVal = a[1] as Record<string, unknown> | undefined;
    const bVal = b[1] as Record<string, unknown> | undefined;
    const aOrder = (aVal && typeof aVal === 'object') ? Number((aVal as any)[ORDER_META_KEY] ?? Infinity) : Infinity;
    const bOrder = (bVal && typeof bVal === 'object') ? Number((bVal as any)[ORDER_META_KEY] ?? Infinity) : Infinity;
    return aOrder - bOrder;
  });
}

/** Sort an array of objects with an `order` field. */
function sortMappedByOrder<T extends { order?: number }>(items: T[]): T[] {
  return items.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

// Get all service categories (top level)
export const getServices = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(SERVICE_COLLECTION).get();
    
    // Hardcoded defaults for built-in services
    const displayMap: Record<string, { id: string; title: string; icon: string }> = {
      Installation: { id: 'installation', title: 'Installation', icon: '🔧' },
      Maintenance: { id: 'maintenance', title: 'Maintenance', icon: '🛠️' },
      AMC: { id: 'amc', title: 'AMC Plans', icon: '📋' },
      Camera_Repair: { id: 'repair', title: 'Camera Repair', icon: '🪛' },
      Camera_System_Upgrade: { id: 'upgrade', title: 'System Upgrade', icon: '⬆️' },
      Accessories: { id: 'accessories', title: 'Accessories', icon: '🔌' },
      Recommendation_Addons: { id: 'recommendations', title: 'Recommendations', icon: '💡' },
    };

    // Track which IDs we've already added so we don't duplicate
    const seenIds = new Set<string>();
    const services: Array<{ id: string; title: string; icon: string; enabled: boolean }> = [];

    // 1. First, add all hardcoded built-in services that actually exist in Firestore
    for (const doc of snapshot.docs) {
      const display = displayMap[doc.id];
      if (display) {
        const data = doc.data() || {};
        const meta = data._meta as Record<string, unknown> | undefined;
        const enabled = meta?.enabled as boolean ?? true;
        if (!enabled) continue;
        // Use _meta overrides if available, otherwise use hardcoded defaults
        services.push({
          id: display.id,
          title: (meta?.title as string) || display.title,
          icon: (meta?.icon as string) || display.icon,
          enabled,
        });
        seenIds.add(doc.id.toLowerCase());
      }
    }

    // 2. Add dynamically created services (those with _meta that aren't in the hardcoded map)
    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      const meta = data._meta as Record<string, unknown> | undefined;
      
      if (!meta || seenIds.has(doc.id.toLowerCase())) continue;
      
      const enabled = meta.enabled as boolean ?? true;
      if (!enabled) continue;

      const title = (meta.title as string) || doc.id;
      const icon = (meta.icon as string) || '🔧';
      const safeId = doc.id
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      services.push({
        id: safeId || doc.id,
        title,
        icon,
        enabled,
      });
    }

    // 3. Fallback: if nothing was found, return the hardcoded defaults
    if (services.length === 0) {
      const fallback = Object.values(displayMap).map((entry) => ({ ...entry, enabled: true }));
      return res.json({ services: fallback });
    }

    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Generic function to get a service config
const getServiceConfig = async (serviceId: string, req: Request, res: Response) => {
  try {
    const db = getDb();
    const configDoc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
    if (!configDoc.exists) {
      return res.status(404).json({ error: `${serviceId} configuration not found` });
    }
    const config = configDoc.data() || {};
    res.json(config);
  } catch (error) {
    console.error(`Error fetching ${serviceId} config:`, error);
    res.status(500).json({ error: `Failed to fetch ${serviceId} config` });
  }
};

/**
 * Find the first leaf node in a ClubbedOption tree (depth-first).
 */
function findFirstLeafInTree(options: ClubbedOption[]): ClubbedOption | undefined {
  for (const opt of options) {
    if (opt.isLeaf) return opt;
    const found = findFirstLeafInTree(opt.children);
    if (found) return found;
  }
  return undefined;
}

export const getInstallationPricing = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const installationDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
    if (!installationDoc.exists) {
      return res.status(404).json({ error: 'Installation configuration not found' });
    }

    const data = installationDoc.data() || {};
    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const categories = sortByOrder(Object.entries(data)
      .filter(([categoryKey]) => {
        const catData = data[categoryKey] as Record<string, unknown>;
        if (catData && typeof catData === 'object' && catData[ACTIVE_META_KEY] === false) return false;
        return true;
      }))
      .map(([categoryKey, setups]) => {
        const catData = setups as Record<string, unknown>;
        const catOrder = Number(catData?.[ORDER_META_KEY] ?? Infinity);
        const groups = sortByOrder(Object.entries(catData)
          .filter(([setupName]) => setupName !== ACTIVE_META_KEY && setupName !== ORDER_META_KEY)
          .filter(([setupName]) => {
            const setupData = catData[setupName] as Record<string, unknown>;
            if (setupData && typeof setupData === 'object' && setupData[ACTIVE_META_KEY] === false) return false;
            return true;
          }))
          .map(([setupName, productMapEntry]) => {
            const groupProducts = productMapEntry as Record<string, unknown>;
            const setupOrder = Number(groupProducts?.[ORDER_META_KEY] ?? Infinity);
            const mappedProducts: Array<{
              productKey: string;
              productId: string;
              defaultQty: number;
              minQty: number;
              maxQty: number;
              product: Record<string, unknown>;
              isClubbed: boolean;
              clubbedOptions: ClubbedOption[];
              renderType?: string;
              collectiveValidation?: boolean;
              displayLabel?: string;
              mandatory?: boolean;
              dependsOn?: string;
              order?: number;
            }> = [];
            for (const [productKey, optionMapEntry] of sortByOrder(Object.entries(groupProducts).filter(([k]) => k !== ORDER_META_KEY))) {
          const optionMappings = optionMapEntry as Record<string, unknown>;
          const prodOrder = Number(optionMappings?.[ORDER_META_KEY] ?? Infinity);
          const clubbedOptions = extractClubbedOptions(optionMappings, productMap);
          const isClubbed = clubbedOptions.length > 1;
          const firstLeaf = findFirstLeafInTree(clubbedOptions);
          if (!firstLeaf) continue;
          const product = productMap.get(firstLeaf.productId);
          if (!product) continue;
          const slotMaxQty = Number((optionMappings as Record<string, unknown>)['max q']) || 0;
          const rawDependsOn = (optionMappings as Record<string, unknown>)['dependsOn'];
          const slotDependsOn = typeof rawDependsOn === 'string' ? rawDependsOn : undefined;
          // Recursively collect ALL leaves (not just direct children) for correct maxQty
          const allLeaves = collectAllLeaves(clubbedOptions);
          const allLeafMaxes = allLeaves.map((o) => o.maxQty);
          const computedMax = allLeafMaxes.length > 0
            ? Math.max(...allLeafMaxes)
            : firstLeaf.maxQty;
          mappedProducts.push({
            productKey,
            productId: firstLeaf.productId,
            defaultQty: firstLeaf.defaultQty,
            minQty: firstLeaf.minQty,
            maxQty: slotMaxQty || computedMax,
            product: normalizeProduct(firstLeaf.productId, product),
            isClubbed,
            clubbedOptions,
            renderType: firstLeaf.renderType || 'option',
            collectiveValidation: firstLeaf.collectiveValidation ?? false,
            displayLabel: firstLeaf.displayLabel,
            mandatory: firstLeaf.mandatory !== false,
            dependsOn: slotDependsOn || firstLeaf.dependsOn,
            order: prodOrder,
          });
        }
        sortMappedByOrder(mappedProducts);
        return {
          id: toKey(setupName),
          name: setupName,
          description: '',
          mappedProducts,
          order: setupOrder,
        };
      });
      sortMappedByOrder(groups);
      return {
        id: toKey(categoryKey),
        name: categoryKey,
        description: '',
        imageUrl: '',
        groups,
        order: catOrder,
      };
    });
    sortMappedByOrder(categories as any);
    res.json({ name: 'Installation', categories });
  } catch (error) {
    console.error('Error fetching installation config:', error);
    res.status(500).json({ error: 'Failed to fetch installation config' });
  }
};
export const getMaintenancePricing = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const maintenanceDoc = await db.collection(SERVICE_COLLECTION).doc('Maintenance').get();
    if (!maintenanceDoc.exists) {
      return res.status(404).json({ error: 'Maintenance configuration not found' });
    }

    const data = maintenanceDoc.data() || {};
    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const categories = sortByOrder(Object.entries(data)
      .filter(([categoryKey]) => {
        if (categoryKey === '_meta') return false;
        const catData = data[categoryKey] as Record<string, unknown>;
        if (catData && typeof catData === 'object' && catData[ACTIVE_META_KEY] === false) return false;
        return true;
      }))
      .map(([categoryKey, setups]) => {
        const catData = setups as Record<string, unknown>;
        const catOrder = Number(catData?.[ORDER_META_KEY] ?? Infinity);
        const groups = sortByOrder(Object.entries(catData)
          .filter(([setupName]) => setupName !== ACTIVE_META_KEY && setupName !== ORDER_META_KEY)
          .filter(([setupName]) => {
            const setupData = catData[setupName] as Record<string, unknown>;
            if (setupData && typeof setupData === 'object' && setupData[ACTIVE_META_KEY] === false) return false;
            return true;
          }))
          .map(([setupName, productMapEntry]) => {
            const groupProducts = productMapEntry as Record<string, unknown>;
            const setupOrder = Number(groupProducts?.[ORDER_META_KEY] ?? Infinity);
            const mappedProducts: Array<{
              productKey: string;
              productId: string;
              defaultQty: number;
              minQty: number;
              maxQty: number;
              product: Record<string, unknown>;
              isClubbed: boolean;
              clubbedOptions: ClubbedOption[];
              renderType?: string;
              collectiveValidation?: boolean;
              displayLabel?: string;
              mandatory?: boolean;
              dependsOn?: string;
              order?: number;
            }> = [];
            for (const [productKey, optionMapEntry] of sortByOrder(Object.entries(groupProducts).filter(([k]) => k !== ORDER_META_KEY))) {
          const optionMappings = optionMapEntry as Record<string, unknown>;
          const prodOrder = Number(optionMappings?.[ORDER_META_KEY] ?? Infinity);
          const clubbedOptions = extractClubbedOptions(optionMappings, productMap);
          const isClubbed = clubbedOptions.length > 1;
          const firstLeaf = findFirstLeafInTree(clubbedOptions);
          if (!firstLeaf) continue;
          const product = productMap.get(firstLeaf.productId);
          if (!product) continue;
          const slotMaxQty = Number((optionMappings as Record<string, unknown>)['max q']) || 0;
          const rawDependsOn = (optionMappings as Record<string, unknown>)['dependsOn'];
          const slotDependsOn = typeof rawDependsOn === 'string' ? rawDependsOn : undefined;
          const allLeaves = collectAllLeaves(clubbedOptions);
          const allLeafMaxes = allLeaves.map((o) => o.maxQty);
          const computedMax = allLeafMaxes.length > 0
            ? Math.max(...allLeafMaxes)
            : firstLeaf.maxQty;
          mappedProducts.push({
            productKey,
            productId: firstLeaf.productId,
            defaultQty: firstLeaf.defaultQty,
            minQty: firstLeaf.minQty,
            maxQty: slotMaxQty || computedMax,
            product: normalizeProduct(firstLeaf.productId, product),
            isClubbed,
            clubbedOptions,
            renderType: firstLeaf.renderType || 'option',
            collectiveValidation: firstLeaf.collectiveValidation ?? false,
            displayLabel: firstLeaf.displayLabel,
            mandatory: firstLeaf.mandatory !== false,
            dependsOn: slotDependsOn || firstLeaf.dependsOn,
            order: prodOrder,
          });
        }
        sortMappedByOrder(mappedProducts);
        return {
          id: toKey(setupName),
          name: setupName,
          description: '',
          mappedProducts,
          order: setupOrder,
        };
      });
      sortMappedByOrder(groups);
      return {
        id: toKey(categoryKey),
        name: categoryKey,
        description: '',
        imageUrl: '',
        groups,
        order: catOrder,
      };
    });
    sortMappedByOrder(categories as any);
    res.json({ name: 'Maintenance', categories });
  } catch (error) {
    console.error('Error fetching maintenance config:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance config' });
  }
};

export const getRepairPricing = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const repairDoc = await db.collection(SERVICE_COLLECTION).doc('Camera_Repair').get();
    if (!repairDoc.exists) {
      return res.status(404).json({ error: 'Repair configuration not found' });
    }

    const data = repairDoc.data() || {};
    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const issues: Array<{ id: string; title: string; visitFee: number; diagnosticFee: number }> = [];
    const templates: Array<{ key: string; name: string; unitPrice: number; quantity: number; canEditQuantity: boolean }> = [];

    for (const [issueName, products] of Object.entries(data)) {
      if (issueName === '_meta' || issueName === ACTIVE_META_KEY) continue; // skip metadata
      const issueProducts = products as Record<string, unknown>;
      if (typeof issueProducts === 'object' && issueProducts[ACTIVE_META_KEY] === false) continue;
      let visitFee = 0;
      let diagnosticFee = 0;
      for (const optionMap of Object.values(issueProducts)) {
        const optionMappings = optionMap as Record<string, unknown>;
        const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
        if (!option) continue;
        const productRef = extractProductRef(option, productMap);
        if (!productRef) continue;
        const product = productMap.get(productRef.id);
        if (!product) continue;
        const name = (product.name ?? '').toString();
        if (name === 'Service Visit Fee') {
          visitFee = Number(product.price ?? 0);
        }
        if (name === 'Diagnostic Charges') {
          diagnosticFee = Number(product.price ?? 0);
        }
        if (REPAIR_EDITABLE_ITEMS.has(name) && !templates.find((t) => t.name === name)) {
          templates.push({
            key: toKey(name),
            name,
            unitPrice: Number(product.price ?? 0),
            quantity: Number(option['Deafult q'] ?? 1),
            canEditQuantity: true
          });
        }
      }
      if (!visitFee && !diagnosticFee) {
        const estimateMap: Record<string, number> = {
          'No Video Output': 698,
          'Night Vision Not Working': 648,
          'Blurry / Distorted Image': 648,
          'Other Issue': 848
        };
        const estimate = estimateMap[issueName] ?? 0;
        if (estimate) {
          visitFee = Math.round(estimate * 0.46);
          diagnosticFee = estimate - visitFee;
        }
      }
      issues.push({
        id: toKey(issueName),
        title: issueName,
        visitFee,
        diagnosticFee
      });
    }

    res.json({
      issues,
      itemTemplates: templates
    });
  } catch (error) {
    console.error('Error fetching repair config:', error);
    res.status(500).json({ error: 'Failed to fetch repair config' });
  }
};

export const getAmcConfig = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const amcDoc = await db.collection(SERVICE_COLLECTION).doc('AMC').get();
    if (!amcDoc.exists) {
      return res.status(404).json({ error: 'AMC configuration not found' });
    }

    const data = amcDoc.data() || {};
    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const plans = Object.entries(data)
      .filter(([planName]) => planName !== '_meta' && planName !== ACTIVE_META_KEY)
      .filter(([planName]) => {
        const planData = data[planName] as Record<string, unknown>;
        if (planData && typeof planData === 'object' && planData[ACTIVE_META_KEY] === false) return false;
        return true;
      })
      .map(([planName, planData], index) => {
      const planMap = planData as Record<string, unknown>;
      let price = 0;
      for (const optionMap of Object.values(planMap)) {
        const optionMappings = optionMap as Record<string, unknown>;
        const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
        if (!option) continue;
        const productRef = extractProductRef(option, productMap);
        if (!productRef) continue;
        const product = productMap.get(productRef.id);
        if (!product) continue;
        price += Number(product.price ?? 0) * Number(option['Deafult q'] ?? 1);
      }
      if (!price) {
        const estimateMap: Record<string, number> = {
          'Basic Plan': 4239,
          'Standard Plan': 5337,
          'Comprehensive Plan': 7533
        };
        price = estimateMap[planName] ?? 0;
      }
      return {
        id: toKey(planName),
        name: planName,
        subtitle: 'Annual coverage',
        price,
        features: [],
        order: index + 1
      };
    });

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching AMC config:', error);
    res.status(500).json({ error: 'Failed to fetch AMC config' });
  }
};

export const getUpgradeBundles = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const upgradeDoc = await db.collection(SERVICE_COLLECTION).doc('Camera_System_Upgrade').get();
    if (!upgradeDoc.exists) {
      return res.status(404).json({ error: 'Upgrade configuration not found' });
    }

    const data = upgradeDoc.data() || {};
    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const bundles = Object.entries(data)
      .filter(([bundleName]) => bundleName !== '_meta' && bundleName !== ACTIVE_META_KEY)
      .filter(([bundleName]) => {
        const bundleData = data[bundleName] as Record<string, unknown>;
        if (bundleData && typeof bundleData === 'object' && bundleData[ACTIVE_META_KEY] === false) return false;
        return true;
      })
      .map(([bundleName, bundleData]) => {
      const bundleMap = bundleData as Record<string, unknown>;
      let price = 0;
      for (const optionMap of Object.values(bundleMap)) {
        const optionMappings = optionMap as Record<string, unknown>;
        const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
        if (!option) continue;
        const productRef = extractProductRef(option, productMap);
        if (!productRef) continue;
        const product = productMap.get(productRef.id);
        if (!product) continue;
        price += Number(product.price ?? 0) * Number(option['Deafult q'] ?? 1);
      }
      return {
        id: toKey(bundleName),
        name: bundleName,
        description: UPGRADE_DESCRIPTIONS[bundleName] || '',
        price
      };
    });

    res.json({ bundles });
  } catch (error) {
    console.error('Error fetching upgrade bundles:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade bundles' });
  }
};

// Get accessories
export const getAccessories = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(PRODUCT_COLLECTION)
      .where('group', '==', 'Accessories')
      .where('status', '==', 'active')
      .get();
    
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      const normalized = normalizeProduct(doc.id, data);
      return { 
        productId: doc.id,
        productName: normalized.productName,
        description: normalized.description,
        category: normalized.category,
        group: normalized.group ?? '',
        basePrice: normalized.basePrice,
        isAvailable: normalized.isAvailable
      };
    });
    res.json({ items });
  } catch (error) {
    console.error('Error fetching accessories:', error);
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
};

/**
 * Generic handler: parse any service document into the standard pricing format
 * (categories → groups → mappedProducts with clubbed options resolved).
 * Same logic as getInstallationPricing but works for any service.
 *
 * Query params:
 *   serviceType - if provided, only categories whose _serviceMapping contains this value are returned
 */
export const getDynamicServicePricing = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string;
    const serviceTypeFilter = req.query.serviceType as string | undefined;
    const db = getDb();

    // Resolve serviceId to actual Firestore document ID
    const resolvedDoc = await resolveServiceDoc(serviceId);
    if (!resolvedDoc) {
      return res.status(404).json({ error: `Service "${serviceId}" not found` });
    }

    const data = resolvedDoc.data() || {};
    const meta = (data._meta || {}) as Record<string, unknown>;
    const serviceName = (meta.title as string) || resolvedDoc.id;

    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const categories = sortByOrder(Object.entries(data)
      .filter(([categoryKey]) => {
        if (categoryKey.startsWith('_')) return false;
        const catData = data[categoryKey] as Record<string, unknown>;
        if (catData && typeof catData === 'object' && catData[ACTIVE_META_KEY] === false) return false;
        // If serviceType filter is provided, only include categories whose _serviceMapping contains it
        if (serviceTypeFilter) {
          const mapping = catData?.['_serviceMapping'];
          const mappingArr = Array.isArray(mapping) ? mapping : (typeof mapping === 'string' ? [mapping] : []);
          if (mappingArr.length > 0 && !mappingArr.includes(serviceTypeFilter)) return false;
        }
        return true;
      }))
      .map(([categoryKey, setups]) => {
        const catData = setups as Record<string, unknown>;
        const catOrder = Number(catData?.[ORDER_META_KEY] ?? Infinity);
        const groups = sortByOrder(Object.entries(catData)
          .filter(([setupName]) => !setupName.startsWith('_'))
          .filter(([setupName]) => {
            const setupData = catData[setupName] as Record<string, unknown>;
            if (setupData && typeof setupData === 'object' && setupData[ACTIVE_META_KEY] === false) return false;
            return true;
          }))
          .map(([setupName, productMapEntry]) => {
            const groupProducts = productMapEntry as Record<string, unknown>;
            const setupOrder = Number(groupProducts?.[ORDER_META_KEY] ?? Infinity);
            const mappedProducts: Array<{
              productKey: string;
              productId: string;
              defaultQty: number;
              minQty: number;
              maxQty: number;
              product: Record<string, unknown>;
              isClubbed: boolean;
              clubbedOptions: ClubbedOption[];
              renderType?: string;
              collectiveValidation?: boolean;
              displayLabel?: string;
              mandatory?: boolean;
              dependsOn?: string;
              order?: number;
            }> = [];
            for (const [productKey, optionMapEntry] of sortByOrder(Object.entries(groupProducts).filter(([k]) => !k.startsWith('_')))) {
              const optionMappings = optionMapEntry as Record<string, unknown>;
              const prodOrder = Number(optionMappings?.[ORDER_META_KEY] ?? Infinity);
              const clubbedOptions = extractClubbedOptions(optionMappings, productMap);
              const isClubbed = clubbedOptions.length > 1;
              const firstLeaf = findFirstLeafInTree(clubbedOptions);
              if (!firstLeaf) continue;
              const product = productMap.get(firstLeaf.productId);
              if (!product) continue;
              const slotMaxQty = Number((optionMappings as Record<string, unknown>)['max q']) || 0;
              const rawDependsOn = (optionMappings as Record<string, unknown>)['dependsOn'];
              const slotDependsOn = typeof rawDependsOn === 'string' ? rawDependsOn : undefined;
              const allLeaves = collectAllLeaves(clubbedOptions);
              const allLeafMaxes = allLeaves.map((o) => o.maxQty);
              const computedMax = allLeafMaxes.length > 0
                ? Math.max(...allLeafMaxes)
                : firstLeaf.maxQty;
              mappedProducts.push({
                productKey,
                productId: firstLeaf.productId,
                defaultQty: firstLeaf.defaultQty,
                minQty: firstLeaf.minQty,
                maxQty: slotMaxQty || computedMax,
                product: normalizeProduct(firstLeaf.productId, product),
                isClubbed,
                clubbedOptions,
                renderType: firstLeaf.renderType || 'option',
                collectiveValidation: firstLeaf.collectiveValidation ?? false,
                displayLabel: firstLeaf.displayLabel,
                mandatory: firstLeaf.mandatory !== false,
                dependsOn: slotDependsOn || firstLeaf.dependsOn,
                order: prodOrder,
              });
            }
            sortMappedByOrder(mappedProducts);
            return {
              id: toKey(setupName),
              name: setupName,
              description: '',
              mappedProducts,
              order: setupOrder,
            };
          });
        sortMappedByOrder(groups);
        return {
          id: toKey(categoryKey),
          name: categoryKey,
          description: '',
          imageUrl: '',
          groups,
          order: catOrder,
        };
      });
    sortMappedByOrder(categories as any);
    res.json({ name: serviceName, categories });
  } catch (error) {
    console.error(`Error fetching dynamic service pricing:`, error);
    res.status(500).json({ error: 'Failed to fetch service pricing' });
  }
};

/**
 * Resolve a safe serviceId to the actual Firestore document.
 * Tries direct match, capitalized match, and safeId scanning.
 */
async function resolveServiceDoc(serviceId: string) {
  const db = getDb();
  // Direct match
  let doc = await db.collection(SERVICE_COLLECTION).doc(serviceId).get();
  if (doc.exists) return doc;
  // Capitalized first letter
  const capitalized = serviceId.charAt(0).toUpperCase() + serviceId.slice(1);
  doc = await db.collection(SERVICE_COLLECTION).doc(capitalized).get();
  if (doc.exists) return doc;
  // Scan all docs and match by safe ID
  const snapshot = await db.collection(SERVICE_COLLECTION).get();
  for (const d of snapshot.docs) {
    const safeId = d.id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (safeId === serviceId) return d;
  }
  return null;
}

// Get all master products (useful for discovery page)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(PRODUCT_COLLECTION).where('status', '==', 'active').get();
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      const normalized = normalizeProduct(doc.id, data);
      return { 
        productId: doc.id,
        productName: normalized.productName,
        description: normalized.description,
        category: normalized.category,
        group: normalized.group ?? '',
        basePrice: normalized.basePrice,
        isAvailable: normalized.isAvailable
      };
    });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Failed to fetch all products' });
  }
};
