const { google } = require('googleapis');

const PACKAGE_MAP = { customer: 'com.safecom.customer', employee: 'com.safecom.employee' };

async function main() {
  const app = process.env.APP || 'employee';
  const packageName = PACKAGE_MAP[app];
  if (!packageName) throw new Error(`Unknown app: ${app}`);

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await auth.getClient();

  const androidPublisher = google.androidpublisher({ version: 'v3', auth: authClient });

  // 1. Create a new edit
  console.log(`Creating edit for ${packageName}...`);
  const editRes = await androidPublisher.edits.insert({ packageName });
  const editId = editRes.data.id;
  console.log(`Edit ID: ${editId}`);

  // 2. Get current app details
  try {
    const details = await androidPublisher.edits.details.get({ packageName, editId });
    console.log('Current details:', JSON.stringify(details.data, null, 2));
  } catch (e) {
    console.log('No details set yet:', e.message);
  }

  // 3. Get/update store listing
  const title = process.env.APP_TITLE || 'SafeCom Employee';
  const shortDesc = process.env.SHORT_DESC || 'Job management for SafeCom service technicians';
  const fullDesc = process.env.FULL_DESC || [
    'SafeCom Employee helps service technicians manage their daily jobs efficiently.',
    '',
    'Features:',
    '• View and manage assigned jobs',
    '• Capture before/after photos of work',
    '• GPS navigation to job sites',
    '• Complete jobs and submit work reports',
    '• Track earnings and history',
    '• Real-time job updates and notifications',
  ].join('\n');

  console.log(`Updating listing for en-US...`);
  await androidPublisher.edits.listings.update({
    packageName,
    editId,
    language: 'en-US',
    requestBody: {
      title,
      shortDescription: shortDesc,
      fullDescription: fullDesc,
    },
  });
  console.log('Listing updated.');

  // 4. Set privacy policy if provided
  const privacyPolicy = process.env.PRIVACY_POLICY_URL;
  if (privacyPolicy) {
    console.log('Setting privacy policy...');
    await androidPublisher.edits.details.update({
      packageName,
      editId,
      requestBody: {
        contactEmail: process.env.CONTACT_EMAIL || 'support@safecom.in',
        contactPhone: process.env.CONTACT_PHONE || '',
        contactWebsite: process.env.CONTACT_WEBSITE || 'https://safecom.in',
        defaultLanguage: 'en-US',
        usesShortCode: false,
        usesAudio: false,
        usesCamera: false,
        usesLocation: true,
        usesNfc: false,
        usesSms: false,
        usesVr: false,
        usesMultiscreen: false,
        isGame: false,
        isAdsEnabled: false,
        privacyPolicy,
      },
    });
    console.log('Privacy policy set.');
  }

  // 5. Commit the edit
  console.log('Committing edit...');
  await androidPublisher.edits.commit({ packageName, editId });
  console.log('Edit committed successfully!');
}

main().catch(err => {
  console.error('Failed:', err.message);
  if (err.response?.data) console.error('API response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
