import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account-key.json'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'safecom-application-01.firebasestorage.app'
});

const bucket = getStorage().bucket();

async function uploadLogo() {
  const logoPath = 'A:\\Downloads\\safecom logos\\safecom_logo_v1_1.jpeg';
  
  const fileContent = readFileSync(logoPath);
  
  const file = bucket.file('logos/safecom_logo_v1_1.jpeg');
  
  await file.save(fileContent, {
    metadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    }
  });
  
  console.log('✅ Logo uploaded to: gs://safecom-application-01.appspot.com/logos/safecom_logo_v1_1.jpeg');
  console.log('📝 Public URL: https://firebasestorage.googleapis.com/v0/b/safecom-application-01.appspot.com/o/logos%2Fsafecom_logo_v1_1.jpeg?alt=media');
}

uploadLogo().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });