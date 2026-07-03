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
  const ap = google.androidpublisher({ version: 'v3', auth: authClient });

  // 1. Get app edit
  const editRes = await ap.edits.insert({ packageName });
  const editId = editRes.data.id;
  console.log(`\n=== ${packageName} (edit: ${editId}) ===`);

  // 2. App details
  try {
    const d = await ap.edits.details.get({ packageName, editId });
    console.log('\nDetails:', JSON.stringify(d.data, null, 2));
  } catch (e) { console.log('\nDetails: not set'); }

  // 3. Listings
  try {
    const listings = await ap.edits.listings.list({ packageName, editId });
    console.log('\nListings:', JSON.stringify(listings.data, null, 2));
  } catch (e) { console.log('\nListings error:', e.message); }

  // 4. Tracks
  try {
    const tracks = await ap.edits.tracks.list({ packageName, editId });
    console.log('\nTracks:');
    for (const t of tracks.data.tracks || []) {
      console.log(`  ${t.track}:`, JSON.stringify(t.releases?.map(r => ({ version: r.versionCodes, status: r.status, name: r.name }))));
    }
  } catch (e) { console.log('\nTracks error:', e.message); }

  // 5. Country availability
  try {
    const ca = await ap.edits.countryavailability.get({ packageName, editId });
    console.log('\nCountry availability:', JSON.stringify(ca.data, null, 2));
  } catch (e) { console.log('\nCountry availability: not set'); }

  // 6. Testers (internal tracks)
  try {
    const testers = await ap.edits.testers.get({ packageName, editId, track: 'internal' });
    console.log('\nInternal testers:', JSON.stringify(testers.data, null, 2));
  } catch (e) { console.log('\nInternal testers: not set'); }

  // 7. Commit (cleanup)
  try { await ap.edits.commit({ packageName, editId }); } catch (e) { /* discard */ }
}

main().catch(err => {
  console.error('Failed:', err.message);
  if (err.response?.data) console.error('API response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
