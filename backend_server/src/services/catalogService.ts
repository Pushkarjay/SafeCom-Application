import { Request, Response } from 'express';
import { getDb } from './firestore.js';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';

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

function extractProductRef(option: Record<string, unknown>): { id: string } | null {
  const direct = option.Price;
  if (isDocumentReference(direct)) {
    return direct;
  }
  for (const value of Object.values(option)) {
    if (isDocumentReference(value)) {
      return value;
    }
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
      const ref = extractProductRef(opt);
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
        children: []
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
        children
      });
    }
  }
  return options;
}

function toKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Get all service categories (top level)
export const getServices = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection(SERVICE_COLLECTION).get();
    const displayMap: Record<string, { id: string; title: string; icon: string }> = {
      Installation: { id: 'installation', title: 'Installation', icon: '🔧' },
      Maintenance: { id: 'maintenance', title: 'Maintenance', icon: '🛠️' },
      AMC: { id: 'amc', title: 'AMC Plans', icon: '📋' },
      Camera_Repair: { id: 'repair', title: 'Camera Repair', icon: '🪛' },
      Camera_System_Upgrade: { id: 'upgrade', title: 'System Upgrade', icon: '⬆️' },
      Accessories: { id: 'accessories', title: 'Accessories', icon: '🔌' }
    };

    const services = snapshot.docs
      .map((doc) => {
        const display = displayMap[doc.id];
        if (!display) return null;
        return { ...display, enabled: true };
      })
      .filter(Boolean) as Array<{ id: string; title: string; icon: string; enabled: boolean }>;

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

    const categories = Object.entries(data).map(([categoryKey, setups]) => {
      const groups = Object.entries(setups as Record<string, unknown>).map(([setupName, productMapEntry]) => {
        const groupProducts = productMapEntry as Record<string, unknown>;
        const mappedProducts: Array<{
          productKey: string;
          productId: string;
          defaultQty: number;
          minQty: number;
          maxQty: number;
          product: Record<string, unknown>;
          isClubbed: boolean;
          clubbedOptions: ClubbedOption[];
        }> = [];
        for (const [productKey, optionMapEntry] of Object.entries(groupProducts)) {
          const optionMappings = optionMapEntry as Record<string, unknown>;
          const clubbedOptions = extractClubbedOptions(optionMappings, productMap);
          const isClubbed = clubbedOptions.length > 1;
          const firstOption = clubbedOptions[0];
          if (!firstOption) continue;
          const product = productMap.get(firstOption.productId);
          if (!product) continue;
          mappedProducts.push({
            productKey,
            productId: firstOption.productId,
            defaultQty: firstOption.defaultQty,
            minQty: firstOption.minQty,
            maxQty: firstOption.maxQty,
            product: normalizeProduct(firstOption.productId, product),
            isClubbed,
            clubbedOptions
          });
        }
        return {
          id: toKey(setupName),
          name: setupName,
          description: '',
          mappedProducts
        };
      });
      return {
        id: toKey(categoryKey),
        name: categoryKey,
        description: '',
        imageUrl: '',
        groups
      };
    });

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
    const maintenanceTypes = Object.keys(data);
    const itemTemplates: Array<{ key: string; name: string; unitPrice: number; baseQuantity: number; multiplyByVisitCount: boolean; canEditQuantity: boolean }> = [];

    const productSnapshot = await db.collection(PRODUCT_COLLECTION).get();
    const productMap = new Map<string, Record<string, unknown>>();
    productSnapshot.docs.forEach((doc) => productMap.set(doc.id, doc.data()));

    const added = new Set<string>();
    for (const type of maintenanceTypes) {
      const plans = data[type] as Record<string, unknown> | undefined;
      if (!plans) continue;
      for (const [planName, planData] of Object.entries(plans)) {
        if (!MAINTENANCE_PLAN_VISITS[planName]) continue;
        const planMap = planData as Record<string, unknown>;
        for (const [productKey, optionMap] of Object.entries(planMap)) {
          const optionMappings = optionMap as Record<string, unknown>;
          const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
          if (!option) continue;
          const productRef = extractProductRef(option);
          if (!productRef) continue;
          const product = productMap.get(productRef.id);
          if (!product) continue;
          const name = (product.name ?? '').toString();
          if (!name || added.has(name)) continue;
          if (!MAINTENANCE_EDITABLE_ITEMS.has(name) && !MAINTENANCE_FIXED_ITEMS.has(name)) continue;
          const baseQuantity = Number(option['Deafult q'] ?? 1);
          itemTemplates.push({
            key: toKey(name),
            name,
            unitPrice: Number(product.price ?? 0),
            baseQuantity,
            multiplyByVisitCount: MAINTENANCE_FIXED_ITEMS.has(name),
            canEditQuantity: MAINTENANCE_EDITABLE_ITEMS.has(name)
          });
          added.add(name);
        }
      }
    }

    const maintenanceTypeEntries = maintenanceTypes.map((type) => ({
      id: toKey(type),
      name: type,
      icon: MAINTENANCE_ICON_MAP[type] || 'settings_suggest_outlined'
    }));

    const planVisits = Object.entries(MAINTENANCE_PLAN_VISITS).reduce<Record<string, number>>((acc, [planName, count]) => {
      acc[planName.replace(/\s+Plan$/i, '')] = count;
      return acc;
    }, {});

    res.json({
      maintenanceTypes: maintenanceTypeEntries,
      planVisits,
      itemTemplates
    });
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
      const issueProducts = products as Record<string, unknown>;
      let visitFee = 0;
      let diagnosticFee = 0;
      for (const optionMap of Object.values(issueProducts)) {
        const optionMappings = optionMap as Record<string, unknown>;
        const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
        if (!option) continue;
        const productRef = extractProductRef(option);
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

    const plans = Object.entries(data).map(([planName, planData], index) => {
      const planMap = planData as Record<string, unknown>;
      let price = 0;
      for (const optionMap of Object.values(planMap)) {
        const optionMappings = optionMap as Record<string, unknown>;
        const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
        if (!option) continue;
        const productRef = extractProductRef(option);
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

    const bundles = Object.entries(data).map(([bundleName, bundleData]) => {
      const bundleMap = bundleData as Record<string, unknown>;
      let price = 0;
      for (const optionMap of Object.values(bundleMap)) {
        const optionMappings = optionMap as Record<string, unknown>;
        const option = Object.values(optionMappings)[0] as Record<string, unknown> | undefined;
        if (!option) continue;
        const productRef = extractProductRef(option);
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
