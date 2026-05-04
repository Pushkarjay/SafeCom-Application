import { Router } from 'express';
import {
  getServices,
  getInstallationPricing,
  getMaintenancePricing,
  getRepairPricing,
  getUpgradeBundles,
  getAccessories
} from '../services/catalogService.js';
import { getCollection } from '../services/firestore.js';
import type { CatalogService, CatalogAccessory } from '../contracts/canonical_contracts.js';

export const catalogPublicRouter = Router();

// Public endpoints - no authentication required
catalogPublicRouter.get('/services', async (_req, res) => {
  try {
    const snapshot = await getCollection('catalog_services').get();
    const services = snapshot.docs.map((doc) => ({
      serviceId: doc.id,
      ...doc.data()
    })) as CatalogService[];

    return res.json({
      services: services.map((service) => ({
        id: service.serviceId,
        title: service.serviceName,
        icon: service.serviceConfig?.icon ?? '📦',
        enabled: service.isAvailable
      }))
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ error: 'Failed to fetch services' });
  }
});
catalogPublicRouter.get('/pricing/installation', getInstallationPricing);
catalogPublicRouter.get('/pricing/maintenance', getMaintenancePricing);
catalogPublicRouter.get('/pricing/repair', getRepairPricing);
catalogPublicRouter.get('/upgrade', getUpgradeBundles);
catalogPublicRouter.get('/accessories', async (_req, res) => {
  try {
    const snapshot = await getCollection('catalog_accessories').get();
    const items = snapshot.docs.map((doc) => ({
      accessoryId: doc.id,
      ...doc.data()
    })) as CatalogAccessory[];

    return res.json({
      items: items.map((item) => ({
        id: item.accessoryId,
        name: item.name,
        price: item.price,
        description: item.description ?? '',
        category: item.category
      }))
    });
  } catch (error) {
    console.error('Error fetching accessories:', error);
    return res.status(500).json({ error: 'Failed to fetch accessories' });
  }
});
