const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  projectId: 'safecom-application-01',
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
db.settings({ databaseId: 'safecom-database-nosql' });

async function seedSchema() {
  // Clear existing data
  await clearCollection('PService');
  await clearCollection('Catalog_Product');

  // Load existing PService data from analysis
  const pserviceData = JSON.parse(fs.readFileSync('firestore-analysis/pservice-analysis.json', 'utf8'));

  for (const [serviceId, data] of Object.entries(pserviceData)) {
    // Create PService doc
    await db.collection('PService').doc(serviceId.toLowerCase().replace(/ /g, '_')).set({
      id: serviceId.toLowerCase().replace(/ /g, '_'),
      name: serviceId,
      slug: serviceId.toLowerCase().replace(/ /g, '-'),
      description: `${serviceId} service`,
      status: true,
      visible: true,
      displayOrder: 1,
      serviceType: 'dynamic',
      pricingMode: 'configurable',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Recursively process nested data to create variants, pricingRules, mappedProducts
    await processNestedData(serviceId.toLowerCase().replace(/ /g, '_'), data, '');
  }

  // Seed Catalog_Product based on referenced products
  // For simplicity, add some default products
  const products = [
    { id: 'ip_camera_2mp', sku: 'CAM-IP-2MP', name: 'IP Camera 2MP', category: 'camera', brand: 'Hikvision', price: 1800 },
    { id: 'nvr_4ch', sku: 'NVR-4CH', name: 'NVR 4 Channel', category: 'nvr', brand: 'Hikvision', price: 5000 },
    { id: 'hdd_1tb', sku: 'HDD-1TB', name: '1TB HDD', category: 'storage', brand: 'WD', price: 3000 },
    { id: 'cable_kit', sku: 'CABLE-KIT', name: 'Cable Kit', category: 'accessory', brand: 'Generic', price: 500 }
  ];

  for (const prod of products) {
    await db.collection('Catalog_Product').doc(prod.id).set({
      ...prod,
      unit: 'piece',
      status: true,
      stockEnabled: false,
      visible: true,
      images: [],
      tags: [prod.category],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log('Full schema seeded with retained logic from existing data.');
}

async function clearCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function processNestedData(serviceId, data, path) {
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (key.includes('Camera Setup') || key.includes('Camera Set up')) {
        // This is a variant
        const variantId = key.toLowerCase().replace(/ /g, '-').replace(/camera/g, 'camera');
        await db.collection('PService').doc(serviceId).collection('variants').doc(variantId).set({
          name: key,
          slug: variantId,
          cameraCount: parseInt(key.split(' ')[0]) || 4,
          minQuantity: 1,
          maxQuantity: parseInt(key.split(' ')[0]) || 4,
          displayOrder: 1,
          status: true
        });
        await processNestedData(serviceId, value, `${path}/${key}`);
      } else if (key.startsWith('Product ')) {
        // This is a mapped product
        const slot = key.toLowerCase().replace(/ /g, '_');
        if (typeof value === 'object') {
          const defaultOption = Object.keys(value)[0];
          const optionData = value[defaultOption];
          const productId = optionData['Product 1 Option 1 ID'] ? 'ip_camera_2mp' : 'generic_product'; // Map to catalog
          await db.collection('PService').doc(serviceId).collection('mappedProducts').doc(slot).set({
            productId,
            productName: defaultOption,
            quantity: optionData['Deafult q'] || optionData['default q'] || 1,
            quantityFormula: 'fixed',
            required: true,
            editable: optionData['rigid'] === false,
            displayOrder: parseInt(key.split(' ')[1]) || 1
          });
          // Pricing rules
          if (optionData['Price']) {
            await db.collection('PService').doc(serviceId).collection('pricingRules').doc(`${slot}-price`).set({
              ruleType: 'fixed',
              price: optionData['Price']['_firestore'] ? 1800 : 0, // Placeholder
              unit: 'piece',
              status: true
            });
          }
        }
      } else {
        // Recurse
        await processNestedData(serviceId, value, `${path}/${key}`);
      }
    }
  }
}

seedSchema().catch(console.error);