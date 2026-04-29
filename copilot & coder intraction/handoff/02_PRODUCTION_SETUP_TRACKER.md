# 02 - Production Setup Tracker & Credentials Log

This file tracks what credentials and setup steps have been completed and what remains for production deployment.

**Last Updated:** 2026-04-29 (Updated)  
**Status:** ✅ Service Account & API Key Acquired | ✅ Secured to .secrets/ | ⏳ Android Keystore & SHA-1 Pending

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
- **Key ID:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (stored in Secret Manager, check `.env.production`)
- **Restrictions:** 38 APIs (currently unrestricted, can restrict in future if needed)
- **Status:** Active and ready
- **Note:** API key exposed in 02_ file temporarily during setup. Now stored securely in `.env.production.example` template. Actual key stored in `.env.production` (git-ignored).

### A.5 Service Account JSON Key ✅ COMPLETED
- **File:** `safecom-backend-sa-key.json` (created via gcloud)
- **Location:** `./.secrets/safecom-backend-sa-key.json` (secure, git-ignored)
- **Created:** Key ID `3a96c9c3ce8f8324622a9a09e33ba7967bdffdc8`
- **Status:** Secured and ready for server deployment
- **Note:** Environment variable `GOOGLE_APPLICATION_CREDENTIALS` set to `./.secrets/safecom-backend-sa-key.json` in `.env.production`

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

### C.1 Create Service Account JSON Key ✅ COMPLETED
**Status:** Done - Key created and secured

**What was done:**
```powershell
gcloud iam service-accounts keys create ./safecom-backend-sa-key.json --iam-account=safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com
# Result: created key [3a96c9c3ce8f8324622a9a09e33ba7967bdffdc8]
```

**Completed steps:**
1. ✅ File `./safecom-backend-sa-key.json` created
2. ✅ Moved to `./.secrets/safecom-backend-sa-key.json` (secure, git-ignored)
3. ✅ Environment variable `GOOGLE_APPLICATION_CREDENTIALS` configured in `.env.production`
4. ✅ NOT committed to git (.secrets/ is in .gitignore)

### C.2 Get Android Package Names ✅ COMPLETED
**Actual values found in build.gradle.kts files:**

**Mobile Customer:**
```kotlin
// File: mobile_customer/android/app/build.gradle.kts
applicationId = "com.example.mobile_customer"
```

**Mobile Employee:**
```kotlin
// File: mobile_employee/android/app/build.gradle.kts
applicationId = "com.example.mobile_employee"
```

**To update to Safecom branding later:**
- Change `com.example.mobile_customer` → `com.safecom.customer`
- Change `com.example.mobile_employee` → `com.safecom.employee`
- This can be done during Play Store publishing setup

### C.3 Generate Android Release Keystore ⏳
**Java location found:** `D:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`

**Run this command:**

```powershell
# Add Java to PATH
$env:Path += ";D:\Program Files\Android\Android Studio\jbr\bin"

# Generate keystore
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
# Add Java to PATH
$env:Path += ";D:\Program Files\Android\Android Studio\jbr\bin"

# Debug key SHA-1
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

### C.6 Add Google Maps Platform Restrictions (OPTIONAL - Do Later)
**Current status:** Maps API key works for all 38 APIs

**Optional enhancement for production (can be done anytime):**
If you want to restrict the Maps API key by platform later:

1. Open Google Cloud Console → APIs & Services → Credentials
2. Click on `Safecom Map API` key
3. Under "Application restrictions" select **Android apps**
4. Add both Android package names + SHA-1 fingerprints:
   ```
   Package: com.example.mobile_customer, SHA-1: [your-debug-sha1]
   Package: com.example.mobile_employee, SHA-1: [your-release-sha1]
   ```
5. Also restrict by **APIs** → keep only:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API
   - Places API (if needed)

**Note:** Current unrestricted setup is fine for development. Restrict before production release to prevent unauthorized usage.

### C.7 Restrict Service Account Roles (OPTIONAL - Best Practice for Later)
**Current status:** Service account has 4 roles assigned

**Optional security hardening (can be done before production):**
The `safecom-backend-sa` currently has broad roles that can be tightened:

```powershell
# Remove Cloud Filestore Service Agent (not needed for Firestore)
gcloud projects remove-iam-policy-binding safecom-application-01 `
  --member="serviceAccount:safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com" `
  --role="roles/compute.filestore.agent"

