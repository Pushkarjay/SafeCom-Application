# 01 - Production Credentials & Setup Intake

This file lists the exact steps (in order) to obtain every credential and configuration needed to move SafeCom to production. Follow each numbered step and provide the requested artifacts via a secure channel (preferred: Google Cloud Secret Manager, CI/CD secrets, or encrypted file share). If you must share temporarily via chat, mark them as temporary and we will replace them with secure secrets immediately.

Project context (you provided):
- Company: Safecom
- Apps: "Safecom - IT & Security" (Customer), "Safecom - Employee" (Employee)
- Google Cloud Project Number: 177425757120
- Google Cloud Project ID: safecom-application-01

Important: never commit secrets into the repo. Use environment variables, Secret Manager, or CI secrets.

---

## A. Quick checklist of items I will need from you (deliver these in secure manner)
1. Firebase service account JSON (only if you want server-side admin access; see step B.3)
2. Firebase project ID and confirmed Firestore DB mode (native or Datastore mode)
3. Android app package names for each app (customer, employee)
4. iOS bundle identifiers for each app (customer, employee)
5. Android keystore (for Play Store signing) or confirmation to use Google Play App Signing
6. SHA-1 cert fingerprint(s) for the signing key and debug key
7. Maps API key (if using Google Maps) or Mapbox token
8. SMTP credentials (if email OTP/reset uses SMTP)
9. Push notification settings (Firebase Cloud Messaging server key if required)
10. Any 3rd-party API keys (payment gateway, SMS/OTP provider)

---

## B. Step-by-step instructions (exact commands & UI paths)

### B.1 Confirm Firebase / Firestore Project & Mode
1. Open Firebase Console: https://console.firebase.google.com
2. Select project `Safecom-Application-01` (or `safecom-application-01`).
3. In the left menu choose "Firestore Database".
   - If no DB exists, create one. Choose **Native mode** for Firestore if you plan to use Firestore as the primary DB for mobile/web apps.
   - Note: Datastore mode (legacy) is different and not ideal for typical mobile apps.
4. The Firestore database resource name is typically:
   - `projects/<PROJECT_ID>/databases/(default)` — the `(default)` database ID is the DB identifier for normal Firebase projects.
   - If using a multi-database instance, a different name may appear; record that exact database name.

How to get the Firestore Database ID via CLI:
```bash
# Install gcloud & authenticate
gcloud auth login
gcloud config set project safecom-application-01
# Describe Firestore database
gcloud firestore databases describe --project=safecom-application-01
```
If the above `gcloud firestore databases` command is not available, the default DB id is `(default)` and you can use `projects/safecom-application-01/databases/(default)`.

Deliverable to me: Firestore database resource string (e.g. `projects/safecom-application-01/databases/(default)`) and confirmation of Native vs Datastore mode.

---

### B.2 Service Account for Server / Admin SDK (recommended)
Why: server processes and backend need a service account with necessary IAM roles.

UI steps (Google Cloud Console):
1. Open Google Cloud Console → IAM & Admin → Service Accounts.
2. Click "Create Service Account".
   - Name: `safecom-backend-sa` (suggested)
   - ID: auto-filled
3. Grant roles (principle of least privilege):
   - For Firestore/General: `Cloud Datastore Owner` or granular `Cloud Datastore User` + `Cloud Firestore Service Agent` as needed.
   - For Storage (photo uploads): `Storage Object Admin` or limited write access to a specific bucket.
   - For Pub/Sub/Cloud Tasks if used: appropriate roles.
4. After creating, create a JSON key: Actions → Manage keys → Add key → Create new JSON key → download.
5. Store the JSON in a secure secret store or set environment variable `GOOGLE_APPLICATION_CREDENTIALS=/secrets/safecom-backend-sa.json` on the server.

