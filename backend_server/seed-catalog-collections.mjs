import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

const db = admin.firestore();

const packages = [
  { id: 'PKG001', name: 'Starter CCTV 4CH', description: 'Basic 4-channel system with 2MP cameras', productIds: ['PROD001', 'PROD003'], totalPrice: 12000, discountPercent: 10, finalPrice: 10800, status: 'active' },
  { id: 'PKG002', name: 'Professional CCTV 8CH', description: 'Professional 8-channel system with 5MP cameras', productIds: ['PROD002', 'PROD004'], totalPrice: 18000, discountPercent: 15, finalPrice: 15300, status: 'active' },
  { id: 'PKG003', name: 'Enterprise CCTV 16CH', description: 'Enterprise solution with high-res cameras and storage', productIds: ['PROD002', 'PROD004', 'PROD005'], totalPrice: 28000, discountPercent: 20, finalPrice: 22400, status: 'active' }
];

const addons = [
  { id: 'ADD001', name: 'Additional 2MP Camera', description: 'Extra 2MP IP camera for expansion', category: 'Cameras', price: 1800, status: 'active' },
  { id: 'ADD002', name: 'Additional 5MP Camera', description: 'Extra 5MP IP camera for expansion', category: 'Cameras', price: 2800, status: 'active' },
  { id: 'ADD003', name: 'Extra Hard Disk 2TB', description: 'Additional storage for longer retention', category: 'Storage', price: 4800, status: 'active' },
  { id: 'ADD004', name: 'Backup Power Supply UPS', description: '2KVA UPS for system backup', category: 'Power', price: 5999, status: 'active' },
  { id: 'ADD005', name: 'Monitor 24" Full HD', description: 'Professional grade monitoring display', category: 'Display', price: 8999, status: 'active' }
];

const taxes = [
  { id: 'TAX001', name: 'GST 5%', description: 'Goods and Services Tax - Electronics', rate: 5, status: 'active' },
  { id: 'TAX002', name: 'GST 12%', description: 'Goods and Services Tax - Services', rate: 12, status: 'active' },
  { id: 'TAX003', name: 'GST 18%', description: 'Goods and Services Tax - Premium Services', rate: 18, status: 'active' }
];

const recommendations = [
  { id: 'REC001', name: 'Best for Small Shops', description: 'Recommended package for small retail businesses', productIds: ['PROD001', 'PROD003'], priority: 1, status: 'active' },
  { id: 'REC002', name: 'Best for Medium Offices', description: 'Recommended package for medium-sized offices', productIds: ['PROD002', 'PROD004', 'PROD005'], priority: 2, status: 'active' },
  { id: 'REC003', name: 'Best for Large Enterprises', description: 'Recommended package for large enterprises', productIds: ['PROD002', 'PROD004', 'PROD005', 'PROD006'], priority: 3, status: 'active' }
];

const invoices = [
  { id: 'INV001', name: 'Standard Invoice', description: 'Standard invoice template for products and services', terms: 'Net 30', notes: 'Thank you for your business', showTax: true, status: 'active' },
  { id: 'INV002', name: 'Service Invoice', description: 'Invoice template for maintenance and repair services', terms: 'Net 15', notes: 'Service warranty 1 year', showTax: true, status: 'active' },
  { id: 'INV003', name: 'Installation Invoice', description: 'Invoice template for installation jobs', terms: 'Due on completion', notes: 'Final invoice after site inspection', showTax: true, status: 'active' }
];

async function seedData() {
  try {
    console.log('🌱 Starting catalog collection seeding...\n');

    // Seed packages
    console.log('📦 Seeding packages...');
    for (const pkg of packages) {
      await db.collection('catalog_packages').doc(pkg.id).set({ ...pkg, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${packages.length} packages\n`);

    // Seed addons
    console.log('➕ Seeding add-ons...');
    for (const addon of addons) {
      await db.collection('catalog_addons').doc(addon.id).set({ ...addon, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${addons.length} add-ons\n`);

    // Seed taxes
    console.log('💰 Seeding taxes...');
    for (const tax of taxes) {
      await db.collection('catalog_taxes').doc(tax.id).set({ ...tax, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${taxes.length} taxes\n`);

    // Seed recommendations
    console.log('⭐ Seeding recommendations...');
    for (const rec of recommendations) {
      await db.collection('catalog_recommendations').doc(rec.id).set({ ...rec, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${recommendations.length} recommendations\n`);

    // Seed invoice templates
    console.log('📄 Seeding invoice templates...');
    for (const inv of invoices) {
      await db.collection('catalog_invoices').doc(inv.id).set({ ...inv, updatedAt: new Date().toISOString() });
    }
    console.log(`✅ Seeded ${invoices.length} invoice templates\n`);

    console.log('🎉 All catalog collections seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
