import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account-key.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore('safecom-database-nosql');

async function checkAndDelete() {
  console.log('📊 Current Collections:\n');
  
  const collections = await db.listCollections();
  
  for (const coll of collections) {
    const countSnap = await coll.count().get();
    const count = countSnap.data().count;
    console.log(`  ${coll.id}: ${count} docs`);
  }
  
  console.log('\n🗑️  Collections to DELETE:');
  console.log('  - Bookings (use jobs instead)');
  console.log('  - users (not used)');
  
  console.log('\n✅ Collections to KEEP:');
  console.log('  - admins, customers, employees');
  console.log('  - catalog_product, Services');
  console.log('  - sdui_layouts, Invoices');
}

checkAndDelete().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });