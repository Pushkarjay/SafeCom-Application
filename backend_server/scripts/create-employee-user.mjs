import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Initialize Firebase Admin SDK
const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
const app = admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

const auth = getAuth(app);
const db = getFirestore(app, 'safecom-database-nosql');

async function createEmployee(email, password, name) {
  console.log(`\n🔧 Creating employee user: ${email}\n`);

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`🔁 User already exists: ${userRecord.uid}`);
      await auth.updateUser(userRecord.uid, { password });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
          emailVerified: true
        });
        console.log(`✅ Firebase user created: ${userRecord.uid}`);
      } else {
        throw err;
      }
    }

    const now = new Date().toISOString();

    // 1. Create entry in 'users' collection
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: name,
      role: 'employee',
      createdAt: now,
      updatedAt: now
    }, { merge: true });
    console.log(`✅ users collection entry created`);

    // 2. Create entry in 'employees' collection
    await db.collection('employees').doc(userRecord.uid).set({
      id: userRecord.uid,
      firebaseUid: userRecord.uid,
      name,
      email,
      phone: '+91 99999 88888',
      location: 'Mumbai',
      joinDate: now,
      rating: 5.0,
      totalJobs: 0,
      completedJobs: 0,
      skills: ['installation', 'maintenance'],
      status: 'active',
      createdAt: now,
      updatedAt: now
    }, { merge: true });
    console.log(`✅ employees collection entry created`);

    console.log(`\n✨ Employee created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`UID: ${userRecord.uid}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

createEmployee('employee@safecom.com', 'Safecom@123', 'John Technician');
