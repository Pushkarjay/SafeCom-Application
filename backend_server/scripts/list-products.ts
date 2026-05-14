import 'dotenv/config'
import { readFileSync } from 'fs'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
const app = initializeApp({
  credential: credentialsPath ? cert(JSON.parse(readFileSync(credentialsPath, 'utf8'))) : applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'safecom-application-01'
})
const db = getFirestore(app, process.env.FIRESTORE_DB_ID || 'safecom-database-nosql')

async function run() {
  const snapshot = await db.collection('catalog_product').get()
  const products = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, price: doc.data().price }))
  
  // print all products
  products.forEach(p => console.log(`${p.id}: ${p.name} - ₹${p.price}`))
}

run().catch(console.error)
