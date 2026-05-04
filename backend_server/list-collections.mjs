import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

async function listCollections() {
  const collections = await admin.firestore().listCollections();
  for (const collection of collections) {
    console.log(`Collection: ${collection.id}`);
    const snapshot = await collection.limit(3).get();
    console.log(`  Count in first 3: ${snapshot.size}`);
    if (snapshot.size > 0) {
      console.log(`  First doc ID: ${snapshot.docs[0].id}`);
      console.log(`  First doc Keys: ${Object.keys(snapshot.docs[0].data()).join(', ')}`);
    }
  }
}

listCollections().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
