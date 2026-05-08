const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize with explicit project
initializeApp({
  projectId: 'safecom-application-01'
});
const db = getFirestore();

// Collections to DELETE (garbage/duplicates)
const DELETE_COLLECTIONS = [
  'customer_user',
  'sample_customer', 
  'admin_user',
  'employee_user',
  'Banners',
  'Bookings', 
  'Configurations',
  'Locations',
  'Offers',
  'Orders',
  'users'
];

// Collections to KEEP (actively used)
const KEEP_COLLECTIONS = [
  'admins',
  'customers',
  'technicians',
  'employees',
  'jobs',
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
  'catalog_sdui_layouts'
];

async function cleanup() {
  console.log('🔍 Scanning Firestore collections...\n');
  
  const collections = await db.listCollections();
  const totalCollections = collections.length;
  console.log(`Found ${totalCollections} collections\n`);
  
  let deleted = 0;
  let skipped = 0;
  
  for (const coll of collections) {
    const name = coll.id;
    
    if (DELETE_COLLECTIONS.includes(name)) {
      try {
        // Get all docs
        const snapshot = await coll.limit(1000).get();
        
        if (snapshot.size === 0) {
          console.log(`⚠️  "${name}" - empty collection, skip`);
          skipped++;
          continue;
        }
        
        // Delete in batch
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        console.log(`✅ DELETED: "${name}" (${snapshot.size} docs)`);
        deleted++;
        
        // Check if more remain
        const remaining = await coll.count().get();
        if (remaining.data().count > 0) {
          console.log(`   ↳ More docs remain: ${remaining.data().count}, run again`);
        }
      } catch (err) {
        console.log(`❌ Failed to delete "${name}": ${err.message}`);
      }
    } else if (KEEP_COLLECTIONS.includes(name)) {
      const count = await coll.count().get();
      console.log(`✅ KEEP: "${name}" (${count.data().count} docs)`);
      skipped++;
    } else {
      const count = await coll.count().get();
      console.log(`❓ UNKNOWN: "${name}" (${count.data().count} docs) - keeping for now`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Kept/Skipped: ${skipped}`);
}

cleanup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });