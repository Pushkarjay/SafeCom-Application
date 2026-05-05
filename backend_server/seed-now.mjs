import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(admin.app(), 'default');

const catalogProducts = [
  { id: 'PROD001', name: 'NVR Setup Box (4 Channel)', category: 'Recording', group: 'Package Base', unit: 'unit', price: 4000, status: 'active' },
  { id: 'PROD002', name: 'NVR Setup Box (8 Channel)', category: 'Recording', group: 'Package Base', unit: 'unit', price: 6500, status: 'active' },
  { id: 'PROD003', name: 'IP Camera 2MP', category: 'Cameras', group: 'Core', unit: 'unit', price: 1800, status: 'active' },
  { id: 'PROD004', name: 'IP Camera 5MP', category: 'Cameras', group: 'Core', unit: 'unit', price: 2800, status: 'active' },
  
  // Products required by service mappings
  { id: 'prod_dvr_cam_basic', name: 'Analog/DVR Camera (Basic)', category: 'Cameras', group: 'Core', unit: 'unit', price: 1200, status: 'active' },
  { id: 'prod_ip_cam_basic', name: 'IP Camera (Basic)', category: 'Cameras', group: 'Core', unit: 'unit', price: 1800, status: 'active' },
  { id: 'prod_wifi_cam', name: 'Wi-Fi Camera', category: 'Cameras', group: 'Core', unit: 'unit', price: 2500, status: 'active' },
  { id: 'prod_nvr_4ch', name: '4 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 4000, status: 'active' },
  { id: 'prod_nvr_8ch', name: '8 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 6000, status: 'active' },
  { id: 'prod_nvr_16ch', name: '16 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 9000, status: 'active' },
  { id: 'prod_nvr_32ch', name: '32 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 15000, status: 'active' },
  { id: 'prod_power_supply_4ch', name: '4CH Power Supply', category: 'Power', group: 'Accessories', unit: 'unit', price: 500, status: 'active' },
  { id: 'prod_power_supply_8ch', name: '8CH Power Supply', category: 'Power', group: 'Accessories', unit: 'unit', price: 800, status: 'active' },
  { id: 'prod_poe_switch_4ch', name: '4CH PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1500, status: 'active' },
  { id: 'prod_poe_switch_8ch', name: '8CH PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 2500, status: 'active' },
  { id: 'prod_hdd_1tb', name: '1TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 3500, status: 'active' },
  { id: 'prod_hdd_2tb', name: '2TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 4800, status: 'active' },
  { id: 'prod_hdd_4tb', name: '4TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 8000, status: 'active' },
  { id: 'prod_hdd_8tb', name: '8TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 14000, status: 'active' },
  { id: 'prod_cable_3plus1', name: '3+1 CCTV Cable (Roll)', category: 'Cabling', group: 'Accessories', unit: 'coil', price: 800, status: 'active' },
  { id: 'prod_cable_cat6', name: 'Cat6 Cable (Roll)', category: 'Cabling', group: 'Accessories', unit: 'coil', price: 1200, status: 'active' },
  { id: 'prod_junction_box', name: 'Camera Junction Box', category: 'Mounting', group: 'Accessories', unit: 'unit', price: 150, status: 'active' },
  { id: 'prod_connectors_pack', name: 'BNC/DC Connectors (Pack)', category: 'Accessories', group: 'Accessories', unit: 'pack', price: 200, status: 'active' },
  { id: 'srv_installation_charge_per_cam', name: 'Per Camera Installation Charge', category: 'Services', group: 'Labor', unit: 'unit', price: 300, status: 'active' }
];

const accessories = [
  { id: 'acc_junction', name: 'Junction Box', price: 220, category: 'Electrical', status: 'active' },
  { id: 'acc_cat6', name: 'Cat6 Cable (10m)', price: 450, category: 'Cabling', status: 'active' },
  { id: 'acc_poe', name: 'PoE Switch', price: 1999, category: 'Network', status: 'active' },
  { id: 'acc_adapter', name: 'Power Adapter', price: 350, category: 'Power', status: 'active' }
];

const services = [
  { id: 'installation', title: 'Installation', icon: '📹', enabled: true },
  { id: 'maintenance', title: 'Maintenance', icon: '🛠', enabled: true },
  { id: 'amc', title: 'AMC Plans', icon: '🧰', enabled: true },
  { id: 'repair', title: 'Camera Repair', icon: '🔧', enabled: true },
  { id: 'upgrade', title: 'System Upgrade', icon: '⬆️', enabled: true },
  { id: 'accessories', title: 'Accessories', icon: '🧷', enabled: true }
];

const upgradeBundles = [
  { id: 'upg_2mp_to_5mp', name: '2MP to 5MP Upgrade', description: 'Upgrade existing cameras for better clarity.', price: 6999, status: 'active' },
  { id: 'upg_nvr_storage', name: 'NVR + Storage Upgrade', description: 'Increase channel and storage capacity.', price: 8999, status: 'active' },
  { id: 'upg_full_stack', name: 'Full Surveillance Upgrade', description: 'Camera, NVR, and network optimization bundle.', price: 14999, status: 'active' }
];

const pricing = {
  installation: {
    id: 'installation',
    nvrByPackage: { '4': 4000, '8': 6400, '16': 9800, '32': 14800 },
    cameraByMp: { '2MP': 1800, '5MP': 2600 },
    hddBySize: { '1TB': 3500, '2TB': 5200, '3TB': 6900 },
    cableKitPrice: 950,
    connectorPrice: 60,
    wiringPrice: 35,
    installationChargePrice: 250
  },
  maintenance: {
    id: 'maintenance',
    planVisits: { 'Basic': 1, 'Standard': 2, 'Comprehensive': 4 },
    itemTemplates: [
      { key: 'inspection', name: 'System Inspection Visit', unitPrice: 799, baseQuantity: 1, multiplyByVisitCount: true, canEditQuantity: false },
      { key: 'cleaning', name: 'Camera Cleaning & Refocus', unitPrice: 199, baseQuantity: 8, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'healthcheck', name: 'NVR/DVR Health Check', unitPrice: 349, baseQuantity: 1, multiplyByVisitCount: false, canEditQuantity: true }
    ]
  },
  repair: {
    id: 'repair',
    issues: [
      { id: 'no_video', title: 'No Video Output', visitFee: 299, diagnosticFee: 399 },
      { id: 'blurred_feed', title: 'Blurred / Distorted Feed', visitFee: 249, diagnosticFee: 349 },
      { id: 'recording_failure', title: 'Recording Failure', visitFee: 349, diagnosticFee: 449 }
    ]
  }
};

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...\n');

    // Seed catalog products
    console.log('📦 Seeding catalog products...');
    for (const product of catalogProducts) {
      await db.collection('catalog_products').doc(product.id).set({ ...product, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${catalogProducts.length} products\n`);

    // Seed accessories
    console.log('🧷 Seeding accessories...');
    for (const acc of accessories) {
      await db.collection('catalog_accessories').doc(acc.id).set({ ...acc, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${accessories.length} accessories\n`);

    // Seed services
    console.log('🛠 Seeding services...');
    for (const svc of services) {
      await db.collection('catalog_services').doc(svc.id).set(svc);
    }
    console.log(`✅ Seeded ${services.length} services\n`);

    // Seed upgrade bundles
    console.log('⬆️ Seeding upgrade bundles...');
    for (const bundle of upgradeBundles) {
      await db.collection('catalog_upgrade_bundles').doc(bundle.id).set({ ...bundle, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${upgradeBundles.length} upgrade bundles\n`);

    // Seed pricing
    console.log('💰 Seeding pricing...');
    await db.collection('catalog_pricing').doc('installation').set(pricing.installation);
    await db.collection('catalog_pricing').doc('maintenance').set(pricing.maintenance);
    await db.collection('catalog_pricing').doc('repair').set(pricing.repair);
    console.log('✅ Seeded pricing data\n');

    console.log('🎉 All data seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
