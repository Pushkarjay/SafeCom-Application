import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./service-account-key.json', 'utf8')
)
initializeApp({ credential: cert(serviceAccount) })
import { getApp } from 'firebase-admin/app'
const db = getFirestore(getApp(), 'default')

// ============================================
// MAINTENANCE CONFIG DATA
// ============================================

const maintenanceConfig = {
  planVisits: { Basic: 1, Standard: 2, Comprehensive: 4 },
  itemTemplates: [
    {
      key: 'inspection',
      name: 'System Inspection Visit',
      unitPrice: 799,
      baseQuantity: 1,
      multiplyByVisitCount: true,
      canEditQuantity: false,
    },
    {
      key: 'cleaning',
      name: 'Camera Cleaning & Refocus',
      unitPrice: 199,
      baseQuantity: 8,
      multiplyByVisitCount: false,
      canEditQuantity: true,
    },
    {
      key: 'healthcheck',
      name: 'NVR/DVR Health Check',
      unitPrice: 349,
      baseQuantity: 1,
      multiplyByVisitCount: false,
      canEditQuantity: true,
    },
    {
      key: 'rewiring',
      name: 'Minor Rewiring Support',
      unitPrice: 120,
      baseQuantity: 10,
      multiplyByVisitCount: false,
      canEditQuantity: true,
    },
    {
      key: 'labour',
      name: 'Service Labor Charges',
      unitPrice: 299,
      baseQuantity: 1,
      multiplyByVisitCount: true,
      canEditQuantity: false,
    },
  ],
  maintenanceTypes: [
    { id: 'preventive', name: 'Preventive Maintenance', icon: 'settings_suggest_outlined', order: 1 },
    { id: 'fault_diagnosis', name: 'Fault Diagnosis', icon: 'troubleshoot', order: 2 },
    { id: 'performance_tuning', name: 'Performance Tuning', icon: 'tune', order: 3 },
  ],
}

// ============================================
// REPAIR CONFIG DATA
// ============================================

const repairConfig = {
  issues: [
    { id: 'no_video', title: 'No Video Output', visitFee: 299, diagnosticFee: 399 },
    { id: 'night_vision', title: 'Night Vision Not Working', visitFee: 299, diagnosticFee: 349 },
    { id: 'blurry_image', title: 'Blurry / Distorted Image', visitFee: 299, diagnosticFee: 349 },
    { id: 'hdd_failure', title: 'HDD / Storage Failure', visitFee: 299, diagnosticFee: 499 },
    { id: 'network_issue', title: 'Network Connectivity Issue', visitFee: 299, diagnosticFee: 399 },
    { id: 'power_issue', title: 'Power / Adapter Issue', visitFee: 299, diagnosticFee: 249 },
    { id: 'other', title: 'Other Issue', visitFee: 349, diagnosticFee: 499 },
  ],
  itemTemplates: [
    { key: 'camera_fix', name: 'Camera Repair Unit', unitPrice: 899, quantity: 1, canEditQuantity: true },
    { key: 'connector_replacement', name: 'Connector Replacement', unitPrice: 80, quantity: 4, canEditQuantity: true },
    { key: 'cable_replacement', name: 'Cable Replacement (per run)', unitPrice: 150, quantity: 1, canEditQuantity: true },
    { key: 'power_adapter', name: 'Power Adapter Replacement', unitPrice: 250, quantity: 1, canEditQuantity: true },
  ],
}

// ============================================
// AMC CONFIG DATA
// ============================================

const amcConfig = {
  plans: [
    {
      id: 'bronze',
      name: 'Bronze AMC',
      subtitle: '2 preventive visits/year',
      price: 2999,
      features: ['2 preventive maintenance visits', 'Basic system health report', 'Email support'],
      order: 1,
    },
    {
      id: 'silver',
      name: 'Silver AMC',
      subtitle: '4 preventive visits/year + priority support',
      price: 4999,
      features: ['4 preventive maintenance visits', 'Detailed health report', 'Priority phone support', '10% discount on repairs'],
      order: 2,
    },
    {
      id: 'gold',
      name: 'Gold AMC',
      subtitle: '6 visits/year + emergency response support',
      price: 7999,
      features: ['6 preventive maintenance visits', 'Full system audit report', '24/7 emergency support', '20% discount on repairs', 'Free minor part replacements'],
      order: 3,
    },
  ],
}

// ============================================
// UPGRADE CONFIG DATA
// ============================================

const upgradeConfig = {
  bundles: [
    {
      id: 'analog_to_ip',
      name: 'Analog to IP Upgrade',
      description: 'Upgrade your existing analog/DVR setup to modern IP cameras with NVR. Includes camera swap, NVR, cabling, and labor.',
      price: 12999,
      order: 1,
    },
    {
      id: 'storage_expansion',
      name: 'Storage Expansion',
      description: 'Add more storage capacity to your existing NVR/DVR. Includes HDD and installation.',
      price: 4999,
      order: 2,
    },
    {
      id: 'camera_count_increase',
      name: 'Camera Count Upgrade',
      description: 'Add more cameras to your existing setup. Includes cameras, cabling, and configuration.',
      price: 8999,
      order: 3,
    },
  ],
}

// ============================================
// SEED
// ============================================

async function seed() {
  console.log('🌱 Seeding Maintenance, Repair, AMC & Upgrade Configs...\n')

  const now = new Date().toISOString()
  let count = 0

  // Seed maintenance config
  await db.collection('catalog_pricing').doc('maintenance').set({
    ...maintenanceConfig,
    name: 'Maintenance Config',
    updatedAt: now,
  })
  count++
  console.log('  ✅ catalog_pricing/maintenance')

  // Seed repair config
  await db.collection('catalog_pricing').doc('repair').set({
    ...repairConfig,
    name: 'Repair Config',
    updatedAt: now,
  })
  count++
  console.log('  ✅ catalog_pricing/repair')

  // Seed AMC config
  await db.collection('catalog_pricing').doc('amc').set({
    ...amcConfig,
    name: 'AMC Config',
    updatedAt: now,
  })
  count++
  console.log('  ✅ catalog_pricing/amc')

  // Seed upgrade config
  await db.collection('catalog_pricing').doc('upgrade').set({
    ...upgradeConfig,
    name: 'Upgrade Config',
    updatedAt: now,
  })
  count++
  console.log('  ✅ catalog_pricing/upgrade')

  console.log(`\n🎉 Seed complete! Added ${count} service config documents.`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
