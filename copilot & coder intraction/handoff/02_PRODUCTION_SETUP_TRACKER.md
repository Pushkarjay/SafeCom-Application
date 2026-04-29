# 02 - Production Setup Tracker & Credentials Log

This file tracks what credentials and setup steps have been completed and what remains for production deployment.

**Last Updated:** 2026-04-29  
**Status:** In Progress (Service Account & API Key Acquired)

---

## A. Credentials Acquired ✅

### A.1 Google Cloud Project Details (CONFIRMED)
- **Project ID:** `safecom-application-01`
- **Project Number:** `177425757120`
- **Organization:** None (personal project)
- **Billing Plan:** Spark (free)
- **Status:** Active

### A.2 Firebase & Firestore (CONFIRMED)
- **Firebase Project ID:** `safecom-application-01`
- **Firestore Database ID:** `(default)`
- **Firestore Location:** `nam5` (North America, multi-region)
- **Firestore Mode:** Native (recommended ✅)
- **Database URL:** `https://console.firebase.google.com/u/0/project/safecom-application-01/firestore/databases/default/data`
- **Status:** Ready - Your database is ready to go. Just add data.

### A.3 Service Accounts (CREATED)
Two service accounts exist:

1. **Firebase Admin SDK Service Account**
   - Email: `firebase-adminsdk-fbsvc@safecom-application-01.iam.gserviceaccount.com`
   - Purpose: Firebase Admin SDK access
   - Keys: None created yet

2. **Backend Service Account** (Primary for app backend)
   - Email: `safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com`
   - Purpose: Backend server & job workers
   - Roles Assigned:
     - Cloud Datastore Owner
     - Cloud Datastore User
     - Cloud Filestore Service Agent
     - Storage Object Admin
   - Keys: None created yet (we will create next)

### A.4 Maps API Key (CREATED) ⚠️ SECRET
- **Key Name:** `Safecom Map API`
- **Key ID:** `AIzaSyANZNLmq-g_aXIYaiWXLwnacDOsN1ew3-8`
- **Restrictions:** 38 APIs (overly broad - should restrict to Maps APIs only)
- **Status:** Created, needs tightening
- **Action:** MUST add to `.gitignore` immediately; stored in Secret Manager only

### A.5 Service Account JSON Key (PENDING CREATION)
- **File:** `safecom-application-01-bd460c495567.json` (downloaded)
- **Location:** `A:\Downloads\` (INSECURE - move to repo secrets folder)
- **Action:** Create proper key via gcloud and move to `./.secrets/` folder (git-ignored)

### A.6 Firebase Cloud Messaging (ENABLED) ✅
- **API:** Firebase Cloud Messaging API (V1)
- **Sender ID:** `177425757120`
- **Web Push:** Certificate key pair generated ✅
- **Status:** Ready for push notifications

### A.7 Browser Key (AUTO-CREATED)
- **Key Name:** `Browser key (auto created by Firebase)`
- **Restrictions:** 25 APIs
- **Note:** Safe to keep; Firebase managed

---

## B. Database Decision: Firestore Only vs Cloud SQL

### Decision: Firestore ONLY ✅
**Recommendation:** Use Firebase Firestore as your primary database.

**Why Firestore:**
- ✅ Real-time sync built-in (perfect for mobile customer/employee apps)
- ✅ Offline-first with auto-sync (great for field technicians)
- ✅ Scales automatically (no provisioning needed)
- ✅ Free tier generous (Spark plan covers dev & early production)
- ✅ Firestore rules for security (no separate database ACL management)
- ✅ No database credentials to rotate (uses IAM only)
- ✅ Already set up in your Firebase project

**When to add Cloud SQL later:**
- Need complex multi-table transactions
- Need advanced SQL reporting/analytics
- Need PostgreSQL-specific features
- Data volume > Firestore soft limits (~1 million documents per day write rate)

**For now:** Stick with Firestore. Add Cloud SQL only if you hit these constraints.

---

## C. Next Steps (In Order)

### C.1 Create Service Account JSON Key ⏳
**Status:** Need to run this command

The previous multi-line command failed due to PowerShell syntax. Run this instead (single line):

```powershell
gcloud iam service-accounts keys create ./safecom-backend-sa-key.json --iam-account=safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com
```

After running:
1. A file `./safecom-backend-sa-key.json` will be created in the current folder.
2. Move it to `./.secrets/safecom-backend-sa-key.json` (we will create this folder and add to .gitignore).
3. This key will be set as environment variable `GOOGLE_APPLICATION_CREDENTIALS` on the server.
4. Do NOT commit to git.

### C.2 Get Android Package Names ⏳
The Flutter project structure doesn't have a top-level `android/` folder visible in your project root. The Android build config is likely inside `mobile_customer/android/` and `mobile_employee/android/`.

Run this to find build.gradle files:

```powershell
Get-ChildItem -Path . -Filter "build.gradle" -Recurse | Select-Object FullName
```

Or check manually:
- `mobile_customer/android/app/build.gradle` → look for `applicationId`
- `mobile_employee/android/app/build.gradle` → look for `applicationId`

Expected values:
```
com.safecom.customer  # Customer app
com.safecom.employee  # Employee app
```

### C.3 Generate Android Release Keystore ⏳
`keytool` is not in your PATH. It's bundled with Java. Find it:

```powershell
# Find Java keytool
where java
# Should return something like: C:\Program Files\Java\jdk-17.0.2\bin\java.exe
# Then keytool is at: C:\Program Files\Java\jdk-17.0.2\bin\keytool.exe
```

Once found, add Java bin to PATH or use full path:

```powershell
# Option 1: Add Java to PATH temporarily
$env:Path += ";C:\Program Files\Java\jdk-17.0.2\bin"
keytool -genkey -v -keystore safecom-release.jks -alias safecom -keyalg RSA -keysize 2048 -validity 10000
```

When prompted, enter:
- **Keystore password:** [STRONG PASSWORD - save in Secret Manager]
- **Key password:** [same or different - save in Secret Manager]
- **First and last name:** Safecom Technologies
- **Organizational unit:** Development
- **Organization:** Safecom
- **City:** [your city]
- **State:** [your state]
- **Country code:** IN (for India)

Result: `safecom-release.jks` file created. Move to `./.secrets/` folder (git-ignored).

### C.4 Get SHA-1 Fingerprint (Debug & Release) ⏳
After keystore is created:

```powershell
# Debug key SHA-1
$env:Path += ";C:\Program Files\Java\jdk-17.0.2\bin"
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android | Select-String "SHA1"

