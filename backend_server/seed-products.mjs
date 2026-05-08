import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(admin.app(), 'default');

async function seedProducts() {
  const products = [
    { id: 'prod_dvr_cam_basic', name: 'DVR Camera (Basic)', category: 'Cameras', group: 'Core', unit: 'unit', price: 1200, status: 'active' },
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

  console.log('📦 Seeding products...');
  for (const p of products) {
    try {
      await db.collection('catalog_product').doc(p.id).create(p);
      console.log('✅', p.id);
    } catch (e) {
      if (e.code === 6) {
        console.log('➡️ Already exists, updating:', p.id);
        await db.collection('catalog_product').doc(p.id).set(p);
        console.log('✅ Updated:', p.id);
      } else {
        console.error('❌', p.id, e.message || e.code);
      }
    }
  }
  console.log('✅ Done seeding products');
}

seedProducts().then(() => process.exit());