import { initializeApp, cert } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  type: 'service_account',
  project_id: 'safecom-application-01',
  private_key_id: process.env.GCLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GCLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GCLOUD_CLIENT_EMAIL,
  client_id: process.env.GCLOUD_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
};

try {
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  
  console.log('=== Collections ===');
  const jobs = await db.collection('jobs').limit(10).get();
  console.log('Jobs count:', jobs.size);
  
  jobs.forEach(doc => {
    const data = doc.data();
    console.log('\nJob ID:', doc.id);
    console.log('Status:', data.status);
    console.log('ServiceType:', data.serviceType);
    console.log('assignedTo:', JSON.stringify(data.assignedTo));
    console.log('customer:', data.customer?.name);
  });
  
  console.log('\n=== Bookings ===');
  const bookings = await db.collection('bookings').limit(5).get();
  console.log('Bookings count:', bookings.size);
  
  bookings.forEach(doc => {
    const data = doc.data();
    console.log('\nBooking ID:', doc.id);
    console.log('Status:', data.status);
    console.log('ServiceType:', data.serviceType);
  });
} catch (e) {
  console.error('Error:', e.message);
}