const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'safecom-application-01',
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
db.settings({ databaseId: 'safecom-database-nosql' });

const ALLOWED_COLLECTIONS = new Set([
  'Services',
  'catalog_product',
  'customer_user',
  'employee_user',
  'admin_user',
  'Orders',
  'Bookings',
  'Configurations',
  'Banners',
  'Offers',
  'Locations',
  'Invoices'
]);

const CATALOG_ALLOWED_FIELDS = new Set([
  'id',
  'name',
  'category',
  'group',
  'unit',
  'price',
  'status',
  'updatedAt'
]);

async function listCollectionIds() {
  const collections = await db.listCollections();
  return collections.map((collection) => collection.id);
}

async function deleteQueryBatch(collectionRef, batchSize) {
  const snapshot = await collectionRef.limit(batchSize).get();
  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return snapshot.size + (await deleteQueryBatch(collectionRef, batchSize));
}

async function deleteCollection(name) {
  const collectionRef = db.collection(name);
  if (typeof db.recursiveDelete === 'function') {
    await db.recursiveDelete(collectionRef);
    return { name, method: 'recursive', deleted: 'all' };
  }

  const deleted = await deleteQueryBatch(collectionRef, 400);
  return { name, method: 'batch', deleted };
}

async function removeExtraCollections() {
  const existing = await listCollectionIds();
  const removed = [];

  for (const name of existing) {
    if (!ALLOWED_COLLECTIONS.has(name)) {
      const result = await deleteCollection(name);
      removed.push(result);
    }
  }

  return removed;
}

function buildCatalogPayload(docId, data) {
  const payload = {};
  CATALOG_ALLOWED_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      payload[field] = data[field];
    }
  });

  payload.id = docId;
  if (payload.price === undefined || payload.price === null) {
    payload.price = 0;
  }

  return payload;
}

async function pruneCatalogProductFields() {
  const snapshot = await db.collection('catalog_product').get();
  if (snapshot.empty) {
    return { total: 0, updated: 0 };
  }

  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const payload = buildCatalogPayload(doc.id, data);
    const keys = Object.keys(data);
    const hasExtraField = keys.some((key) => !CATALOG_ALLOWED_FIELDS.has(key));
    const needsPrice = data.price === undefined || data.price === null;
    const needsId = data.id !== doc.id;

    if (hasExtraField || needsPrice || needsId) {
      await doc.ref.set(payload, { merge: false });
      updated += 1;
    }
  }

  return { total: snapshot.size, updated };
}

async function cleanupFirestore() {
  const removedCollections = await removeExtraCollections();
  const catalogResult = await pruneCatalogProductFields();

  console.log('Cleanup complete.');
  if (removedCollections.length) {
    console.log('Removed collections:');
    removedCollections.forEach((entry) => {
      console.log(`- ${entry.name} (${entry.method})`);
    });
  } else {
    console.log('No extra collections found.');
  }

  console.log(
    `catalog_product sanitized: ${catalogResult.updated}/${catalogResult.total} docs updated.`
  );
}

cleanupFirestore().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