# Release key SHA-1
keytool -list -v -keystore safecom-release.jks -alias safecom | Select-String "SHA1"
```

You'll get fingerprints like:
```
SHA1: AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01
```

Remove colons for Google Console:
```
ABCDEF0123456789ABCDEF0123456789ABCDEF01
```

### C.5 Get iOS Bundle Identifier ⏳
For Flutter iOS apps:

```powershell
# Check Xcode project
Select-String -Path "mobile_customer/ios/Runner/Info.plist" -Pattern "CFBundleIdentifier"
Select-String -Path "mobile_employee/ios/Runner/Info.plist" -Pattern "CFBundleIdentifier"
```

Or open Xcode:
```powershell
open mobile_customer/ios/Runner.xcworkspace
# In Xcode: Runner target → General → Bundle Identifier
```

Expected values:
```
com.safecom.customer  # Customer app
com.safecom.employee  # Employee app
```

### C.6 Add Google Maps Credentials ⏳
The Maps API key you created needs platform restrictions:

1. Open Google Cloud Console → APIs & Services → Credentials
2. Click on `Safecom Map API` key
3. Under "Application restrictions" select **Android apps**
4. Add both Android package names + SHA-1 fingerprints:
   ```
   Package: com.safecom.customer, SHA-1: ABCD...
   Package: com.safecom.employee, SHA-1: ABCD...
   ```
5. Also restrict by **APIs** → keep only:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API
   - Places API (if needed)

### C.7 Restrict Service Account Roles (Principle of Least Privilege) ⏳
The `safecom-backend-sa` currently has broad roles. Tighten to:

```powershell
# Remove Cloud Filestore Service Agent (not needed)
gcloud projects remove-iam-policy-binding safecom-application-01 `
  --member="serviceAccount:safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com" `
  --role="roles/compute.filestore.agent"

# Keep only:
# - roles/datastore.user (read/write Firestore)
# - roles/storage.objectAdmin (upload photos)
```

---

## D. Files to Create / Secure

### D.1 `.gitignore` additions ⏳
Add these lines to `./.gitignore`:

```
# Secrets & Credentials (NEVER commit these)
.secrets/
.env.production
.env.production.local
*.jks
safecom-backend-sa-key.json
safecom-application-01-bd460c495567.json
*.json.key
node_modules/.cache
```

### D.2 `.env.production.example` (template, safe to commit) ⏳
Create `backend_server/.env.production.example`:

```env
# Firebase / Firestore
FIREBASE_PROJECT_ID=safecom-application-01
FIRESTORE_DATABASE_ID=projects/safecom-application-01/databases/(default)
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/safecom-backend-sa-key.json

# Backend
NODE_ENV=production
PORT=4000
BACKEND_URL=https://api.safecom.in
JWT_SECRET_KEY=<WILL_BE_GENERATED>

# Maps API
GOOGLE_MAPS_API_KEY=<STORED_IN_SECRET_MANAGER>

# Database (Firestore only, no need for separate DB config)
# Firestore access is via GOOGLE_APPLICATION_CREDENTIALS

# SMTP (for OTP/email if needed)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASSWORD=

