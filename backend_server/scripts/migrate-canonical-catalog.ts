import 'dotenv/config'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID || 'safecom-application-01'
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'default'

const app = initializeApp({
  credential: applicationDefault(),
  projectId
})

const db = getFirestore(app, databaseId)

const legacyCollections = [
  'catalog_products',
  'catalog_addons',
  'catalog_packages',
  'catalog_recommendations',
  'catalog_taxes',
  'pricing',
  'pricing_installation',
  'pricing_maintenance',
  'pricing_repair',
  'services',
  'upgrade_catalog',
  'accessories_catalog',
  'catalog_pricing',
  'catalog_upgrade_bundles'
]

type SeedRecord = { id: string } & Record<string, unknown>

async function deleteCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get()
  if (snapshot.empty) {
    console.log(`No documents to delete in ${collectionName}`)
    return
  }

  const batch = db.batch()
  snapshot.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
  console.log(`Deleted ${snapshot.size} documents from ${collectionName}`)
}

async function seedCollection(collectionName: string, data: SeedRecord[]) {
  if (data.length === 0) {
    console.log(`Skipping ${collectionName}: no seed data`)
    return
  }

  const collectionRef = db.collection(collectionName)
  const batch = db.batch()

  for (const item of data) {
    const { id, ...record } = item
    batch.set(collectionRef.doc(id), {
      ...record,
      id,
      updatedAt: new Date().toISOString()
    })
  }

  await batch.commit()
  console.log(`Seeded ${data.length} documents into ${collectionName}`)
}

const masterProducts: SeedRecord[] = [
  {
    id: 'PROD001',
    productName: 'Junction Box',
    category: 'accessories',
    basePrice: 220,
    isAvailable: true,
    taxRate: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PROD002',
    productName: 'Cat6 Cable (10m)',
    category: 'accessories',
    basePrice: 450,
    isAvailable: true,
    taxRate: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PROD003',
    productName: 'PoE Switch',
    category: 'accessories',
    basePrice: 1999,
    isAvailable: true,
    taxRate: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'PROD004',
    productName: 'Power Adapter',
    category: 'accessories',
    basePrice: 350,
    isAvailable: true,
    taxRate: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const catalogServices: SeedRecord[] = [
  { id: 'installation', serviceName: 'Installation', category: 'installation', productIds: [], basePrice: 0, isAvailable: true, isRecurring: false, taxRate: 18, displayPriority: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), serviceConfig: { icon: '📹' } },
  { id: 'maintenance', serviceName: 'Maintenance', category: 'maintenance', productIds: [], basePrice: 0, isAvailable: true, isRecurring: true, taxRate: 18, displayPriority: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), serviceConfig: { icon: '🛠' } },
  { id: 'amc', serviceName: 'AMC Plans', category: 'amc', productIds: [], basePrice: 0, isAvailable: true, isRecurring: true, taxRate: 18, displayPriority: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), serviceConfig: { icon: '🧰' } },
  { id: 'repair', serviceName: 'Camera Repair', category: 'repair', productIds: [], basePrice: 0, isAvailable: true, isRecurring: false, taxRate: 18, displayPriority: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), serviceConfig: { icon: '🔧' } },
  { id: 'upgrade', serviceName: 'System Upgrade', category: 'upgrade', productIds: [], basePrice: 0, isAvailable: true, isRecurring: false, taxRate: 18, displayPriority: 5, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), serviceConfig: { icon: '⬆️' } },
  { id: 'accessories', serviceName: 'Accessories', category: 'accessories', productIds: [], basePrice: 0, isAvailable: true, isRecurring: false, taxRate: 18, displayPriority: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), serviceConfig: { icon: '🧷' } }
]

