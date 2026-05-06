const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'safecom-application-01',
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
db.settings({ databaseId: 'safecom-database-nosql' });

const SERVICES = [
  'Installation',
  'Maintenance',
  'AMC',
  'Camera_System_Upgrade',
  'Accessories',
  'Recommendation_Addons',
  'Camera_Repair'
];

const PRODUCT_CATALOG = [
  { name: 'CP-Plus 4ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 2500 },
  { name: 'CP-Plus 8ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 3500 },
  { name: 'CP-Plus 16ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 5500 },
  { name: 'CP-Plus 32ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 0 },
  { name: 'CP-Plus DMP IP Camera Color Audio Dome', category: 'IP Camera', group: 'Cameras', unit: 'unit', price: 2250 },
  { name: 'DMP IP Camera Color Audio Bullet', category: 'IP Camera', group: 'Cameras', unit: 'unit', price: 2350 },
  { name: 'AMP IP Camera Color Audio Dome (Indoor Camera)', category: 'IP Camera', group: 'Cameras', unit: 'unit', price: 3250 },
  { name: 'AMP IP Camera Color Audio Bullet (Outdoor Camera)', category: 'IP Camera', group: 'Cameras', unit: 'unit', price: 3250 },
  { name: '4ch Port PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1350 },
  { name: '4ch Port PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1400 },
  { name: '8ch Port PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1700 },
  { name: 'CP-Plus 8ch Port PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1700 },
  { name: 'CP-Plus 4ch DVR (Rupant)', category: 'DVR', group: 'Recording', unit: 'unit', price: 2200 },
  { name: 'CP-Plus 8ch DVR', category: 'DVR', group: 'Recording', unit: 'unit', price: 3400 },
  { name: 'CP-Plus 16ch DVR (Without HDD)', category: 'DVR', group: 'Recording', unit: 'unit', price: 6000 },
  { name: 'CP-Plus 32ch DVR (DVR Supported)', category: 'DVR', group: 'Recording', unit: 'unit', price: 0 },
  { name: 'CP-Plus SMP 4ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 3500 },
  { name: 'CP-Plus SMP 8ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 4500 },
  { name: 'CP-Plus SMP 16ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 7200 },
  { name: 'CP-Plus SMP 32ch NVR', category: 'NVR', group: 'Recording', unit: 'unit', price: 0 },
  { name: 'CP-Plus 2MP B/W Dome Indoor', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 900 },
  { name: '2MP B/W Bullet Outdoor', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1000 },
  { name: '2MP Color Dome', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1400 },
  { name: '2MP Color Bullet', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1600 },
  { name: '2MP Color Audio Dome Indoor Camera', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1800 },
  { name: '2MP Color Audio Bullet Outdoor Camera', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1900 },
  { name: '2MP Audio Indoor Dome Bullet', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1000 },
  { name: '2MP Audio Outdoor Bullet', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1000 },
  { name: '5MP B/W Dome Indoor Camera', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1800 },
  { name: '5MP B/W Bullet Outdoor Camera', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 1850 },
  { name: '5MP Full Color Audio Dome ICA', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 2200 },
  { name: '5MP Full Color Audio Bullet O/C', category: 'DVR Camera', group: 'Cameras', unit: 'unit', price: 2400 },
  { name: '4ch SMPS (Power Supply)', category: 'Power', group: 'Accessories', unit: 'unit', price: 400 },
  { name: '8ch 10A SMPS', category: 'Power', group: 'Accessories', unit: 'unit', price: 650 },
  { name: '16ch 10A SMPS', category: 'Power', group: 'Accessories', unit: 'unit', price: 1200 },
  { name: 'Cat6 Netplus 90m Box', category: 'Cable', group: 'Wiring', unit: 'coil', price: 2100 },
  { name: '1TB HDD', category: 'Storage', group: 'Storage', unit: 'unit', price: 4000 },
  { name: '2TB HDD', category: 'Storage', group: 'Storage', unit: 'unit', price: 6500 },
  { name: '3TB HDD', category: 'Storage', group: 'Storage', unit: 'unit', price: 7000 },
  { name: 'DVR Type 3+1 Standard Cable', category: 'Cable', group: 'Wiring', unit: 'coil', price: 1700 },
  { name: 'CP-Plus 90m Cat6 Cable Economy', category: 'Cable', group: 'Wiring', unit: 'coil', price: 3500 },
  { name: 'CP-Plus 90m Cat6 Cable Economy', category: 'Cable', group: 'Wiring', unit: 'coil', price: 1500 },
  { name: 'Standard Non-Braided Cat6 Cable 100m', category: 'Cable', group: 'Wiring', unit: 'coil', price: 80 },
  { name: 'Connector / Locking Set', category: 'Connector', group: 'Accessories', unit: 'set', price: 80 },
  { name: 'Installation Charge DVR Camera', category: 'Service', group: 'Services', unit: 'per_camera', price: 200 },
  { name: 'NVR Camera', category: 'Service', group: 'Services', unit: 'per_camera', price: 300 },
  { name: 'CCTV 20 Rack', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 750 },
  { name: 'CCTV 4U Rack', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 1500 },
  { name: 'CCTV Junction Box', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 80 },
  { name: 'CCTV Power Adaptor (7A)', category: 'Power', group: 'Accessories', unit: 'unit', price: 550 },
  { name: 'CCTV Power Adaptor (12V)', category: 'Power', group: 'Accessories', unit: 'unit', price: 200 },
  { name: 'Zebion 19" Monitor', category: 'Display', group: 'Accessories', unit: 'unit', price: 2500 },
  { name: 'Computer 19" Monitor', category: 'Display', group: 'Accessories', unit: 'unit', price: 3000 },
  { name: 'LG 24" FHD Monitor', category: 'Display', group: 'Accessories', unit: 'unit', price: 5500 },
  { name: 'HDMI Cable (1.5m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 80 },
  { name: 'HDMI Cable (5m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 250 },
  { name: 'HDMI Cable (10m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 300 },
  { name: 'HDMI Cable (20m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 1000 },
  { name: 'USB Cable Mouse', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 150 },
  { name: 'Wireless Mouse', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 350 },
  { name: 'RJ45 Crimping', category: 'Service', group: 'Services', unit: 'unit', price: 150 },
  { name: 'VGA Cable (10m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 250 },
  { name: 'VGA Cable (15m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 150 },
  { name: 'VGA Cable (10m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 450 },
  { name: 'CMOS Battery', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 60 },
  { name: 'System Inspection Visit', category: 'Service', group: 'Maintenance', unit: 'visit', price: 799 },
  { name: 'Camera Cleaning & Refocus', category: 'Service', group: 'Maintenance', unit: 'unit', price: 199 },
  { name: 'NVR/DVR Health Check', category: 'Service', group: 'Maintenance', unit: 'unit', price: 349 },
  { name: 'Minor Rewiring Support', category: 'Service', group: 'Maintenance', unit: 'unit', price: 120 },
  { name: 'Service Labor Charges', category: 'Service', group: 'Maintenance', unit: 'unit', price: 299 },
  { name: 'Service Visit Fee', category: 'Service', group: 'Repair', unit: 'unit', price: 299 },
  { name: 'Diagnostic Charges', category: 'Service', group: 'Repair', unit: 'unit', price: 349 },
  { name: 'Camera Repair Unit', category: 'Service', group: 'Repair', unit: 'unit', price: 899 },
  { name: 'Connector Replacement', category: 'Accessory', group: 'Repair', unit: 'unit', price: 80 },
  { name: 'Upgrade Bundle', category: 'Service', group: 'Upgrade', unit: 'bundle', price: 6999 },
  { name: 'Installation Support', category: 'Service', group: 'Upgrade', unit: 'unit', price: 499 },
  { name: 'Data Migration', category: 'Service', group: 'Upgrade', unit: 'unit', price: 349 },
  { name: '2MP to 5MP Upgrade', category: 'Service', group: 'Upgrade', unit: 'bundle', price: 6999 },
  { name: 'NVR + Storage Upgrade', category: 'Service', group: 'Upgrade', unit: 'bundle', price: 8999 },
  { name: 'Full Surveillance Upgrade', category: 'Service', group: 'Upgrade', unit: 'bundle', price: 14999 },
  { name: 'Junction Box', category: 'Accessory', group: 'Accessories', unit: 'unit', price: 220 },
  { name: 'Cat6 Cable (10m)', category: 'Cable', group: 'Accessories', unit: 'unit', price: 450 },
  { name: 'PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1999 },
  { name: 'Power Adapter', category: 'Power', group: 'Accessories', unit: 'unit', price: 350 }
];

const CAMERA_SETUPS = ['4 Camera Setup', '8 Camera Setup', '16 Camera Setup', '32 Camera Setup'];

const CAMERA_CATEGORIES = [
  { key: 'IP Camera Setup', group: 'ip' },
  { key: 'DVR Camera Setup', group: 'dvr' },
  { key: 'WIFI Camera Setup', group: 'wifi' }
];

const SERVICE_PRODUCT_FLOW = {
  ip: [
    'CP-Plus DMP IP Camera Color Audio Dome',
    'DMP IP Camera Color Audio Bullet',
    'AMP IP Camera Color Audio Dome (Indoor Camera)',
    'AMP IP Camera Color Audio Bullet (Outdoor Camera)',
    'CP-Plus 4ch NVR',
    'CP-Plus 8ch NVR',
    'CP-Plus 16ch NVR',
    'CP-Plus 32ch NVR',
    'CP-Plus SMP 4ch NVR',
    'CP-Plus SMP 8ch NVR',
    'CP-Plus SMP 16ch NVR',
    'CP-Plus SMP 32ch NVR',
    '4ch Port PoE Switch',
    '4ch Port PoE Switch',
    '8ch Port PoE Switch',
    'CP-Plus 8ch Port PoE Switch',
    '1TB HDD',
    '2TB HDD',
    '3TB HDD',
    'Cat6 Netplus 90m Box',
    'CP-Plus 90m Cat6 Cable Economy',
    'CP-Plus 90m Cat6 Cable Economy',
    'Standard Non-Braided Cat6 Cable 100m',
    'Connector / Locking Set',
    'CCTV Junction Box',
    'NVR Camera'
  ],
  dvr: [
    'CP-Plus 2MP B/W Dome Indoor',
    '2MP B/W Bullet Outdoor',
    '2MP Color Dome',
    '2MP Color Bullet',
    '2MP Color Audio Dome Indoor Camera',
    '2MP Color Audio Bullet Outdoor Camera',
    '2MP Audio Indoor Dome Bullet',
    '2MP Audio Outdoor Bullet',
    '5MP B/W Dome Indoor Camera',
    '5MP B/W Bullet Outdoor Camera',
    '5MP Full Color Audio Dome ICA',
    '5MP Full Color Audio Bullet O/C',
    'CP-Plus 4ch DVR (Rupant)',
    'CP-Plus 8ch DVR',
    'CP-Plus 16ch DVR (Without HDD)',
    'CP-Plus 32ch DVR (DVR Supported)',
    '4ch SMPS (Power Supply)',
    '8ch 10A SMPS',
    '16ch 10A SMPS',
    '1TB HDD',
    '2TB HDD',
    '3TB HDD',
    'DVR Type 3+1 Standard Cable',
    'Connector / Locking Set',
    'CCTV Junction Box',
    'Installation Charge DVR Camera'
  ],
  wifi: [
    'CP-Plus DMP IP Camera Color Audio Dome',
    'DMP IP Camera Color Audio Bullet',
    'AMP IP Camera Color Audio Dome (Indoor Camera)',
    'AMP IP Camera Color Audio Bullet (Outdoor Camera)',
    'NVR Camera'
  ]
};

const STANDARD_SERVICE_PRODUCTS = {
  AMC: ['Installation Charge DVR Camera', 'NVR Camera'],
  Recommendation_Addons: [
    '1TB HDD',
    '2TB HDD',
    '3TB HDD',
    'CCTV Junction Box',
    'Connector / Locking Set'
  ]
};

const MAINTENANCE_TYPES = [
  'Preventive Maintenance',
  'Fault Diagnosis',
  'Performance Tuning'
];

const MAINTENANCE_PACKAGES = {
  'Basic Plan': 1,
  'Standard Plan': 2,
  'Comprehensive Plan': 4
};

const MAINTENANCE_LINE_ITEMS = [
  { name: 'System Inspection Visit', baseQty: 1 },
  { name: 'Camera Cleaning & Refocus', baseQty: 8 },
  { name: 'NVR/DVR Health Check', baseQty: 1 },
  { name: 'Minor Rewiring Support', baseQty: 10 },
  { name: 'Service Labor Charges', baseQty: 1 }
];

const REPAIR_ISSUES = [
  'No Video Output',
  'Night Vision Not Working',
  'Blurry / Distorted Image',
  'Other Issue'
];

const REPAIR_LINE_ITEMS = [
  { name: 'Service Visit Fee', defaultQty: 1 },
  { name: 'Diagnostic Charges', defaultQty: 1 },
  { name: 'Camera Repair Unit', defaultQty: 1 },
  { name: 'Connector Replacement', defaultQty: 4 }
];

const UPGRADE_OPTIONS = {
  '2MP to 5MP Upgrade': [
    { name: 'Upgrade Bundle', defaultQty: 1 },
    { name: 'Installation Support', defaultQty: 1 },
    { name: 'Data Migration', defaultQty: 1 }
  ],
  'NVR + Storage Upgrade': [
    { name: 'NVR + Storage Upgrade', defaultQty: 1 }
  ],
  'Full Surveillance Upgrade': [
    { name: 'Full Surveillance Upgrade', defaultQty: 1 }
  ]
};

const ACCESSORY_PRODUCTS = [
  { name: 'Junction Box', defaultQty: 0, minQty: 0, maxQty: 50 },
  { name: 'Cat6 Cable (10m)', defaultQty: 0, minQty: 0, maxQty: 50 },
  { name: 'PoE Switch', defaultQty: 0, minQty: 0, maxQty: 50 },
  { name: 'Power Adapter', defaultQty: 0, minQty: 0, maxQty: 50 }
];

function buildProductMappings(productNames, productIdsByName, defaultQty, maxQty) {
  const products = {};
  let productIndex = 1;

  for (const name of productNames) {
    const productIds = productIdsByName[name] || [];
    const productKey = `Product ${productIndex}`;
    const optionMappings = {};
    let optionIndex = 1;

    for (const productId of productIds) {
      const optionKey = `Product ${productIndex} Option ${optionIndex}`;
      optionMappings[optionKey] = {
        'Deafult q': defaultQty,
        'min q': 1,
        'max q': maxQty,
        available: true,
        rigid: false,
        [`Product ${productIndex} Option ${optionIndex} ID`]: db
          .collection('catalog_product')
          .doc(productId),
        Price: db.collection('catalog_product').doc(productId)
      };
      optionIndex += 1;
    }

    products[productKey] = optionMappings;
    productIndex += 1;
  }

  return products;
}

function buildCameraSetupMappings(productNames, productIdsByName, cameraQty) {
  return buildProductMappings(productNames, productIdsByName, cameraQty, cameraQty);
}

function buildAccessoryMappings(productNames, productIdsByName, defaultQty, maxQty) {
  return buildProductMappings(productNames, productIdsByName, defaultQty, maxQty);
}

function buildProductMappingsFromSpecs(productSpecs, productIdsByName) {
  const products = {};
  let productIndex = 1;

  for (const spec of productSpecs) {
    const productIds = productIdsByName[spec.name] || [];
    const optionMappings = {};
    let optionIndex = 1;

    const defaultQty = spec.defaultQty !== undefined ? spec.defaultQty : spec.baseQty;
    const minQty = spec.minQty !== undefined ? spec.minQty : defaultQty;
    const maxQty = spec.maxQty !== undefined ? spec.maxQty : defaultQty;

    for (const productId of productIds) {
      const optionKey = `Product ${productIndex} Option ${optionIndex}`;
      optionMappings[optionKey] = {
        'Deafult q': defaultQty,
        'min q': minQty,
        'max q': maxQty,
        available: true,
        rigid: false,
        [`Product ${productIndex} Option ${optionIndex} ID`]: db
          .collection('catalog_product')
          .doc(productId),
        Price: db.collection('catalog_product').doc(productId)
      };
      optionIndex += 1;
    }

    products[`Product ${productIndex}`] = optionMappings;
    productIndex += 1;
  }

  return products;
}

function buildServiceStructure(productIdsByName) {
  const structure = {};

  for (const cameraType of CAMERA_CATEGORIES) {
    structure[cameraType.key] = {};
    for (const setup of CAMERA_SETUPS) {
      const cameraQty = parseInt(setup.split(' ')[0], 10);
      structure[cameraType.key][setup] = buildCameraSetupMappings(
        SERVICE_PRODUCT_FLOW[cameraType.group],
        productIdsByName,
        cameraQty
      );
    }
  }

  return structure;
}

function buildStandardServiceStructure(serviceId, productIdsByName) {
  const products = STANDARD_SERVICE_PRODUCTS[serviceId] || [];
  const setups = {};

  for (const setup of CAMERA_SETUPS) {
    const cameraQty = parseInt(setup.split(' ')[0], 10);
    setups[setup] = buildAccessoryMappings(products, productIdsByName, cameraQty, cameraQty);
  }

  return setups;
}

function buildMaintenanceStructure(productIdsByName) {
  const structure = {};

  for (const type of MAINTENANCE_TYPES) {
    structure[type] = {};
    for (const [plan, multiplier] of Object.entries(MAINTENANCE_PACKAGES)) {
      const specs = MAINTENANCE_LINE_ITEMS.map((item) => ({
        name: item.name,
        defaultQty: item.baseQty * multiplier,
        minQty: item.baseQty * multiplier,
        maxQty: item.baseQty * multiplier
      }));
      structure[type][plan] = buildProductMappingsFromSpecs(specs, productIdsByName);
    }
  }

  return structure;
}

function buildRepairStructure(productIdsByName) {
  const structure = {};

  for (const issue of REPAIR_ISSUES) {
    const specs = REPAIR_LINE_ITEMS.map((item) => ({
      name: item.name,
      defaultQty: item.defaultQty,
      minQty: item.defaultQty,
      maxQty: item.defaultQty
    }));
    structure[issue] = buildProductMappingsFromSpecs(specs, productIdsByName);
  }

  return structure;
}

function buildUpgradeStructure(productIdsByName) {
  const structure = {};

  for (const [option, specs] of Object.entries(UPGRADE_OPTIONS)) {
    const optionSpecs = specs.map((item) => ({
      name: item.name,
      defaultQty: item.defaultQty,
      minQty: item.defaultQty,
      maxQty: item.defaultQty
    }));
    structure[option] = buildProductMappingsFromSpecs(optionSpecs, productIdsByName);
  }

  return structure;
}

function buildAccessoriesStructure(productIdsByName) {
  return {
    Accessories: buildProductMappingsFromSpecs(ACCESSORY_PRODUCTS, productIdsByName)
  };
}

async function deleteDocsNotInList(collectionName, allowedIds) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  if (snapshot.empty) {
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    if (!allowedIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });
  await batch.commit();
}

async function seedCatalogProducts() {
  const productsRef = db.collection('catalog_product');
  const existing = await productsRef.get();
  let nextSerial = 1;

  const existingByName = {};
  existing.docs.forEach((doc) => {
    const data = doc.data();
    const name = data && data.name ? String(data.name) : null;
    if (name) {
      if (!existingByName[name]) {
        existingByName[name] = [];
      }
      existingByName[name].push(doc.id);
    }
    const match = doc.id.match(/^PROD(\d+)$/i);
    if (match) {
      const value = parseInt(match[1], 10);
      if (value >= nextSerial) {
        nextSerial = value + 1;
      }
    }
  });

  const usedIds = new Set();
  const productIdsByName = {};

  for (const product of PRODUCT_CATALOG) {
    let productId = null;
    const existingIds = existingByName[product.name] || [];
    const nextExisting = existingIds.find((id) => !usedIds.has(id));

    if (nextExisting) {
      productId = nextExisting;
    } else {
      productId = `PROD${String(nextSerial).padStart(3, '0')}`;
      nextSerial += 1;
    }

    usedIds.add(productId);

    const payload = {
      id: productId,
      name: product.name,
      category: product.category,
      group: product.group,
      unit: product.unit,
      price: product.price,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await productsRef.doc(productId).set(payload, { merge: true });

    if (!productIdsByName[product.name]) {
      productIdsByName[product.name] = [];
    }
    productIdsByName[product.name].push(productId);
  }

  await deleteDocsNotInList('catalog_product', usedIds);

  return productIdsByName;
}

async function seedServices(productIdsByName) {
  const servicesRef = db.collection('Services');
  const allowedIds = new Set(SERVICES);

  for (const serviceId of SERVICES) {
    let mappings;
    if (serviceId === 'Installation') {
      mappings = buildServiceStructure(productIdsByName);
    } else if (serviceId === 'Maintenance') {
      mappings = buildMaintenanceStructure(productIdsByName);
    } else if (serviceId === 'Camera_Repair') {
      mappings = buildRepairStructure(productIdsByName);
    } else if (serviceId === 'Camera_System_Upgrade') {
      mappings = buildUpgradeStructure(productIdsByName);
    } else if (serviceId === 'Accessories') {
      mappings = buildAccessoriesStructure(productIdsByName);
    } else {
      mappings = buildStandardServiceStructure(serviceId, productIdsByName);
    }

    await servicesRef.doc(serviceId).set(mappings, { merge: false });
  }

  await deleteDocsNotInList('Services', allowedIds);
}

async function seedSchema() {
  const productIdsByName = await seedCatalogProducts();
  await seedServices(productIdsByName);

  console.log('Catalog products and Services seeded with nested mappings.');
}

seedSchema().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
