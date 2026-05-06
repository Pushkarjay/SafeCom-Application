import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

async function checkCollection(name) {
  const snapshot = await admin.firestore().collection(name).get();
  console.log(`\nCollection: ${name}`);
  console.log(`Total documents: ${snapshot.size}`);
  if (snapshot.size > 0) {
    const doc = snapshot.docs[0];
    console.log(`Sample ID: ${doc.id}`);
    console.log(`Sample Data:`, JSON.stringify(doc.data(), null, 2));
  }
}

async function run() {
  await checkCollection('catalog_products');
  await checkCollection('catalog_accessories');
  await checkCollection('catalog_services');
  await checkCollection('catalog_upgrade_bundles');
  await checkCollection('catalog_pricing');
  process.exit(0);
}

run().catch(console.error);