const catalogAccessories: SeedRecord[] = [
  { id: 'ACC001', name: 'Junction Box', category: 'Electrical', type: 'installation', price: 220, stock: 999, isAvailable: true, taxRate: 18, displayPriority: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC002', name: 'Cat6 Cable (10m)', category: 'Cable', type: 'installation', price: 450, stock: 999, isAvailable: true, taxRate: 18, displayPriority: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC003', name: 'PoE Switch', category: 'Network', type: 'upgrades', price: 1999, stock: 999, isAvailable: true, taxRate: 18, displayPriority: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC004', name: 'Power Adapter', category: 'Power', type: 'support', price: 350, stock: 999, isAvailable: true, taxRate: 18, displayPriority: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
]

const catalogRecommendations: SeedRecord[] = [
  {
    id: 'REC001',
    name: 'Recommended Accessories',
    description: 'These accessories are optional but recommended to optimize your service.',
    productIds: ['PROD001', 'PROD002', 'PROD003', 'PROD004'],
    placement: 'checkout',
    serviceTypes: ['installation'],
    isAvailable: true,
    displayPriority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

const catalogPricing: SeedRecord[] = [
  {
    id: 'installation',
    nvrByPackage: { '4': 4000, '8': 6400, '16': 9800, '32': 14800 },
    cameraByMp: { '2MP': 1800, '5MP': 2600 },
    hddBySize: { '1TB': 3500, '2TB': 5200, '3TB': 6900 },
    cableKitPrice: 950,
    connectorPrice: 60,
    wiringPrice: 35,
    installationChargePrice: 250,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'maintenance',
    planVisits: { 'Basic': 1, 'Standard': 2, 'Comprehensive': 4 },
    itemTemplates: [
      { key: 'inspection', name: 'System Inspection Visit', unitPrice: 799, baseQuantity: 1, multiplyByVisitCount: true, canEditQuantity: false },
      { key: 'cleaning', name: 'Camera Cleaning & Refocus', unitPrice: 199, baseQuantity: 8, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'healthcheck', name: 'NVR/DVR Health Check', unitPrice: 349, baseQuantity: 1, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'rewiring', name: 'Minor Rewiring Support', unitPrice: 120, baseQuantity: 10, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'labour', name: 'Service Labor Charges', unitPrice: 299, baseQuantity: 1, multiplyByVisitCount: true, canEditQuantity: false }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'repair',
    issues: [
      { id: 'no_video', title: 'No Video Output', visitFee: 299, diagnosticFee: 399 },
      { id: 'blurred_feed', title: 'Blurred / Distorted Feed', visitFee: 249, diagnosticFee: 349 },
      { id: 'recording_failure', title: 'Recording Failure', visitFee: 349, diagnosticFee: 449 }
    ],
    itemTemplates: [
      { key: 'camera_fix', name: 'Camera Repair Unit', unitPrice: 899, quantity: 1, canEditQuantity: true },
      { key: 'connector_replacement', name: 'Connector Replacement', unitPrice: 80, quantity: 4, canEditQuantity: true },
      { key: 'cable_patch', name: 'Cable Patch / Rework', unitPrice: 120, quantity: 5, canEditQuantity: true }
    ],
    updatedAt: new Date().toISOString()
  }
]

const upgradeBundles: SeedRecord[] = [
  { id: 'upg_2mp_to_5mp', name: '2MP to 5MP Upgrade', description: 'Upgrade existing cameras for better clarity.', price: 6999 },
  { id: 'upg_nvr_storage', name: 'NVR + Storage Upgrade', description: 'Increase channel and storage capacity.', price: 8999 },
  { id: 'upg_full_stack', name: 'Full Surveillance Upgrade', description: 'Camera, NVR, and network optimization bundle.', price: 14999 }
]

async function main() {
  console.log('Starting canonical catalog migration...')
  console.log(`Project: ${projectId}, DB: ${databaseId}`)

  for (const collection of legacyCollections) {
    await deleteCollection(collection)
  }

  await seedCollection('master_products', masterProducts)
  await seedCollection('catalog_services', catalogServices)
  await seedCollection('catalog_accessories', catalogAccessories)
  await seedCollection('catalog_recommendations', catalogRecommendations)
  await seedCollection('catalog_pricing', catalogPricing)
  await seedCollection('catalog_upgrade_bundles', upgradeBundles)

  console.log('Canonical catalog migration completed.')
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
