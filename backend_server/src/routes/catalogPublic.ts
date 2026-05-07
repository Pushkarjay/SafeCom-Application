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
import { getCollection } from '../services/firestore.js';
import { DocumentSnapshot } from 'firebase-admin/firestore';

export const catalogPublicRouter = Router();

catalogPublicRouter.get('/services', getServices);
catalogPublicRouter.get('/pricing/installation', getInstallationPricing);
catalogPublicRouter.get('/pricing/maintenance', getMaintenancePricing);
catalogPublicRouter.get('/pricing/repair', getRepairPricing);
catalogPublicRouter.get('/pricing/amc', getAmcConfig);
catalogPublicRouter.get('/upgrade', getUpgradeBundles);
catalogPublicRouter.get('/accessories', getAccessories);
catalogPublicRouter.get('/products', getAllProducts);

catalogPublicRouter.get('/recommendations', async (req, res) => {
  try {
    const placement = req.query.placement as string | undefined;
    const serviceType = req.query.serviceType as string | undefined;

    let query: any = getCollection('catalog_recommendations');

    if (placement) {
      query = query.where('placement', '==', placement);
    }
    if (serviceType) {
      query = query.where('serviceTypes', 'array-contains', serviceType);
    }

    const snapshot = await query.get();
    let recommendations = snapshot.docs.map((doc: DocumentSnapshot) => {
      const data = doc.data() as any;
      return {
        recommendationId: doc.id,
        ...data,
        displayPriority: data.displayPriority ?? data.priority ?? 0
      };
    });

    recommendations = recommendations.filter((r: any) => r.isAvailable !== false);
    recommendations.sort((a: any, b: any) => (a.displayPriority ?? 0) - (b.displayPriority ?? 0));

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        page: 1,
        pageSize: recommendations.length,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching public recommendations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recommendations' });
  }
});