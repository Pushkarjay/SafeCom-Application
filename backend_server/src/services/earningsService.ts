import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getDb } from './firestore.js';
import { Earning } from '../types.js';

const EARNINGS_COLLECTION = 'earnings';

/**
 * Fetches all earnings for a specific employee.
 * In a real app, you'd likely have a subcollection on the employee document.
 * For this example, we'll query the top-level earnings collection.
 * @param {string} employeeId - The ID of the employee whose earnings to fetch.
 * @returns {Promise<Earning[]>} A list of earnings.
 */
export const getEarningsByEmployeeId = async (employeeId: string): Promise<Earning[]> => {
  try {
    const db = getDb();
    const snapshot = await db.collection(EARNINGS_COLLECTION)
                             .where('employeeId', '==', employeeId)
                             .orderBy('date', 'desc')
                             .get();

    if (snapshot.empty) {
      return [];
    }

    const earnings: Earning[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as Record<string, unknown> | undefined;
      earnings.push({ id: doc.id, ...(data ?? {}) } as unknown as Earning);
    });

    return earnings;
  } catch (error) {
    console.error(`Error fetching earnings for employee ${employeeId}:`, error);
    throw new Error('Failed to fetch earnings data.');
  }
};
