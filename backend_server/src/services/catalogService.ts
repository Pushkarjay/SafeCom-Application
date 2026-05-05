import { Request, Response } from 'express';
import { getDb } from './firestore.js';

// Get all service categories (top level)
export const getServices = async (req: Request, res: Response) => {
  try {
    // Return hardcoded or dynamic list of main services
    const services = [
      { id: 'installation', title: 'Installation', icon: '🔧', enabled: true },
      { id: 'maintenance', title: 'Maintenance', icon: '🛠️', enabled: true },
      { id: 'amc', title: 'AMC Plans', icon: '📋', enabled: true },
      { id: 'repair', title: 'Camera Repair', icon: '🪛', enabled: true },
      { id: 'upgrade', title: 'System Upgrade', icon: '⬆️', enabled: true },
      { id: 'accessories', title: 'Accessories', icon: '🔌', enabled: true }
    ];
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
    
    // Get the base config
    const configDoc = await db.collection('catalog_pricing').doc(serviceId).get();
    if (!configDoc.exists) {
      return res.status(404).json({ error: `${serviceId} configuration not found` });
    }
    
    const config = configDoc.data() || {};
    
    // For installation, we also need categories and groups
    if (serviceId === 'installation') {
      const categoriesSnap = await db.collection('catalog_pricing').doc(serviceId).collection('categories').get();
      const categories = [];
      
      // Fetch all products once to avoid N+1 queries
      const allProductsSnap = await db.collection('catalog_products').get();
      const productsMap = new Map();
      allProductsSnap.docs.forEach(doc => {
        productsMap.set(doc.id, doc.data());
      });

      for (const catDoc of categoriesSnap.docs) {
        const catData = { id: catDoc.id, ...catDoc.data(), groups: [] as any[] };
        
        const groupsSnap = await catDoc.ref.collection('groups').get();
        for (const groupDoc of groupsSnap.docs) {
          const groupData: any = { id: groupDoc.id, ...groupDoc.data(), mappedProducts: [] as any[] };
          
          // resolve product mappings
          if (groupData.mappings && Array.isArray(groupData.mappings)) {
             for (const mapping of groupData.mappings) {
                const pData = productsMap.get(mapping.productId);
                if (pData) {
                   groupData.mappedProducts.push({
                      ...mapping,
                      product: { 
                        productId: mapping.productId, 
                        productName: pData?.name || '',
                        description: pData?.description || '',
                        category: pData?.category || '',
                        group: pData?.group || '',
                        basePrice: pData?.price || 0,
                        isAvailable: pData?.status === 'active'
                      }
                   });
                }
             }
          }
          catData.groups.push(groupData);
        }
        categories.push(catData);
      }
      config.categories = categories;
    }

    // For maintenance, repair, amc, upgrade — the document already contains the full config
    // (planVisits, itemTemplates, issues, plans, bundles) so we just return it directly.

    res.json(config);
  } catch (error) {
    console.error(`Error fetching ${serviceId} config:`, error);
    res.status(500).json({ error: `Failed to fetch ${serviceId} config` });
  }
};

export const getInstallationPricing = (req: Request, res: Response) => getServiceConfig('installation', req, res);
export const getMaintenancePricing = (req: Request, res: Response) => getServiceConfig('maintenance', req, res);
export const getRepairPricing = (req: Request, res: Response) => getServiceConfig('repair', req, res);
export const getAmcConfig = (req: Request, res: Response) => getServiceConfig('amc', req, res);
export const getUpgradeBundles = (req: Request, res: Response) => getServiceConfig('upgrade', req, res);

// Get accessories
export const getAccessories = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('catalog_products')
      .where('category', '==', 'accessories')
      .where('status', '==', 'active')
      .get();
      
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        productId: doc.id,
        productName: data.name || '',
        description: data.description || '',
        category: data.category || '',
        group: data.group || '',
        basePrice: data.price || 0,
        isAvailable: data.status === 'active'
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
    const snapshot = await db.collection('catalog_products').where('status', '==', 'active').get();
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        productId: doc.id,
        productName: data.name || '',
        description: data.description || '',
        category: data.category || '',
        group: data.group || '',
        basePrice: data.price || 0,
        isAvailable: data.status === 'active'
      };
    });
    res.json({ products });
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Failed to fetch all products' });
  }
};
