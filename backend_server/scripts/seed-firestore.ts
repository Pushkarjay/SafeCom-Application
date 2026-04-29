import 'dotenv/config'
import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { adminUsers, customers, technicians, jobs, payments } from '../src/data/mock-data.js'

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

async function main() {
  const db = initializeFirestore()

  await Promise.all([
    seedCollection(db, 'admins', adminUsers.map(({ password, ...user }) => ({ ...user, password }))),
    seedCollection(db, 'customers', customers),
    seedCollection(db, 'technicians', technicians),
    seedCollection(db, 'jobs', jobs),
    seedCollection(db, 'payments', payments)
  ])

  console.log('Firestore seeding completed successfully')
}

main().catch((error) => {
  console.error('Firestore seeding failed:', error)
  process.exitCode = 1
})
