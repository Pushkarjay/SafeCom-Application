import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore('safecom-database-nosql');

const DELETE_COLLECTIONS = ['Bookings', 'users'];

async function deleteCollections() {
  console.log('🗑️  Deleting irrelevant collections...\n');
  
  for (const collName of DELETE_COLLECTIONS) {
    const coll = db.collection(collName);
    const snapshot = await coll.limit(500).get();
    
    if (snapshot.size === 0) {
      console.log(`  ${collName}: already empty`);
      continue;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`  ✅ DELETED: ${collName} (${snapshot.size} docs)`);
    
    // Check if more docs exist
    const remaining = await coll.count().get();
    if (remaining.data().count > 0) {
      console.log(`     ↳ ${remaining.data().count} more docs - deleting again...`);
      const more = await coll.limit(500).get();
      const b2 = db.batch();
      more.docs.forEach(d => b2.delete(d.ref));
      await b2.commit();
    }
  }
  
  console.log('\n✅ Cleanup complete!');
  
  // Show remaining
  console.log('\n📊 Remaining Collections:');
  const collections = await db.listCollections();
  for (const coll of collections) {
    const countSnap = await coll.count().get();
    console.log(`  ${coll.id}: ${countSnap.data().count} docs`);
  }
}

deleteCollections().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });