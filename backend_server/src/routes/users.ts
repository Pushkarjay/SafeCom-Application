import { Router } from 'express';
import { verifyFirebaseIdToken, FirebaseAuthenticatedRequest } from '../middleware/firebaseAuth.js';
import {
  upsertFirestoreUser,
  linkCustomerToFirebase,
  linkEmployeeToFirebase,
  createCustomerWithFirebaseUid,
  createEmployeeWithFirebaseUid,
  getFirestoreUserByUid,
  getCustomerByFirebaseUid,
  getEmployeeByFirebaseUid,
} from '../services/userService.js';

const router = Router();

/**
 * POST /api/users/link
 * Called by mobile apps after Firebase login to link the Firebase user to their customer/employee document.
 * Body: { email, displayName, role: 'customer' | 'employee', phone?: string, location?: string, ... }
 */
router.post('/link', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  const uid = req.firebaseUid;
  if (!uid) {
    return res.status(401).json({ message: 'Firebase UID not found in request' });
  }

  const { email, displayName, role, phone, location, address, name, skills } = req.body;

  if (!email || !displayName || !role) {
    return res.status(400).json({ message: 'Missing required fields: email, displayName, role' });
  }

  try {
    // Create/update the central users collection document
    const firestoreUser = await upsertFirestoreUser(uid, email, displayName, role);

    // Based on role, create or link the customer/employee document
    let linkedDoc = null;

    if (role === 'customer') {
      // Check if customer already exists
      let existingCustomer = await getCustomerByFirebaseUid(uid);
      if (existingCustomer) {
        linkedDoc = existingCustomer;
      } else {
        // Create new customer record
        linkedDoc = await createCustomerWithFirebaseUid(
          uid,
          email,
          name || displayName,
          phone || '',
          address
        );
      }
    } else if (role === 'employee') {
      // Check if employee already exists
      let existingEmployee = await getEmployeeByFirebaseUid(uid);
      if (existingEmployee) {
        linkedDoc = existingEmployee;
      } else {
        // Create new employee record
        linkedDoc = await createEmployeeWithFirebaseUid(
          uid,
          email,
          name || displayName,
          phone || '',
          location || '',
          skills || []
        );
      }
    }

    return res.json({
      message: 'User linked successfully',
      user: {
        uid,
        email,
        displayName,
        role,
      },
      linkedDocument: linkedDoc,
    });
  } catch (error) {
    console.error('Error linking user:', error);
    return res.status(500).json({
      message: 'Error linking user to Firestore',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/me
 * Returns the authenticated user's profile from Firestore.
 */
router.get('/me', verifyFirebaseIdToken, async (req: FirebaseAuthenticatedRequest, res) => {
  const uid = req.firebaseUid;
  if (!uid) {
    return res.status(401).json({ message: 'Firebase UID not found in request' });
  }

  try {
    const user = await getFirestoreUserByUid(uid);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Call POST /api/users/link to link your account.' });
    }

    // Also fetch the role-specific document
    let roleDocument = null;
    if (user.role === 'customer') {
      roleDocument = await getCustomerByFirebaseUid(uid);
    } else if (user.role === 'employee') {
      roleDocument = await getEmployeeByFirebaseUid(uid);
    }

    return res.json({
      user,
      roleDocument,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      message: 'Error fetching user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
