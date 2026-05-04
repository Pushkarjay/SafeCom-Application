import { Request, Response } from 'express';
import { getDb } from './firestore.js';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Get all services
export const getServices = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const servicesSnapshot = await db.collection('catalog_services').get();
    const services = servicesSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Get installation pricing
export const getInstallationPricing = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection('catalog_pricing').doc('installation').get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Installation pricing not found' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching installation pricing:', error);
    res.status(500).json({ error: 'Failed to fetch installation pricing' });
  }
};

// Get maintenance pricing
export const getMaintenancePricing = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection('catalog_pricing').doc('maintenance').get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Maintenance pricing not found' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching maintenance pricing:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance pricing' });
  }
};

// Get repair pricing
export const getRepairPricing = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection('catalog_pricing').doc('repair').get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Repair pricing not found' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching repair pricing:', error);
    res.status(500).json({ error: 'Failed to fetch repair pricing' });
  }
};

// Get upgrade bundles
export const getUpgradeBundles = async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('catalog_upgrade_bundles').get();
    const bundles = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
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
    const snapshot = await db.collection('catalog_accessories').get();
    const items = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    res.json({ items });
  } catch (error) {
    console.error('Error fetching accessories:', error);
    res.status(500).json({ error: 'Failed to fetch accessories' });
  }
};
