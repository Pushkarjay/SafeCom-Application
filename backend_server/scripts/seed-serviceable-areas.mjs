/**
 * Seed script: populate initial serviceable areas in Firestore.
 * These areas define geographic coverage zones for SafeCom services.
 *
 * Run: node scripts/seed-serviceable-areas.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = resolve(__dirname, '..', 'service-account-key.json')
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const databaseId = process.env.FIRESTORE_DB_ID || 'safecom-database-nosql'
const db = getFirestore(admin.apps[0], databaseId)
try { db.settings({ ignoreUndefinedProperties: true }) } catch {}

const DEFAULT_AREAS = [
  {
    areaCode: 'PATNA_CORE',
    areaName: 'Patna City Core',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 5,
    estimatedTimeToService: '2-4 hours',
    active: true,
  },
  {
    areaCode: 'PATNA_METRO',
    areaName: 'Patna Metropolitan',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 15,
    estimatedTimeToService: '4-8 hours',
    active: true,
  },
]

async function seed() {
  const col = db.collection('serviceable_areas')
  let created = 0
  let skipped = 0

  for (const area of DEFAULT_AREAS) {
    const ref = col.doc(area.areaCode)
    const snap = await ref.get()
    if (!snap.exists) {
      await ref.set(area)
      console.log(`Created: ${area.areaCode} — ${area.areaName}`)
      created++
    } else {
      skipped++
    }
  }

  console.log(`\nDone. ${created} created, ${skipped} already exist.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
