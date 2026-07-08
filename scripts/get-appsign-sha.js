const { google } = require('googleapis');

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function impersonate(accessToken, targetPrincipal) {
  const res = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${targetPrincipal}:generateAccessToken`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: ['https://www.googleapis.com/auth/androidpublisher'],
        lifetime: '300s',
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Impersonation failed: ${res.status} - ${err}`);
  }
  const data = await res.json();
  return data.accessToken;
}

async function tryEndpoint(url, playToken, label) {
  console.log(`\nTrying: ${label}`);
  console.log(`  URL: ${url}`);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${playToken}` } });
  console.log(`  Status: ${res.status}`);
  if (res.ok) {
    const data = await res.json();
    console.log(`  Response: ${JSON.stringify(data, null, 2)}`);
    return data;
  } else {
    const text = await res.text();
    console.log(`  Error: ${text.substring(0, 200)}`);
    return null;
  }
}

async function main() {
  const targetSA = process.env.TARGET_SA || 'safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com';
  const pkg = process.env.PACKAGE || 'com.safecom.customer';

  console.log(`Getting access token via impersonation of ${targetSA}...`);
  const firebaseToken = await getAccessToken();
  const playToken = await impersonate(firebaseToken, targetSA);

  const urls = [
    { url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/appSigning`, label: 'v3 appSigning (androidpublisher.googleapis.com)' },
    { url: `https://www.googleapis.com/androidpublisher/v3/applications/${pkg}/appSigning`, label: 'v3 appSigning (www.googleapis.com)' },
    { url: `https://www.googleapis.com/androidpublisher/v2/applications/${pkg}/appSigning`, label: 'v2 appSigning' },
    { url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}`, label: 'v3 application' },
    { url: `https://www.googleapis.com/androidpublisher/v3/applications/${pkg}`, label: 'v3 application (www)' },
  ];

  for (const { url, label } of urls) {
    await tryEndpoint(url, playToken, label);
  }
}

main().catch(err => {
  console.error('Failed:', err.message);
  if (err.response?.data) console.error('API response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
