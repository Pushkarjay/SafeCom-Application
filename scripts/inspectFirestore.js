const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
  projectId: 'safecom-application-01',
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function inspectFirestore() {
  const collections = {};
  const collectionsList = await db.listCollections();
  
  for (const collectionRef of collectionsList) {
    const collectionId = collectionRef.id;
    collections[collectionId] = {};
    
    // Get some documents
    const snapshot = await collectionRef.limit(10).get(); // Limit to 10 for inspection
    collections[collectionId].documents = snapshot.docs.map(d => ({ id: d.id, fields: Object.keys(d.data()), sampleData: d.data() }));
  }
  
  // Special focus: P_Service collection
  const pserviceRef = db.collection('P_Service');
  const pserviceSnapshot = await pserviceRef.get();
  const pserviceAnalysis = {};
  for (const doc of pserviceSnapshot.docs) {
    pserviceAnalysis[doc.id] = doc.data(); // Simple for now
  }
  
  // Create firestore-analysis folder if not exists
  const analysisDir = 'firestore-analysis';
  if (!fs.existsSync(analysisDir)) {
    fs.mkdirSync(analysisDir);
  }
  
  // Save to files
  fs.writeFileSync(path.join(analysisDir, 'collections.json'), JSON.stringify(collections, null, 2));
  fs.writeFileSync(path.join(analysisDir, 'pservice-analysis.json'), JSON.stringify(pserviceAnalysis, null, 2));
  fs.writeFileSync(path.join(analysisDir, 'structure.json'), JSON.stringify({
    totalCollections: Object.keys(collections).length,
    pserviceMappings: pserviceAnalysis
  }, null, 2));
  
  // Generate README
  const readme = `# Firestore Analysis

## Current Structure
- Total Collections: ${Object.keys(collections).length}
- P_Service Analysis: ${Object.keys(pserviceAnalysis).length} documents

## Problems Identified
- Deep nested maps in P_Service
- Difficult to query and maintain
- Scalability issues

## Recommended Migration
Convert to normalized collections: PService, Catalog_Product, etc.
`;
  fs.writeFileSync(path.join(analysisDir, 'README.md'), readme);
  
  console.log('Inspection complete. Files saved in firestore-analysis/');
}

async function inspectDocument(ref) {
  const doc = await ref.get();
  const data = doc.data();
  const subcollections = {};
  const subRefs = await ref.listCollections();
  for (const subRef of subRefs) {
    const subDocs = await subRef.get();
    subcollections[subRef.id] = subDocs.docs.map(d => ({ id: d.id, data: d.data() }));
  }
  return { data, subcollections };
}

async function inspectCollection(ref, obj, depth) {
  if (depth > 3) return; // Limit depth
  const docs = await ref.get();
  obj.documents = docs.docs.map(d => ({ id: d.id, fields: Object.keys(d.data()), sampleData: d.data() }));
}

inspectFirestore().catch(console.error);