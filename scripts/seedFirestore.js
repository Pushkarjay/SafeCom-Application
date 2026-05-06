const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'safecom-application-01',
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
db.settings({ databaseId: 'safecom-database-nosql' });

async function seedSchema() {
  // PService Collection
  await db.collection('PService').doc('installation').set({
    id: 'installation', name: 'Installation', slug: 'installation', description: 'CCTV installation service',
    icon: 'installation_icon', status: true, visible: true, displayOrder: 1, serviceType: 'dynamic',
    pricingMode: 'configurable', createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  // Add subcollections: variants, pricingRules, mappedProducts
  await db.collection('PService').doc('installation').collection('variants').doc('4-camera-setup').set({
    name: '4 Camera Setup', slug: '4-camera-setup', cameraCount: 4, minQuantity: 1, maxQuantity: 4,
    displayOrder: 1, status: true
  });
  await db.collection('PService').doc('installation').collection('pricingRules').doc('quantity-1-4').set({
    ruleType: 'quantity', min: 1, max: 4, price: 250, unit: 'camera', status: true
  });
  await db.collection('PService').doc('installation').collection('mappedProducts').doc('ip-camera-mapping').set({
    productId: 'ip_camera_2mp', productName: 'IP Camera 2MP', quantity: 4, quantityFormula: 'cameraCount',
    required: true, editable: true, displayOrder: 1
  });

  // Catalog_Product Collection
  await db.collection('Catalog_Product').doc('ip_camera_2mp').set({
    id: 'ip_camera_2mp', sku: 'CAM-IP-2MP', name: 'IP Camera 2MP', category: 'camera', brand: 'Hikvision',
    price: 1800, unit: 'piece', status: true, stockEnabled: false, visible: true, images: [], tags: ['2mp', 'ip camera'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Seed other services
  const services = ['maintenance', 'amc_plan', 'camera_repair', 'system_upgrade', 'accessories', 'recommendation_addons'];
  for (const service of services) {
    await db.collection('PService').doc(service).set({
      id: service, name: service.replace('_', ' ').toUpperCase(), slug: service, description: `${service} service`,
      status: true, visible: true, displayOrder: services.indexOf(service) + 2, serviceType: 'dynamic',
      pricingMode: 'configurable', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log('Schema seeded with initial data.');
}

seedSchema().catch(console.error);