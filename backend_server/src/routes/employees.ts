import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getEmployeeById, getEmployeeByFirebaseUid } from '../services/employeeService.js';
import { getEarningsByEmployeeId } from '../services/earningsService.js';
import { FirebaseAuthenticatedRequest } from '../middleware/firebaseAuth.js';
import { getFirestoreUserByUid, getEmployeeByFirebaseUid as userServiceGetEmployee } from '../services/userService.js';
import { getDb } from '../services/firestore.js';

const router = Router();

// GET /api/employees/me - returns employee profile for authenticated Firebase user
// Note: This must come BEFORE /:id route to avoid route matching issues
router.get('/me', async (req: FirebaseAuthenticatedRequest, res) => {
  const uid = req.firebaseUid;
  if (!uid) {
    return res.status(401).json({ message: 'Unable to determine authenticated user' });
  }

  try {
    // Try to find employee by firebaseUid using userService (Firestore-linked)
    const employee = await userServiceGetEmployee(uid);
    if (employee) {
      return res.json({ success: true, data: employee });
    }

    // Fallback: try legacy employeeService
    const byId = await getEmployeeById(uid);
    if (byId) {
      return res.json({ success: true, data: byId });
    }

    return res.status(404).json({ success: false, message: 'Employee profile not found for authenticated user. Please contact admin to link your account.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching employee profile', error });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await getEmployeeById(id);
    if (employee) {
      res.json({ success: true, data: employee });
    } else {
      res.status(404).json({ success: false, message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching employee data', error });
  }
});

// POST /api/employees/device-token - register device token for notifications
router.post('/device-token', async (req: FirebaseAuthenticatedRequest, res) => {
  const uid = req.firebaseUid;
  if (!uid) {
    return res.status(401).json({ success: false, message: 'Unable to determine authenticated user' });
  }

  const { token } = req.body as { token?: string };
  if (!token || token.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Device token is required' });
  }

  try {
    const db = getDb();
    const snapshot = await db.collection('employees').where('firebaseUid', '==', uid).limit(1).get();
    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Employee profile not found for authenticated user' });
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({
      deviceTokens: FieldValue.arrayUnion(token),
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Device token registered' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to register device token', error });
  }
});

// GET /api/employees/:id/earnings
router.get('/:id/earnings', async (req, res) => {
  const { id } = req.params;
  try {
    const earnings = await getEarningsByEmployeeId(id);
    res.json({ success: true, data: earnings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching earnings data', error });
  }
});

export default router;