# Mobile Apps Configuration (pushed to apps at build time)
CUSTOMER_APP_ID=com.safecom.customer
EMPLOYEE_APP_ID=com.safecom.employee
```

### D.3 `.env.production` (actual secrets, DO NOT commit) ⏳
After creating `.env.production.example`, create `.env.production` with real values and add to `.gitignore`.

---

## E. Folder Structure to Create

```
SafeCom-Application/
├── .secrets/                          # NEW - Git-ignored
│   ├── safecom-backend-sa-key.json   # Move here
│   ├── safecom-release.jks            # Move here
│   └── .gitkeep
├── backend_server/
│   ├── .env.production.example        # NEW - safe template
│   ├── .env.production                # NEW - git-ignored
│   └── ...
├── mobile_customer/
│   ├── .env.production                # NEW - git-ignored (Maps API key, backend URL)
│   └── ...
├── mobile_employee/
│   ├── .env.production                # NEW - git-ignored
│   └── ...
└── Admin/
    └── web_app/admin-dashboard/
        ├── .env.production.example    # NEW
        └── .env.production            # NEW - git-ignored
```

---

## F. Credentials Checklist (What You Provided ✅ / Still Need ⏳)

| Item | Status | Value / Action |
|------|--------|-----------------|
| Google Cloud Project ID | ✅ | `safecom-application-01` |
| Firebase Project ID | ✅ | `safecom-application-01` |
| Firestore Database | ✅ | `projects/safecom-application-01/databases/(default)` |
| Database Type | ✅ | Firestore Native (no Cloud SQL needed) |
| Service Account Email | ✅ | `safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com` |
| Service Account JSON | ⏳ | Move `safecom-application-01-bd460c495567.json` to `./.secrets/` |
| Maps API Key | ⚠️ | Add to `.gitignore` + restrict by platform |
| Android Package Names | ⏳ | Find in `mobile_customer/android/app/build.gradle` & `mobile_employee/android/app/build.gradle` |
| Android Release Keystore | ⏳ | Generate `safecom-release.jks` and move to `./.secrets/` |
| SHA-1 Fingerprints | ⏳ | Extract from keystore (debug + release) |
| iOS Bundle IDs | ⏳ | Find in `mobile_customer/ios/Runner/Info.plist` & `mobile_employee/ios/Runner/Info.plist` |
| Firestore Rules | ⏳ | Export with `firebase firestore:rules` |

---

## G. Recommended Sequence for Next Run

1. ✅ Create service account JSON key (section C.1)
2. ✅ Move JSON to `./.secrets/` folder
3. ✅ Create `.gitignore` entries
4. ✅ Get Android package names (section C.2)
5. ✅ Generate keystore (section C.3)
6. ✅ Get SHA-1 fingerprints (section C.4)
7. ✅ Get iOS bundle IDs (section C.5)
8. ✅ Restrict Maps API key (section C.6)
9. ✅ Tighten IAM roles (section C.7)
10. ✅ Create environment templates (section D.2 & D.3)
11. ✅ Create folder structure (section E)
12. ✅ Push all to GitHub (except `.secrets/` and `.env.production`)

---

## H. Security Reminders
- 🔒 Never push `.secrets/` folder
- 🔒 Never push `.env.production` files
- 🔒 Never commit service account JSON
- 🔒 Never commit API keys (except for templates like `.env.example`)
- 🔒 Maps API key currently has 38 APIs enabled — restrict to Maps only
- 🔒 Service account roles should be least-privilege — remove unused roles
- 🔒 Rotate keys every 90 days in production
- 🔒 Use Google Cloud Secret Manager for storing secrets in production

---

## I. Questions to Resolve

**Q1: Do I need Cloud SQL?**  
**A:** No, not now. Firestore is sufficient. Add Cloud SQL only if you outgrow Firestore (~1M writes/day).

**Q2: How do I deploy the backend?**  
**A:** We'll cover in 03_DEPLOYMENT.md once credentials are finalized.

**Q3: How do I handle secrets in CI/CD?**  
**A:** Use GitHub Actions secrets or Google Cloud Secret Manager. We'll set this up in 03_DEPLOYMENT.md.

**Q4: What about database backups?**  
**A:** Firestore has automatic backups. For production, enable Cloud Backup & Restore (paid tier).

---

## Notes
- Company: Safecom (SafeCom Technologies)
- Apps: Safecom - IT & Security (Customer), Safecom - Employee (Employee)
- Admin: Not on Play Store (web-only)
- Firestore Mode: Native (selected)
- Billing: Spark (free tier)
- Push Notifications: Firebase Cloud Messaging (V1) enabled
- Maps: Google Maps API key created (needs platform restrictions)
- Backend: Express.js with Firestore admin SDK
- Mobile: Flutter (Riverpod + Dio)
- Admin: React + TypeScript

---

**Created:** 2026-04-29 by Copilot  
**Next File:** `03_DEPLOYMENT_SETUP.md` (after all credentials acquired)
