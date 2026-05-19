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
  getFirestoreUserByPhone,
  getFirestoreUserByEmail,
  mergeFirestoreUserAccounts,
  updateCustomerPhone,
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

  // Allow phone-only sign-in (email optional)
  if (!displayName || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields: displayName, role' });
  }

  // Email is optional — use empty string when not provided
  const finalEmail = email || '';

  try {
    // ── PHASE 3.1: Account Merge Logic ─────────────────────────────────────
    // Check if this email or phone is already linked to a DIFFERENT Firebase UID.
    // If so, merge accounts so the same physical person has one account.
    const conflictUser = await getFirestoreUserByEmail(finalEmail)
      || (phone ? await getFirestoreUserByPhone(phone) : null);

    if (conflictUser && conflictUser.uid !== uid) {
      // Email or phone already belongs to another Firebase UID — merge!
      await mergeFirestoreUserAccounts(uid, conflictUser.uid);
    }

    // Also check if a phone is being added to a Google-only account (vice versa).
    // If this UID exists but has no phone, and we now have a phone, update it.
    if (phone) {
      const existingUser = await getFirestoreUserByUid(uid);
      if (existingUser && !existingUser.phone && existingUser.googleLinked) {
        // This is a Google account adding a phone number — update the phone field
        await upsertFirestoreUser(uid, existingUser.email, displayName, role, phone);
      }
    }

    // Create/update the central users collection document.
    // IMPORTANT: Only pass phone if it is non-empty — never overwrite an existing
    // phone with an empty string (e.g. when the user re-logs in via Google).
    const firestoreUser = await upsertFirestoreUser(uid, finalEmail, displayName, role, phone || undefined);

    // Based on role, create or link the customer/employee document
    let linkedDoc = null;

    if (role === 'customer') {
      // Check if customer already exists
      let existingCustomer = await getCustomerByFirebaseUid(uid);
      if (existingCustomer) {
        linkedDoc = existingCustomer;
        // Only update phone if a non-empty value is provided (never blank it out)
        if (phone && phone.trim().length > 0) {
          await updateCustomerPhone(uid, phone);
        }
      } else {
        // Create new customer record
        linkedDoc = await createCustomerWithFirebaseUid(
          uid,
          finalEmail,
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
      success: true,
      data: {
        user: {
          uid,
          email: finalEmail,
          displayName,
          role,
          phone,
        },
        linkedDocument: linkedDoc,
        merged: conflictUser ? true : false,
      },
      message: 'User linked successfully',
    });
  } catch (error) {
    console.error('Error linking user:', error);
    return res.status(500).json({
      success: false,
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
    return res.status(401).json({ success: false, message: 'Firebase UID not found in request' });
  }

  try {
    const user = await getFirestoreUserByUid(uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Call POST /api/users/link to link your account.' });
    }

    // Also fetch the role-specific document
    let roleDocument = null;
    if (user.role === 'customer') {
      roleDocument = await getCustomerByFirebaseUid(uid);
    } else if (user.role === 'employee') {
      roleDocument = await getEmployeeByFirebaseUid(uid);
    }

    return res.json({
      success: true,
      data: {
        user,
        roleDocument,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
