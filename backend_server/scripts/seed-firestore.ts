import 'dotenv/config'
import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { adminUsers, customers, technicians, jobs, payments, catalogProducts } from '../src/data/mock-data.js'

function initializeFirestore() {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for seeding Firestore')
  }

  const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'))
  const app = initializeApp({ credential: cert(serviceAccount) })
  return getFirestore(app, 'default')
}

async function seedCollection(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  records: Array<{ id: string } & Record<string, unknown>>
) {
  const batch = db.batch()

  for (const record of records) {
    const { id, ...data } = record
    batch.set(db.collection(collectionName).doc(id), {
      ...data,
      id,
      updatedAt: new Date().toISOString()
    })
  }

  await batch.commit()
  console.log(`Seeded ${records.length} documents into ${collectionName}`)
}

// Data migrated from mobile_customer/lib/data/datasources/mock_api_transport.dart
const serviceCatalogData = [
  { id: 'installation', title: 'Installation', icon: '📹', enabled: true },
  { id: 'maintenance', title: 'Maintenance', icon: '🛠', enabled: true },
  { id: 'amc', title: 'AMC Plans', icon: '🧰', enabled: true },
  { id: 'repair', title: 'Camera Repair', icon: '🔧', enabled: true },
  { id: 'upgrade', title: 'System Upgrade', icon: '⬆️', enabled: true },
  { id: 'accessories', title: 'Accessories', icon: '🧷', enabled: true },
]

const installationPricingData = [
  {
    id: 'installation',
    nvrByPackage: { '4': 4000, '8': 6400, '16': 9800, '32': 14800 },
    cameraByMp: { '2MP': 1800, '5MP': 2600 },
    hddBySize: { '1TB': 3500, '2TB': 5200, '3TB': 6900 },
    cableKitPrice: 950,
    connectorPrice: 60,
    wiringPrice: 35,
    installationChargePrice: 250
  }
]

const maintenancePricingData = [
  {
    id: 'maintenance',
    planVisits: { 'Basic': 1, 'Standard': 2, 'Comprehensive': 4 },
    itemTemplates: [
      { key: 'inspection', name: 'System Inspection Visit', unitPrice: 799, baseQuantity: 1, multiplyByVisitCount: true, canEditQuantity: false },
      { key: 'cleaning', name: 'Camera Cleaning & Refocus', unitPrice: 199, baseQuantity: 8, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'healthcheck', name: 'NVR/DVR Health Check', unitPrice: 349, baseQuantity: 1, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'rewiring', name: 'Minor Rewiring Support', unitPrice: 120, baseQuantity: 10, multiplyByVisitCount: false, canEditQuantity: true },
      { key: 'labour', name: 'Service Labor Charges', unitPrice: 299, baseQuantity: 1, multiplyByVisitCount: true, canEditQuantity: false }
    ]
  }
]

const repairPricingData = [
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
    ]
  }
]

const upgradeBundlesData = [
  { id: 'upg_2mp_to_5mp', name: '2MP to 5MP Upgrade', description: 'Upgrade existing cameras for better clarity.', price: 6999 },
  { id: 'upg_nvr_storage', name: 'NVR + Storage Upgrade', description: 'Increase channel and storage capacity.', price: 8999 },
  { id: 'upg_full_stack', name: 'Full Surveillance Upgrade', description: 'Camera, NVR, and network optimization bundle.', price: 14999 }
]

const accessoriesData = [
  { id: 'acc_junction', name: 'Junction Box', price: 220 },
  { id: 'acc_cat6', name: 'Cat6 Cable (10m)', price: 450 },
  { id: 'acc_poe', name: 'PoE Switch', price: 1999 },
  { id: 'acc_adapter', name: 'Power Adapter', price: 350 }
]

async function main() {
  const db = initializeFirestore()

  await Promise.all([
    seedCollection(db, 'admins', adminUsers.map(({ password, ...user }) => ({ ...user, password }))),
    seedCollection(db, 'customers', customers),
    seedCollection(db, 'technicians', technicians),
    seedCollection(db, 'jobs', jobs),
    seedCollection(db, 'payments', payments),
    seedCollection(db, 'catalog_products', catalogProducts),
    // Seed mobile app service catalog and pricing
    seedCollection(db, 'services', serviceCatalogData),
    seedCollection(db, 'pricing', installationPricingData),
    seedCollection(db, 'pricing', maintenancePricingData),
    seedCollection(db, 'pricing', repairPricingData),
    seedCollection(db, 'upgrade_catalog', upgradeBundlesData),
    seedCollection(db, 'accessories_catalog', accessoriesData)
  ])

  console.log('Firestore seeding completed successfully')
}

main().catch((error) => {
  console.error('Firestore seeding failed:', error)
  process.exitCode = 1
})
