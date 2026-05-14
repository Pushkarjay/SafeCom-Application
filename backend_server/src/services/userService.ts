import { getDb } from './firestore.js';
import { FirestoreUser, FirestoreCustomer, FirestoreEmployee } from '../types.js';

/**
 * Create or update a Firebase user document in Firestore.
 * Serves as the central user record linking Firebase UID to app user identity.
 */
export const upsertFirestoreUser = async (
  firebaseUid: string,
  email: string,
  displayName: string,
  role: 'admin' | 'customer' | 'employee',
  phone?: string,
  googleLinked?: boolean,
): Promise<FirestoreUser> => {
  const db = getDb();
  const userRef = db.collection('users').doc(firebaseUid);
  const now = new Date().toISOString();

  const docSnapshot = await userRef.get();
  const existing = docSnapshot.exists ? docSnapshot.data() as FirestoreUser : null;

  const userData: FirestoreUser = {
    uid: firebaseUid,
    email,
    displayName,
    role,
    phone: phone ?? existing?.phone ?? '',
    googleLinked: googleLinked ?? existing?.googleLinked ?? (email.includes('@') && !email.includes('@safecom.local')),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (docSnapshot.exists) {
    await userRef.update({
      displayName,
      email,
      phone: userData.phone,
      googleLinked: userData.googleLinked,
      updatedAt: now,
    });
  } else {
    await userRef.set(userData);
  }

  return userData;
};

/**
 * Link a customer document to a Firebase UID.
 */
export const linkCustomerToFirebase = async (
  customerId: string,
  firebaseUid: string
): Promise<void> => {
  const db = getDb();
  await db.collection('customers').doc(customerId).update({
    firebaseUid,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Link an employee document to a Firebase UID.
 */
export const linkEmployeeToFirebase = async (
  employeeId: string,
  firebaseUid: string
): Promise<void> => {
  const db = getDb();
  await db.collection('employees').doc(employeeId).update({
    firebaseUid,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Get Firestore user by Firebase UID.
 */
export const getFirestoreUserByUid = async (
  firebaseUid: string
): Promise<FirestoreUser | null> => {
  const db = getDb();
  const docSnapshot = await db.collection('users').doc(firebaseUid).get();
  if (!docSnapshot.exists) {
    return null;
  }
  return docSnapshot.data() as FirestoreUser;
};

/**
 * Get Firestore user by email address.
 */
export const getFirestoreUserByEmail = async (
  email: string
): Promise<FirestoreUser | null> => {
  if (!email || email.includes('@safecom.local')) return null;
  const db = getDb();
  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as FirestoreUser;
};

/**
 * Get Firestore user by phone number.
 */
export const getFirestoreUserByPhone = async (
  phone: string
): Promise<FirestoreUser | null> => {
  if (!phone) return null;
  const db = getDb();
  const snapshot = await db
    .collection('users')
    .where('phone', '==', phone)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as FirestoreUser;
};

/**
 * Merge two Firebase accounts into one.
 * The primary (newer) UID takes over; old UID data is moved and old doc deleted.
 * This is called when a user tries to sign in with a method that conflicts with an existing identity.
 */
export const mergeFirestoreUserAccounts = async (
  primaryUid: string,
  secondaryUid: string,
): Promise<void> => {
  const db = getDb();
  const batch = db.batch();
  const now = new Date().toISOString();

  // 1. Read secondary user data
  const secondaryUserRef = db.collection('users').doc(secondaryUid);
  const secondaryUserSnap = await secondaryUserRef.get();
  if (!secondaryUserSnap.exists) return;

  const secondaryUser = secondaryUserSnap.data() as FirestoreUser;

  // 2. Read secondary customer data
  const secondaryCustomerSnap = await db
    .collection('customers')
    .where('firebaseUid', '==', secondaryUid)
    .limit(1)
    .get();

  // 3. Update primary user with secondary's phone/email if missing
  const primaryUserRef = db.collection('users').doc(primaryUid);
  const primaryUserSnap = await primaryUserRef.get();
  if (primaryUserSnap.exists) {
    const primaryUser = primaryUserSnap.data() as FirestoreUser;
    const updates: Record<string, unknown> = { updatedAt: now };
    if (!primaryUser.phone && secondaryUser.phone) updates.phone = secondaryUser.phone;
    if (primaryUser.email !== secondaryUser.email && secondaryUser.email && !secondaryUser.email.includes('@safecom.local')) {
      updates.email = secondaryUser.email;
    }
    batch.update(primaryUserRef, updates);
  }

  // 4. Transfer customer data if secondary had one
  if (!secondaryCustomerSnap.empty) {
    const secondaryCustomerRef = secondaryCustomerSnap.docs[0].ref;
    batch.update(secondaryCustomerRef, {
      firebaseUid: primaryUid,
      updatedAt: now,
    });
  }

  // 5. Delete secondary user doc
  batch.delete(secondaryUserRef);

  // 6. Commit batch
  await batch.commit();
  console.log(`[USER-MERGE] Merged secondary UID ${secondaryUid} into primary ${primaryUid}`);
};

/**
 * Update customer phone number.
 */
export const updateCustomerPhone = async (
  firebaseUid: string,
  phone: string,
): Promise<void> => {
  const db = getDb();
  const snapshot = await db
    .collection('customers')
    .where('firebaseUid', '==', firebaseUid)
    .limit(1)
    .get();
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({ phone, updatedAt: new Date().toISOString() });
  }
};

/**
 * Get customer linked to Firebase UID.
 */
export const getCustomerByFirebaseUid = async (
  firebaseUid: string
): Promise<FirestoreCustomer | null> => {
  const db = getDb();
  const snapshot = await db
    .collection('customers')
    .where('firebaseUid', '==', firebaseUid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data() as FirestoreCustomer;
};

/**
 * Get employee linked to Firebase UID.
 */
export const getEmployeeByFirebaseUid = async (
  firebaseUid: string
): Promise<FirestoreEmployee | null> => {
  const db = getDb();
  const snapshot = await db
    .collection('employees')
    .where('firebaseUid', '==', firebaseUid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data() as FirestoreEmployee;
};

/**
 * Create a new customer linked to Firebase UID.
 */
export const createCustomerWithFirebaseUid = async (
  firebaseUid: string,
  email: string,
  name: string,
  phone: string,
  address?: string
): Promise<FirestoreCustomer> => {
  const db = getDb();
  const now = new Date().toISOString();

  // First, ensure Firebase user record exists
  await upsertFirestoreUser(firebaseUid, email, name, 'customer');

  const customerData: FirestoreCustomer = {
    id: firebaseUid, // Use Firebase UID as customer ID for simplicity
    firebaseUid,
    name,
    email,
    phone,
    address,
    totalOrders: 0,
    totalSpent: 0,
    registeredDate: now,
    status: 'active',
    googleLinked: Boolean(email && !email.includes('@safecom.local')),
  };

  // Create or update customer document
  await db.collection('customers').doc(firebaseUid).set(customerData, { merge: true });
  return customerData;
};

/**
 * Create a new employee linked to Firebase UID.
 */
export const createEmployeeWithFirebaseUid = async (
  firebaseUid: string,
  email: string,
  name: string,
  phone: string,
  location: string,
  skills: string[] = []
): Promise<FirestoreEmployee> => {
  const db = getDb();
  const now = new Date().toISOString();

  // First, ensure Firebase user record exists
  await upsertFirestoreUser(firebaseUid, email, name, 'employee');

  const employeeData: FirestoreEmployee = {
    id: firebaseUid, // Use Firebase UID as employee ID for simplicity
    firebaseUid,
    name,
    email,
    phone,
    location,
    joinDate: now,
    rating: 0,
    totalJobs: 0,
    completedJobs: 0,
    skills,
    status: 'active',
  };

  // Create or update employee document
  await db.collection('employees').doc(firebaseUid).set(employeeData, { merge: true });
  return employeeData;
};