# Keep only what's needed:
# - roles/datastore.user (read/write Firestore)
# - roles/storage.objectAdmin (upload photos to Cloud Storage)
# - roles/cloudlogging.logWriter (optional, for structured logging)
```

**Note:** Current setup is functional. Apply least-privilege restrictions before production release for security best practices.

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

## F. Credentials Checklist (Status Update)

| Item | Status | Value / Action |
| Google Cloud Project ID | ✅ | `safecom-application-01` |
| Firebase Project ID | ✅ | `safecom-application-01` |
| Firestore Database | ✅ | `projects/safecom-application-01/databases/(default)` |
| Database Type | ✅ | Firestore Native (no Cloud SQL needed) |
| Service Account Email | ✅ | `safecom-backend-sa@safecom-application-01.iam.gserviceaccount.com` |
| Service Account JSON | ✅ | Secured at `./.secrets/safecom-backend-sa-key.json` |
| Maps API Key | ✅ | Created: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (stored in `.env.production`) |
| Android Package Names | ✅ | `com.example.mobile_customer` & `com.example.mobile_employee` (update to com.safecom.* later) |
| Android Release Keystore | ⏳ | Generate `safecom-release.jks` and move to `./.secrets/` |
| SHA-1 Fingerprints | ⏳ | Extract from keystore (debug + release) |
| iOS Bundle IDs | ⏳ | Find in `mobile_customer/ios/Runner/Info.plist` & `mobile_employee/ios/Runner/Info.plist` |
| Firestore Rules | ⏳ | Export with `firebase firestore:rules` |

---

## G. Recommended Sequence - Current Progress

### ✅ COMPLETED STEPS
1. ✅ Create service account JSON key (section C.1) - Key ID: 3a96c9c3ce8f8324622a9a09e33ba7967bdffdc8
2. ✅ Move JSON to `./.secrets/` folder - Secured and git-ignored
3. ✅ Create `.gitignore` entries - All secrets protected
4. ✅ Get Android package names (section C.2) - Found: com.example.mobile_customer & com.example.mobile_employee

### ⏳ NEXT STEPS TO COMPLETE
5. ⏳ Generate keystore (section C.3) - Use keytool at `D:\Program Files\Android\Android Studio\jbr\bin`
6. ⏳ Get SHA-1 fingerprints (section C.4) - Extract from debug & release keystores
7. ⏳ Get iOS bundle IDs (section C.5) - Check Runner/Info.plist files

### 📌 OPTIONAL STEPS (Can do before production release)
8. 📌 Restrict Maps API key (section C.6) - Currently works for all 38 APIs, can restrict later to Maps-only
9. 📌 Tighten IAM roles (section C.7) - Remove unused service account roles before production

### 📋 FINAL STEPS
10. ✅ Create environment templates (section D.2 & D.3) - Done
11. ✅ Create folder structure (section E) - `.secrets/` created and secured
12. ✅ Push all to GitHub - Done (except `.secrets/` and `.env.production`)

---

## H. Security Reminders
- 🔒 Never push `.secrets/` folder - Git-ignored and validated ✅
- 🔒 Never push `.env.production` files - Protected by .gitignore ✅
- 🔒 Never commit service account JSON - Secured to `./.secrets/` ✅
- 🔒 Never commit API keys - Use `.env.production` (git-ignored) to store actual keys
- 🔒 Maps API key: Currently works for 38 APIs. Optional: Restrict to Maps-only before production
- 🔒 Service account roles: Optional: Apply least-privilege before production release
- 🔒 Rotate keys every 90 days in production
- 🔒 Use Google Cloud Secret Manager for storing secrets in production deployment
- 🔒 API key was temporarily visible in this file during setup (now redacted with xxxx), always stored securely in .env files

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

**Q5: Do I need to restrict the Maps API key now?**  
**A:** No. It works fine for development. Before releasing to Play Store, add platform restrictions with SHA-1 fingerprints.

**Q6: Do I need to tighten service account roles now?**  
**A:** Optional. Current setup is functional. Apply least-privilege (remove Cloud Filestore role) before production for best practices.

**Q7: What about updating Android package IDs to com.safecom.* ?**  
**A:** Update in build.gradle.kts during Play Store publishing setup. Android package IDs cannot be changed after the first release.

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
