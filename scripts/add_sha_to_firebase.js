const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '..', 'backend_server', 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const projectId = 'safecom-application-01';
const appId = '1:177425757120:android:4e14b54b69af9c6a2d0e25';

// Google Play App Signing certificate SHA-256 (from Play Console)
const googlePlaySha = 'EFAEABC26708E3902837D1B4837AB4088B641ABB405D685A441AFBD49478638D';

async function addShaCert() {
  const token = await admin.credential.cert(serviceAccount).getAccessToken();
  
  // First, list existing SHA certs
  const listResp = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps/${appId}/sha`,
    {
      headers: { 'Authorization': `Bearer ${token.access_token}` },
    }
  );
  const listData = await listResp.json();
  console.log('Existing SHA certs:', JSON.stringify(listData, null, 2));
  
  // Add the Google Play signing cert
  const addResp = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps/${appId}/sha`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        certType: 'SHA_256',
        shaValue: googlePlaySha,
      }),
    }
  );
  const addData = await addResp.json();
  console.log('Add SHA result:', JSON.stringify(addData, null, 2));
}

addShaCert().catch(console.error);
