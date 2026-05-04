import { Router } from 'express';
import {
  getServices,
  getInstallationPricing,
  getMaintenancePricing,
  getRepairPricing,
  getAmcConfig,
  getUpgradeBundles,
  getAccessories,
  getAllProducts
} from '../services/catalogService.js';

export const catalogPublicRouter = Router();

// Public endpoints - no authentication required
catalogPublicRouter.get('/services', getServices);
catalogPublicRouter.get('/pricing/installation', getInstallationPricing);
catalogPublicRouter.get('/pricing/maintenance', getMaintenancePricing);
catalogPublicRouter.get('/pricing/repair', getRepairPricing);
catalogPublicRouter.get('/pricing/amc', getAmcConfig);
catalogPublicRouter.get('/upgrade', getUpgradeBundles);
catalogPublicRouter.get('/accessories', getAccessories);
catalogPublicRouter.get('/products', getAllProducts);
