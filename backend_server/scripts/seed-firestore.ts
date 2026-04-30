import 'dotenv/config'
import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { adminUsers, customers, technicians, jobs, payments, catalogProducts } from '../src/data/mock-data.ts'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

if (!credentialsPath) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for seeding Firestore')
}

const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'))
const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app, 'default')

type SeedRecord = { id: string } & Record<string, unknown>

async function seedCollection(collectionName: string, data: SeedRecord[]) {
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

const employeesData = [
  {
    id: 'TECH001',
    name: 'John Technician',
    email: 'john.tech@safecom.com',
    phone: '+91 98765 43210',
    location: 'Mumbai, Maharashtra',
    joinDate: new Date(2024, 0, 15).toISOString(),
    rating: 4.8,
    totalJobs: 156,
    completedJobs: 148,
    skills: ['CCTV Installation', 'DVR Configuration', 'Wiring', 'Maintenance'],
    status: 'active',
    profileImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'TECH002',
    name: 'Jane Smith',
    email: 'jane.smith@safecom.com',
    phone: '+91 91234 56789',
    location: 'Delhi, NCR',
    joinDate: new Date(2023, 5, 20).toISOString(),
    rating: 4.9,
    totalJobs: 210,
    completedJobs: 205,
    skills: ['Access Control', 'Biometric Systems', 'Alarm Systems'],
    status: 'active',
    profileImageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
];

const earningsData = [
  {
    id: 'EARN001',
    employeeId: 'TECH001',
    jobId: 'JOB001',
    customer: 'Rahul Sharma',
    amount: 2500,
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    status: 'paid',
  },
  {
    id: 'EARN002',
    employeeId: 'TECH001',
    jobId: 'JOB002',
    customer: 'Priya Patel',
    amount: 1800,
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    status: 'paid',
  },
  {
    id: 'EARN003',
    employeeId: 'TECH001',
    jobId: 'JOB003',
    customer: 'Amit Kumar',
    amount: 3200,
    date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    status: 'pending',
  },
  {
    id: 'EARN004',
    employeeId: 'TECH002',
    jobId: 'JOB004',
    customer: 'Sneha Gupta',
    amount: 1500,
    date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
    status: 'paid',
  },
];

async function main() {
  console.log('Starting Firestore seeding...');
  try {
    await seedCollection('admins', adminUsers.map(({ password, ...user }) => user));
    await seedCollection('customers', customers);
    await seedCollection('technicians', technicians);
    await seedCollection('jobs', jobs);
    await seedCollection('payments', payments);
    await seedCollection('catalog_products', catalogProducts);
    await seedCollection('services', serviceCatalogData);
    await seedCollection('pricing_installation', installationPricingData);
    await seedCollection('pricing_maintenance', maintenancePricingData);
    await seedCollection('pricing_repair', repairPricingData);
    await seedCollection('upgrade_catalog', upgradeBundlesData);
    await seedCollection('accessories_catalog', accessoriesData);
    await seedCollection('employees', employeesData);
    await seedCollection('earnings', earningsData);
    console.log('Firestore seeding completed successfully.');
  } catch (error) {
    console.error('Error during Firestore seeding:', error);
    process.exit(1);
  }
}

main();
