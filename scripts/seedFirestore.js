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
  const collections = ['Services', 'catalog_product', 'customer_user', 'employee_user', 'admin_user', 'Orders', 'Bookings', 'Configurations', 'Banners', 'Offers', 'Locations', 'Invoices'];
  for (const col of collections) {
    await clearCollection(col);
  }

  // Seed catalog_product with 76 products (using placeholders based on common CCTV products)
  const products = [];
  const categories = ['camera', 'nvr', 'storage', 'cable', 'connector', 'accessory', 'addon', 'upgrade', 'repair', 'amc'];
  for (let i = 1; i <= 76; i++) {
    products.push({
      id: `product_${i}`,
      sku: `SKU-${i.toString().padStart(3, '0')}`,
      name: `Product ${i}`,
      category: categories[i % categories.length],
      brand: ['Hikvision', 'Dahua', 'CP Plus', 'Generic'][i % 4],
      price: Math.floor(Math.random() * 10000) + 500,
      unit: 'piece',
      status: true,
      stockEnabled: false,
      visible: true,
      images: [],
      tags: [categories[i % categories.length]],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  const batch = db.batch();
  products.forEach(prod => {
    const ref = db.collection('catalog_product').doc(prod.id);
    batch.set(ref, prod);
  });
  await batch.commit();

  // Seed Services with nested mappings from analysis
  const pserviceData = JSON.parse(fs.readFileSync('firestore-analysis/pservice-analysis.json', 'utf8'));
  const services = ['installation', 'maintenance', 'AMC', 'camera_system_upgrade', 'accessories', 'recommendation_addons', 'camera_repair'];

  for (const serviceId of services) {
    const data = pserviceData[serviceId] || {};
    // Transform nested data into map structure
    const mappings = transformToMappings(data);
    await db.collection('Services').doc(serviceId).set({
      id: serviceId,
      name: serviceId.replace('_', ' ').toUpperCase(),
      slug: serviceId,
      description: `${serviceId} service`,
      status: true,
      visible: true,
      displayOrder: services.indexOf(serviceId) + 1,
      serviceType: 'dynamic',
      pricingMode: 'configurable',
      mappings, // Nested map
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Seed other collections with sample docs
  await db.collection('customer_user').doc('sample_customer').set({
    uid: 'sample_uid',
    name: 'Sample Customer',
    phone: '1234567890',
    email: 'customer@example.com',
    profileImage: '',
    defaultLocationId: '',
    savedLocations: [],
    status: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection('employee_user').doc('sample_employee').set({
    uid: 'sample_emp_uid',
    name: 'Sample Employee',
    role: 'technician',
    phone: '0987654321',
    assignedAreas: [],
    status: true
  });

  await db.collection('admin_user').doc('sample_admin').set({
    uid: 'sample_admin_uid',
    name: 'Sample Admin',
    email: 'admin@example.com',
    role: 'super_admin',
    permissions: [],
    status: true
  });

  await db.collection('Orders').doc('sample_order').set({
    customerId: 'sample_uid',
    serviceId: 'installation',
    variantId: '4-camera-setup',
    locationId: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await db.collection('Bookings').doc('sample_booking').set({
    customerId: 'sample_uid',
    orderId: 'sample_order',
    scheduledDate: '2026-05-10',
    assignedTechnician: 'sample_emp_uid',
    status: 'scheduled'
  });

  await db.collection('Configurations').doc('homepage').set({
    serviceOrder: ['installation', 'maintenance', 'amc'],
    showOffers: true,
    showBanner: true
  });

  await db.collection('Banners').doc('sample_banner').set({
    title: 'CCTV Installation',
    image: '',
    redirectType: 'service',
    redirectId: 'installation',
    visible: true,
    displayOrder: 1
  });

  await db.collection('Offers').doc('sample_offer').set({
    title: '10% Off',
    description: 'On first installation',
    discountType: 'percentage',
    discountValue: 10,
    status: true
  });

  await db.collection('Locations').doc('sample_location').set({
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751001',
    serviceable: true,
    extraCharges: 0
  });

  await db.collection('Invoices').doc('sample_invoice').set({
    invoiceNumber: 'INV-001',
    orderId: 'sample_order',
    customerId: 'sample_uid',
    items: [],
    total: 0,
    pdfUrl: ''
  });

  console.log('Full schema seeded with nested mappings and realistic data.');
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

function transformToMappings(data) {
  const mappings = {};
  let productCounter = 1;

  function recurse(obj, path) {
    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      for (const key of keys) {
        const value = obj[key];
        const cleanKey = key.replace(/ /g, '_').replace(/camera/gi, 'Camera');
        if (cleanKey.includes('Camera_Setup') || cleanKey.includes('Camera_Set_up')) {
          // Variant level
          mappings[cleanKey] = mappings[cleanKey] || {};
          recurse(value, `${path}/${cleanKey}`);
        } else if (cleanKey.startsWith('Product_')) {
          // Product mapping
          const variantKey = path.split('/').pop();
          mappings[variantKey] = mappings[variantKey] || {};
          const prodKey = cleanKey;
          mappings[variantKey][prodKey] = {};
          if (typeof value === 'object') {
            const options = {};
            for (const optKey of Object.keys(value)) {
              if (optKey.includes('Option')) {
                const optData = value[optKey];
                options[optKey.replace(/ /g, '_')] = {
                  productId: `product_${productCounter++}`,
                  price: optData['Price'] ? 1800 : 0, // Placeholder
                  available: optData['available'] !== false,
                  minQuantity: optData['min q'] || 1,
                  maxQuantity: optData['max q'] || optData['Deafult q'] || 4,
                  defaultQuantity: optData['Deafult q'] || optData['default q'] || 4,
                  rigid: optData['rigid'] !== false
                };
              }
            }
            mappings[variantKey][prodKey] = {
              options,
              defaultOption: Object.keys(options)[0],
              required: true,
              editable: true
            };
          } else if (typeof value === 'string' && value.includes('same flow')) {
            // Reference to another
            mappings[variantKey][prodKey] = { reference: value };
          }
        } else {
          // Setup category like IP_Camera
          mappings[cleanKey] = mappings[cleanKey] || {};
          recurse(value, `${path}/${cleanKey}`);
        }
      }
    }
  }

  recurse(data, '');
  return mappings;
}

seedSchema().catch(console.error);