import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, '../backend_server/service-account-key.json'), 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Collections that should be KEPT (actively used in backend)
const KEEP_COLLECTIONS = new Set([
  'admins',
  'customers', 
  'technicians',
  'jobs',
  'bookings',
  'payments',
  'catalog_product',
  'catalog_metadata',
  'catalog_packages',
  'catalog_addons',
  'catalog_taxes',
  'catalog_invoices',
  'catalog_recommendations',
  'catalog_accessories',
  'catalog_services',
  'Services',
  'employees',
  'users',
  'catalog_sdui_layouts',
  'feature_flags'
]);

async function cleanupCollections() {
  console.log('Fetching all collections...\n');
  
  // Get all root-level collections
  const collections = await db.listCollections();
  console.log(`Found ${collections.length} collections total\n`);
  
  let kept = 0;
  let deleted = 0;
  
  for (const coll of collections) {
    const collName = coll.id;
    const shouldKeep = KEEP_COLLECTIONS.has(collName);
    
    // Get document count
    const snapshot = await coll.count().get();
    const docCount = snapshot.data().count;
    
    if (shouldKeep) {
      console.log(`✅ KEEP: "${collName}" (${docCount} docs)`);
      kept++;
    } else {
      console.log(`🗑️  DELETE: "${collName}" (${docCount} docs)`);
      
      // Delete all documents in the collection
      const docs = await coll.limit(500).get();
      const batch = db.batch();
      
      docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      if (docs.size > 0) {
        await batch.commit();
        console.log(`   → Deleted ${docs.size} documents`);
        
        // Check if more docs remain
        const remaining = await coll.count().get();
        if (remaining.data().count > 0) {
          console.log(`   ⚠️  Still ${remaining.data().count} docs remaining`);
        }
      }
      
      deleted++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Kept: ${kept} collections`);
  console.log(`   Deleted: ${deleted} collections`);
}

cleanupCollections()
  .then(() => {
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });