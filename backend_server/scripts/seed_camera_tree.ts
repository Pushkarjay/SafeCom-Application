/**
 * Seed camera tree structure into 16 Camera Setup
 * Run: npx tsx scripts/seed_camera_tree.ts (reads GOOGLE_APPLICATION_CREDENTIALS from .env)
 */

import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })
console.log('   Env loaded, creds path:', process.env.GOOGLE_APPLICATION_CREDENTIALS)

const SERVICE_COLLECTION = 'Services'
const PRODUCT_COLLECTION = 'catalog_product'

// Find service account - check multiple possible paths
const possibleCreds = [
  resolve(__dirname, '..', '.env.local'),
  resolve(__dirname, '..', 'service-account-key.json'),
  resolve(__dirname, '..', 'service-account.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS,
].filter(Boolean)

let credPath = ''
for (const p of possibleCreds) {
  if (p && existsSync(p)) { credPath = p; break }
}

if (!credPath) {
  console.error('Service account not found. Checked:')
  for (const p of possibleCreds) console.error(`  - ${p}`)
  process.exit(1)
}

console.log(`   Using service account: ${credPath}`)

const serviceAccount = JSON.parse(readFileSync(credPath, 'utf8'))

async function main() {
  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) })
  }
  const db = getFirestore(undefined, 'safecom-database-nosql')

  // 1. Fetch existing products
  console.log('1. Fetching catalog products...')
  const productsSnap = await db.collection(PRODUCT_COLLECTION).get()
  const productMap = new Map<string, { name: string; price: number }>()
  productsSnap.docs.forEach(doc => {
    const d = doc.data()
    productMap.set(doc.id, { name: d.name || d.productName || doc.id, price: d.price || d.basePrice || 0 })
  })
  console.log(`   Found ${productsSnap.size} products`)

  const cameraIds = ['PROD007', 'PROD008', 'PROD021', 'PROD022', 'PROD023', 'PROD024', 'PROD025', 'PROD026', 'PROD027', 'PROD028']
  console.log('\n2. Verifying camera products...')
  for (const id of cameraIds) {
    const p = productMap.get(id)
    if (p) {
      console.log(`   ✓ ${id}: ${p.name} - ₹${p.price}`)
    } else {
      console.log(`   ✗ ${id}: NOT FOUND in catalog (will use placeholder)`)
    }
  }

  // 3. Find IP Camera / 16 Camera Setup
  console.log('\n3. Locating 16 Camera Setup...')
  const installDoc = await db.collection(SERVICE_COLLECTION).doc('Installation').get()
  if (!installDoc.exists) { console.error('Installation service not found!'); return }
  
  const data = installDoc.data() || {}
  const cats = Object.keys(data)
  
  const ipCameraKey = cats.find(k => k.includes('IP Camera')) || cats[0]
  const catData = data[ipCameraKey] || {}
  const setups = Object.keys(catData)
  
  let setupKey = setups.find(k => k.includes('16 Camera'))
  if (!setupKey) {
    console.log(`   16 Camera Setup not found in "${ipCameraKey}". Available: ${setups.join(', ')}`)
    // Try each category
    for (const catKey of cats) {
      const setups2 = Object.keys(data[catKey] || {})
      setupKey = setups2.find(k => k.includes('16 Camera'))
      if (setupKey) { console.log(`   Found in category "${catKey}"`); break }
    }
    if (!setupKey) {
      console.log('   Let me use the first available setup for testing.')
      setupKey = setups[0]
    }
  }
  
  console.log(`   Using: ${ipCameraKey} → ${setupKey}`)
  
  const setupData = catData[setupKey] || {}
  const currentProducts = Object.keys(setupData)
  console.log(`   Current products (${currentProducts.length}): ${currentProducts.join(', ')}`)

  // 4. Build updates
  console.log('\n4. Building camera tree...')
  
  const makePriceRef = (productId: string) => db.collection(PRODUCT_COLLECTION).doc(productId)
  
  const cameraTree = {
    'Camera': {
      '2.4 MP': {
        'renderType': 'list',
        'collectiveValidation': true,
        'CP-Plus 2.4MP B/W Indoor Camera': { 'Deafult q': 0, 'Price': makePriceRef('PROD021'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP B/W Outdoor Camera': { 'Deafult q': 0, 'Price': makePriceRef('PROD022'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Indoor Camera': { 'Deafult q': 0, 'Price': makePriceRef('PROD023'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Outdoor Camera': { 'Deafult q': 0, 'Price': makePriceRef('PROD024'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Indoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': makePriceRef('PROD025'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP Color Outdoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': makePriceRef('PROD026'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP B/W Indoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': makePriceRef('PROD027'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 2.4MP B/W Outdoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': makePriceRef('PROD028'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
      },
      '4 MP': {
        'renderType': 'list',
        'collectiveValidation': true,
        'CP Plus 4MP Color Indoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': makePriceRef('PROD007'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
        'CP Plus 4MP Color Outdoor Camera with Audio Built In': { 'Deafult q': 0, 'Price': makePriceRef('PROD008'), 'available': true, 'min q': 0, 'max q': 50, 'rigid': false },
      }
    }
  }

  console.log('   Tree: Camera → [2.4 MP (8 cameras), 4 MP (2 cameras)] → cameras')

  // 5. Build Firestore update object
  const updates: Record<string, unknown> = {}
  
  // Clear existing flat products
  for (const pk of currentProducts) {
    updates[`${ipCameraKey}.${setupKey}.${pk}`] = FieldValue.delete()
  }
  
  // Set nested tree as Camera product slot
  updates[`${ipCameraKey}.${setupKey}.Camera`] = cameraTree['Camera']

  console.log('\n5. Writing to Firestore...')
  await db.collection(SERVICE_COLLECTION).doc('Installation').update(updates)
  
  console.log('   ✓ Camera tree seeded!')

  // 6. Verify
  console.log('\n6. Verifying...')
  const verify = await db.collection(SERVICE_COLLECTION).doc('Installation').get()
  const verifyData = verify.data() || {}
  const verifySetup = verifyData[ipCameraKey]?.[setupKey] || {}
  console.log(`   ${ipCameraKey}.${setupKey} now has ${Object.keys(verifySetup).length} products: ${Object.keys(verifySetup).join(', ')}`)
  
  const cameraSlot = verifySetup['Camera']
  if (cameraSlot) {
    console.log(`   Camera: ✓ (${Object.keys(cameraSlot).length} resolution branches)`)
  }

  console.log('\n✅ Done! Refresh admin dashboard → Installation Builder to see the nested tree.')
}

main().catch(err => { console.error(err); process.exit(1) })