/**
 * Seed script: Restructures 16 Camera Setup into nested camera tree
 * Structure: Camera → Resolution (2.4MP/4MP) → Location (Indoor/Outdoor) → actual cameras
 * 
 * Run with: node --env-file=.env seed_camera_tree.js
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const SERVICE_COLLECTION = 'Services';
const PRODUCT_COLLECTION = 'catalog_product';

function initFirestore() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
    initializeApp({ credential: serviceAccount });
  }
  return getFirestore();
}

async function main() {
  const db = initFirestore();
  console.log('Starting camera tree seed...\n');

  // Verify existing products
  console.log('1. Fetching catalog products...');
  const productsSnap = await db.collection(PRODUCT_COLLECTION).get();
  const productMap = new Map();
  productsSnap.docs.forEach(doc => {
    const d = doc.data();
    productMap.set(doc.id, { id: doc.id, name: d.name || d.productName || '', price: d.price || d.basePrice || 0 });
  });

  // Log available products
  console.log(`   Found ${productsSnap.size} products in catalog`);
  for (const [id, p] of productMap) {
    if (id.startsWith('PROD')) console.log(`   ${id}: ${p.name} - ₹${p.price}`);
  }

  console.log('\n2. Checking current 16 Camera Setup...');
  const installDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
  if (!installDoc.exists) {
    console.error('Installation service not found!');
    return;
  }
  const data = installDoc.data() || {};
  
  // Find IP Camera category
  const ipCameraKey = Object.keys(data).find(k => k.includes('IP Camera') || k === 'IP Camera');
  if (!ipCameraKey) {
    console.log('IP Camera category not found, searching all categories...');
    console.log('Available categories:', Object.keys(data));
    return;
  }
  console.log(`   Found category: "${ipCameraKey}"`);

  const catData = data[ipCameraKey] || {};
  
  // Find 16 Camera Setup
  const setupKey = Object.keys(catData).find(k => k.includes('16 Camera') || k === '16 Camera Setup');
  if (!setupKey) {
    console.log('16 Camera Setup not found. Available setups:', Object.keys(catData));
    return;
  }
  console.log(`   Found setup: "${setupKey}"`);

  const setupData = catData[setupKey] || {};
  const currentProducts = Object.keys(setupData);
  console.log(`   Current products (${currentProducts.length}):`, currentProducts);

  console.log('\n3. Checking if target camera products exist in catalog...');
  
  // The 2.4MP cameras (PROD021-PROD028) and 4MP cameras (PROD007, PROD008)
  const cameraIds = ['PROD007', 'PROD008', 'PROD021', 'PROD022', 'PROD023', 'PROD024', 'PROD025', 'PROD026', 'PROD027', 'PROD028'];
  
  const missing = cameraIds.filter(id => !productMap.has(id));
  if (missing.length > 0) {
    console.log(`   WARNING: Some cameras missing from catalog: ${missing.join(', ')}`);
    console.log('   Will need to create them or use existing products.');
    
    // List what we have that might match
    console.log('\n   Available products that could be used:');
    for (const [id, p] of productMap) {
      if (id.startsWith('PROD') || id.startsWith('CP') || p.name.toLowerCase().includes('camera')) {
        console.log(`   ${id}: ${p.name} - ₹${p.price}`);
      }
    }
  }

  console.log('\n4. Building nested camera tree structure...');
  
  const cameraTree = {
    'Camera': {}
  };
  
  // ── 2.4MP branch ──────────────────────────────────────────
  const mp24Branch = {
    '2.4 MP': {
      'Indoor': {
        'CP-Plus 2.4MP B/W Indoor Camera': { 'Deafult q': 0, 'Price': { id: 'PROD021' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Indoor Camera': { 'Deafult q': 0, 'Price': { id: 'PROD023' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Indoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': { id: 'PROD025' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP B/W Indoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': { id: 'PROD027' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
      },
      'Outdoor': {
        'CP Plus 2.4MP B/W Outdoor Camera': { 'Deafult q': 0, 'Price': { id: 'PROD022' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Outdoor Camera': { 'Deafult q': 0, 'Price': { id: 'PROD024' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Outdoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': { id: 'PROD026' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP B/W Outdoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': { id: 'PROD028' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
      }
    }
  };
  
  // ── 4MP branch ─────────────────────────────────────────────
  const mp4Branch = {
    '4 MP': {
      'Indoor': {
        'CP Plus 4MP Color Indoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': { id: 'PROD007' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
      },
      'Outdoor': {
        'CP Plus 4MP Color Outdoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': { id: 'PROD008' }, 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
      }
    }
  };
  
  cameraTree['Camera'] = { ...mp24Branch, ...mp4Branch };

  console.log('   Tree structure:');
  console.log('   📁 Camera');
  console.log('   ├── 📁 2.4 MP');
  console.log('   │   ├── 📁 Indoor (4 cameras)');
  console.log('   │   └── 📁 Outdoor (4 cameras)');
  console.log('   └── 📁 4 MP');
  console.log('       ├── 📁 Indoor (1 camera)');
  console.log('       └── 📁 Outdoor (1 camera)');
  console.log('   Total: 10 camera leaf options');

  console.log('\n5. Creating/replacing Camera product slot...');
  
  const updates = {};
  
  // Clear existing products in 16 Camera Setup (keep setup header)
  for (const pk of currentProducts) {
    updates[`${ipCameraKey}.${setupKey}.${pk}`] = null;
  }
  
  // Set the nested tree as Camera product slot
  updates[`${ipCameraKey}.${setupKey}.Camera`] = cameraTree['Camera'];
  
  await db.collection(SERVICE_COLLECTION).doc('Installation').update(updates);
  
  console.log('   ✓ Camera tree seeded successfully!');
  console.log(`   Path: ${ipCameraKey}.${setupKey}.Camera`);
  
  console.log('\n6. Verifying...');
  const verifyDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get();
  const verifyData = verifyDoc.data() || {};
  const verifySetup = verifyData[ipCameraKey]?.[setupKey] || {};
  console.log(`   Setup now has: ${Object.keys(verifySetup).length} product slots`);
  console.log(`   Product slots: ${Object.keys(verifySetup).join(', ')}`);
  
  const cameraSlot = verifySetup['Camera'];
  if (cameraSlot) {
    console.log(`   Camera slot has: ${Object.keys(cameraSlot).length} branches (2.4MP, 4MP)`);
  }

  console.log('\n✅ Seed complete!');
  console.log('\nNext steps:');
  console.log('1. Go to admin dashboard → Installation Builder → IP Camera → 16 Camera Setup');
  console.log('2. Expand the Camera product row to see the full nested tree');
  console.log('3. Set default quantities for individual cameras as needed');
}

main().catch(console.error);