CLI commands for service account & key:
```bash
gcloud iam service-accounts create safecom-backend-sa --description="SafeCom backend service account" --display-name="SafeCom Backend SA"
# Grant roles (example)
gcloud projects add-iam-policy-binding safecom-application-01 \
  --member="serviceAccount:safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com" \
  --role="roles/datastore.owner"
# Create key
gcloud iam service-accounts keys create ./safecom-backend-sa-key.json \
  --iam-account=safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com
```
Deliverable: service account email and the JSON key (deliver via Secret Manager or encrypted file share). Do NOT paste JSON in chat.

---

### B.3 Firestore Rules and Indexes
1. Go to Firebase Console → Firestore Database → Rules. Review and paste rules for production.
2. Test indexes in Firestore UI → Indexes; add composite indexes used by queries.

Deliverable: final `firestore.rules` file and `firestore.indexes.json` (exportable via Firebase CLI):
```bash
firebase login
firebase use --add safecom-application-01
# To export rules & indexes
firebase firestore:rules > firestore.rules
firebase firestore:indexes > firestore.indexes.json
```

---

### B.4 Database options and how to pick one
Options with short guidance:
- Firestore (NoSQL / serverless) — best for mobile apps, offline sync, simple scaling. Use for primary app data (users, jobs, orders).
- Cloud SQL (Postgres/MySQL) — relational, best for complex queries/joins, transactions. Use if you need complex relational integrity.
- Firebase Realtime Database — real-time but legacy; prefer Firestore for new projects.
- BigQuery — analytics only, not operational DB.
- MongoDB Atlas — hosted Mongo if you want Mongo API.

How to choose:
- Mobile-first, offline: Firestore.
- Complex relational transactions: Cloud SQL (Postgres).
- Analytics & reporting: BigQuery (sink export from Firestore/Cloud SQL).

Deliverable: Pick DB type (recommended: Firestore). If Cloud SQL is chosen, provide instance connection details and user account config.

If Cloud SQL chosen – how to get credentials:
1. Create Cloud SQL instance (Postgres or MySQL) in Console → SQL → Create Instance.
2. Create a DB user and password in instance users.
3. Use Cloud SQL Proxy or a private IP + VPC for secure connectivity.

CLI snippets:
```bash
# Create Postgres instance (example)
gcloud sql instances create safecom-sql --database-version=POSTGRES_15 --region=us-central1
gcloud sql users create appuser % --instance=safecom-sql --password='REPLACE_WITH_STRONG_PASSWORD'
```
Deliverable: instance connection name (e.g. `project:region:instance`), DB name, username, and how you want secrets stored.

Security note: use IAM DB Auth where available or Cloud SQL Proxy to avoid exposing DB credentials.

---

### B.5 How to get Android package name and generate SHA-1
Android package name (applicationId) is defined in `android/app/build.gradle` or `app/src/main/AndroidManifest.xml`.
For Flutter projects check:
- `android/app/build.gradle` → `defaultConfig { applicationId "com.example.safecom_customer" }`
- `android/app/src/main/AndroidManifest.xml` → `package="com.example.safecom_customer"` (less authoritative than build.gradle)

Command to search:
```bash
# show applicationId from build.gradle
Select-String -Path "android/app/build.gradle" -Pattern "applicationId" -SimpleMatch
# or (Linux/Mac)
grep -R "applicationId" android/app/build.gradle
```

Generate SHA-1 for a keystore (for Maps & Google Sign-in):
```bash
# For debug key (local testing)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
# For release keystore
keytool -list -v -keystore /path/to/your/keystore.jks -alias your_alias
```
Deliverable: final `applicationId` for each app and SHA-1 fingerprints for the release key.

---

### B.6 How to get iOS bundle identifier
In Flutter iOS, open `ios/Runner.xcodeproj` in Xcode or check `ios/Runner/Info.plist` and `ios/Runner.xcodeproj/project.pbxproj`.
In `project.pbxproj` look for `PRODUCT_BUNDLE_IDENTIFIER` or in Xcode under the Runner target → General → Bundle Identifier.

Deliverable: iOS bundle identifier for each app (e.g. `com.safecom.customer` and `com.safecom.employee`).

---

### B.7 Maps API key and restrictions
1. Console → APIs & Services → Credentials → Create Credentials → API key.
2. Enable APIs: Maps SDK for Android, Maps SDK for iOS, Geocoding API.
3. Restrict the key by package name + SHA-1 (Android) and bundle id (iOS).

