import { Router } from 'express';
import {
  getServices,
  getInstallationPricing,
  getMaintenancePricing,
  getRepairPricing,
  getUpgradeBundles,
  getAccessories
} from '../services/catalogService.js';

export const catalogPublicRouter = Router();

// Public endpoints - no authentication required
catalogPublicRouter.get('/services', getServices);
catalogPublicRouter.get('/pricing/installation', getInstallationPricing);
catalogPublicRouter.get('/pricing/maintenance', getMaintenancePricing);
catalogPublicRouter.get('/pricing/repair', getRepairPricing);
catalogPublicRouter.get('/upgrade', getUpgradeBundles);
catalogPublicRouter.get('/accessories', getAccessories);