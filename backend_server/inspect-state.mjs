import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { getFirestore } from 'firebase-admin/firestore';

const key = JSON.parse(readFileSync('./service-account-key.json', 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(key) });

const auth = admin.auth();
const db = getFirestore(admin.app(), 'default');

async function run() {
  const usersResult = await auth.listUsers(50);
  console.log('=== FIREBASE AUTH USERS ===');
  usersResult.users.forEach(u => {
    console.log(`UID: ${u.uid} | Email: ${u.email || 'N/A'} | Phone: ${u.phoneNumber || 'N/A'} | Providers: ${u.providerData.map(p=>p.providerId).join(',')} | DisplayName: ${u.displayName || 'N/A'}`);
  });
  
  console.log('\n=== FIRESTORE USERS COLLECTION (default DB) ===');
  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`DocID: ${d.id} | role: ${data.role} | email: ${data.email}`);
  });

  console.log('\n=== FIRESTORE BOOKINGS (default DB) ===');
  const bookingsSnap = await db.collection('bookings').limit(5).get();
  console.log(`Bookings count: ${bookingsSnap.size}`);
  bookingsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`BookingID: ${d.id} | userId: ${data.userId || data.customerId} | status: ${data.status}`);
  });
  
  process.exit(0);
}
run().catch(console.error);
