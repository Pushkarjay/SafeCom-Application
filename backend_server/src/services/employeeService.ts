import { getDb } from './firestore.js';
import { Employee } from '../types.js';

const EMPLOYEES_COLLECTION = 'employees';

/**
 * Fetches a single employee by their ID from Firestore.
 * @param {string} employeeId - The ID of the employee to fetch.
 * @returns {Promise<Employee | null>} The employee data or null if not found.
 */
export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  try {
    const db = getDb();
    const docRef = db.collection(EMPLOYEES_COLLECTION).doc(employeeId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(`No employee found with ID: ${employeeId}`);
      return null;
    }

    const data = doc.data() as Record<string, unknown> | undefined;
    return { id: doc.id, ...(data ?? {}) } as Employee;
  } catch (error) {
    console.error(`Error fetching employee ${employeeId}:`, error);
    throw new Error('Failed to fetch employee data.');
  }
};

/**
 * Fetch an employee by their Firebase UID. Searches the 'firebaseUid' field.
 */
export const getEmployeeByFirebaseUid = async (firebaseUid: string): Promise<Employee | null> => {
  try {
    const db = getDb();
    const snapshot = await db.collection(EMPLOYEES_COLLECTION).where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0];
    const data = doc.data() as Record<string, unknown> | undefined;
    return { id: doc.id, ...(data ?? {}) } as Employee;
  } catch (error) {
    console.error(`Error fetching employee by firebaseUid ${firebaseUid}:`, error);
    throw new Error('Failed to fetch employee data by firebaseUid.');
  }
};