Deliverable: API key and a list of allowed package names / bundle ids and SHA-1 fingerprints.

---

### B.8 Firebase Cloud Messaging (FCM)
1. Firebase Console → Project Settings → Cloud Messaging tab.
2. Server key (legacy) or `firebase-admin` service account is used server-side.

Deliverable: FCM settings confirmation and whether we will use `firebase-admin` SDK with service account (preferred).

---

### B.9 Android signing & Play Console steps (short)
1. Generate a release keystore (if you don't have one):
```bash
keytool -genkey -v -keystore safecom-release.jks -alias safecom -keyalg RSA -keysize 2048 -validity 10000
```
2. Note alias, keystore password, and key password. These are required to sign the build.
3. Option A (recommended): Use Google Play App Signing — upload your upload key only.
4. Upload the generated `.aab` to Play Console → Internal test → roll out.

Deliverable: keystore file or confirmation to use Play App Signing + upload key, and the `build.gradle` signing properties (do NOT commit passwords).

---

### B.10 iOS signing & App Store steps (short)
1. Enroll in Apple Developer Program.
2. Create App ID in Apple Developer → Identifiers with the bundle identifier.
3. Create App Store Connect record and upload the app via Xcode or `transport`.
4. Create App Store distribution certificate & provisioning profile (or use Xcode automatic signing).

Deliverable: App Store Connect team ID, Apple Developer team name, provisioning profile or confirmation to use Xcode automatic signing.

---

### B.11 SMTP / OTP / SMS provider
If you use OTP via SMS or email or email reset flows, provide provider details and API keys (Twilio, Exotel, SendGrid, etc.).
Deliverable: provider name, API key, from address/phone number, and any webhook endpoints.

---

## C. Security & best practices (must read)
- Use least privilege IAM roles for service accounts.
- Rotate keys periodically.
- Use Google Secret Manager or CI secret variables (GitHub Actions secrets, GitLab CI variables, etc.) for storing secrets.
- Use HTTPS and enforce TLS everywhere.
- Use CSP for Admin web app, and enable secure cookies and SameSite attributes.
- Do not store PII in logs. Mask sensitive fields.

Recommended secret storage example (GCP Secret Manager):
```bash
# create secret
echo -n "$(cat safecom-backend-sa-key.json)" | gcloud secrets create safecom-backend-sa-key --data-file=-
# grant access to service account / CI
gcloud secrets add-iam-policy-binding safecom-backend-sa-key \
  --member="serviceAccount:CI_SERVICE_ACCOUNT@..." --role="roles/secretmanager.secretAccessor"
```

## D. Post-delivery steps I will perform after you provide artifacts
1. Add production env templates and example `.env.production.example` (no real secrets).
2. Wire service account into backend and verify Firestore connectivity.
3. Add Maps key and verify map components on device.
4. Prepare Play Store and App Store release notes and checklist.
5. Provide final, ordered checklist for you to run the production deploy or give CI access and I will deploy.

## E. Final: Provide these exact items next (copy/paste and attach securely)
1. Service account JSON (or grant me a temp-access role and I will create key) — delivery: Secret Manager or encrypted file.
2. Android `applicationId` for customer and employee and release keystore (or Play App Signing decision).
3. SHA-1 fingerprint(s) for release key.
4. iOS bundle IDs and Apple Developer Team ID.
5. Maps API key (restricted) and list of package/bundle ids.
6. SMTP/SMS provider API keys (if applicable).
7. Any payment gateway keys.
8. Confirm DB type choice (Firestore recommended) and provide Cloud SQL instance name if chosen.

---

If you want, I can also generate the exact `firebase.json`, `firestore.rules`, and CI deploy scripts (GitHub Actions) once the service account and project are available.

When ready, send the items in the "Final: Provide these exact items next" list using a secure method and reply here saying which item you delivered and where (e.g., "Service account JSON uploaded to Secret Manager secret `safecom-backend-sa-key`").
