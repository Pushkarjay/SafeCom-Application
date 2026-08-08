/**
 * Promote a Google Play release to another track.
 *
 * Usage (env):
 *   APP               - 'customer' | 'employee'
 *   PROMOTE_TRACK     - target track: alpha | beta | production
 *   PROMOTE_VERSION_CODE - optional explicit version code; defaults to the
 *                       latest release on the internal track
 *
 * The service account JSON is read from SERVICE_ACCOUNT_JSON (CI secret).
 * This is the API-level equivalent of "Promote release" in Play Console.
 */
const { google } = require('googleapis');

const PACKAGE_MAP = { customer: 'com.safecom.customer', employee: 'com.safecom.employee' };
const SOURCE_TRACK = 'internal';

async function main() {
  const app = process.env.APP || 'employee';
  const targetTrack = (process.env.PROMOTE_TRACK || '').trim();
  const packageName = PACKAGE_MAP[app];
  if (!packageName) throw new Error(`Unknown app: ${app}`);
  if (!['alpha', 'beta', 'production'].includes(targetTrack)) {
    throw new Error(`PROMOTE_TRACK must be one of alpha, beta, production (got: ${targetTrack})`);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.SERVICE_ACCOUNT_JSON),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const ap = google.androidpublisher({ version: 'v3', auth });

  const editRes = await ap.edits.insert({ packageName });
  const editId = editRes.data.id;
  console.log(`Edit: ${editId} (${packageName})`);

  // Find the release to promote.
  const source = await ap.edits.tracks.get({ packageName, editId, track: SOURCE_TRACK });
  const sourceReleases = (source.data.releases || []).filter(r => r.status !== 'draft');
  if (sourceReleases.length === 0) {
    throw new Error(`No releases on ${SOURCE_TRACK} track to promote`);
  }
  const latest = sourceReleases.sort((a, b) => {
    const va = Math.max(...(a.versionCodes || []).map(Number));
    const vb = Math.max(...(b.versionCodes || []).map(Number));
    return vb - va;
  })[0];

  const versionCodes = process.env.PROMOTE_VERSION_CODE
    ? [String(process.env.PROMOTE_VERSION_CODE).trim()]
    : (latest.versionCodes || []).map(String);
  const releaseName = latest.name || `v${versionCodes.join(',')}`;
  console.log(`Promoting "${releaseName}" (version ${versionCodes.join(',')}) from ${SOURCE_TRACK} -> ${targetTrack}`);

  // Check target track for an existing release with the same version codes.
  const target = await ap.edits.tracks.get({ packageName, editId, track: targetTrack });
  const existing = (target.data.releases || []).find(r =>
    (r.versionCodes || []).map(String).some(vc => versionCodes.includes(vc)),
  );
  if (existing) {
    console.log(`Version code ${versionCodes.join(',')} already exists on ${targetTrack}; skipping.`);
  } else {
    await ap.edits.tracks.update({
      packageName,
      editId,
      track: targetTrack,
      requestBody: {
        track: targetTrack,
        releases: [
          ...(target.data.releases || []).filter(r => r.status !== 'completed'),
          { name: releaseName, versionCodes, status: 'completed' },
        ],
      },
    });
    console.log(`Assigned ${releaseName} to ${targetTrack} (status: completed = 100% rollout).`);
  }

  const commit = await ap.edits.commit({ packageName, editId });
  console.log(`Committed edit: ${commit.data.id}`);
  console.log('Done.');
}

main().catch(err => {
  console.error('Failed:', err.message);
  if (err.response?.data) console.error('API response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
