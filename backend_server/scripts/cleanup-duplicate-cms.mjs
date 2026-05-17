/**
 * Cleanup script: removes auto-seeded CMS blocks that duplicate template content.
 *
 * Run: node scripts/cleanup-duplicate-cms.mjs
 *
 * The defaultHomeLayout() in sduiService.ts already has:
 *   - banner  "Browse All Products"
 *   - promo_banner "Get 10% OFF on your first installation"
 *   - info_card "Service not available in your area"
 *   - announcements_list "Latest Updates"
 *
 * The old getDefaultCmsBlocks() auto-seeded identical content into home_cms,
 * causing visible duplicates. This script deletes those duplicates.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))

const keyPath = resolve(__dirname, '..', 'service-account-key.json')
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))

const DUPLICATE_TITLES = [
  'Browse All Products',
  'Get 10% OFF on your first installation',
  'Service not available in your area',
  'Current Location',
  'Latest Updates',
]

async function cleanup() {
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }

  const databaseId = process.env.FIRESTORE_DB_ID || 'safecom-database-nosql'
  const db = getFirestore(admin.apps[0], databaseId)
  try { db.settings({ ignoreUndefinedProperties: true }) } catch {}

  const cmsRef = db.collection('home_cms')
  const snapshot = await cmsRef.get()

  let deleted = 0
  let skipped = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const title = (data.title || '').trim()

    if (DUPLICATE_TITLES.some((dt) => title.includes(dt) || dt.includes(title))) {
      console.log(`Deleting "${title}" (${doc.id})`)
      await doc.ref.delete()
      deleted++
    } else {
      skipped++
    }
  }

  console.log(`\nDone. Deleted ${deleted} duplicate blocks. ${skipped} non-duplicates preserved.`)
  process.exit(0)
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
