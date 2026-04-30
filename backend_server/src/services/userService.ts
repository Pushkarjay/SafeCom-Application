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
  role: 'admin' | 'customer' | 'employee'
): Promise<FirestoreUser> => {
  const db = getDb();
  const userRef = db.collection('users').doc(firebaseUid);
  const now = new Date().toISOString();

  const userData: FirestoreUser = {
    uid: firebaseUid,
    email,
    displayName,
    role,
    createdAt: now,
    updatedAt: now,
  };

  const docSnapshot = await userRef.get();
  if (docSnapshot.exists) {
    // Update only the updatedAt and displayName/email if changed
    await userRef.update({
      displayName,
      email,
      updatedAt: now,
    });
  } else {
    // Create new user document
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
