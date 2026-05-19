import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, CollectionReference, Query } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let firebaseApp: App | undefined;
let firestoreDb: Firestore | undefined;

/**
 * Initialize Firebase Admin SDK with service account credentials.
 * Looks for GOOGLE_APPLICATION_CREDENTIALS env var or falls back to embedded credentials.
 */
export function initFirebase(): Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  try {
    // Try to use environment variable for credentials path
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (credentialsPath) {
      const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf-8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      // Fallback: use application default credentials (works on Cloud Run)
      firebaseApp = initializeApp();
    }

    const databaseId = process.env.FIRESTORE_DB_ID || 'safecom-database-nosql';
    firestoreDb = getFirestore(firebaseApp, databaseId);
    // Avoid failures when objects contain undefined values (client sometimes sends optional
    // fields that are undefined). This mirrors the behavior of other SDKs and prevents the
    // Firestore serializer from throwing: "Cannot use \"undefined\" as a Firestore value".
    try {
      // `settings` is available on the Firestore instance and accepts ignoreUndefinedProperties.
      if (firestoreDb) {
        firestoreDb.settings({ ignoreUndefinedProperties: true });
      }
    } catch (e) {
      // Non-fatal - if settings isn't available for any reason, proceed without it and let
      // individual routes handle validation. Log for visibility.
      console.warn('Failed to apply Firestore settings ignoreUndefinedProperties:', e);
    }
    console.log('Firebase Admin initialized successfully');
    return firestoreDb;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

/**
 * Get the Firestore database instance
 */
export function getDb(): Firestore {
  if (!firestoreDb) {
    initFirebase();
  }
  return firestoreDb!;
}

/**
 * Helper to get a collection from Firestore
 */
export function getCollection(name: string): CollectionReference {
  return getDb().collection(name);
}

/**
 * Helper to query a collection with optional filters
 */
export async function queryCollection<T>(
  collectionName: string,
  filters: { field: string; operator: '==' | '>' | '<' | '>=' | '<='; value: unknown }[] = [],
  orderBy?: { field: string; direction: 'asc' | 'desc' },
  limitCount?: number
): Promise<T[]> {
  const collection = getCollection(collectionName);
  let query: Query = collection;

  // Apply filters
  for (const filter of filters) {
    query = query.where(filter.field, filter.operator, filter.value);
  }

  // Apply ordering
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction);
  }

  // Apply limit
  if (limitCount) {
    query = query.limit(limitCount);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data() as Record<string, unknown> | undefined;
    return { id: doc.id, ...(data ?? {}) } as T;
  });
}

/**
 * Get a single document by ID
 */
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const doc = await getCollection(collectionName).doc(docId).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data() as Record<string, unknown> | undefined;
  return { id: doc.id, ...(data ?? {}) } as T;
}

/**
 * Create a new document
 */
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  // Firestore rejects fields with `undefined` values unless ignoreUndefinedProperties
  // is enabled. To be defensive, strip undefined-valued keys here to avoid runtime
  // errors when the caller passes optional fields as undefined.
  const sanitized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) sanitized[k] = v
  }
  const docRef = await getCollection(collectionName).add(sanitized);
  return docRef.id;
}

/**
 * Update an existing document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  // Remove undefined fields to avoid Firestore serializer errors.
  const sanitized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) sanitized[k] = v
  }
  await getCollection(collectionName).doc(docId).update(sanitized);
}

/**
 * Delete a document
 */
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  await getCollection(collectionName).doc(docId).delete();
}
