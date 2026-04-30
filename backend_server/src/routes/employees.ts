import { Router } from 'express';
import { getEmployeeById, getEmployeeByFirebaseUid } from '../services/employeeService.js';
import { getEarningsByEmployeeId } from '../services/earningsService.js';
import { FirebaseAuthenticatedRequest } from '../middleware/firebaseAuth.js';
import { getFirestoreUserByUid, getEmployeeByFirebaseUid as userServiceGetEmployee } from '../services/userService.js';

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
      return res.json(employee);
    }

    // Fallback: try legacy employeeService
    const byId = await getEmployeeById(uid);
    if (byId) {
      return res.json(byId);
    }

    return res.status(404).json({ message: 'Employee profile not found for authenticated user. Please contact admin to link your account.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching employee profile', error });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await getEmployeeById(id);
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee data', error });
  }
});

// GET /api/employees/:id/earnings
router.get('/:id/earnings', async (req, res) => {
  const { id } = req.params;
  try {
    const earnings = await getEarningsByEmployeeId(id);
    res.json(earnings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching earnings data', error });
  }
});

export default router;
