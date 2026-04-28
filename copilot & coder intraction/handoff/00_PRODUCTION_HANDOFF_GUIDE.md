# Production Handoff Guide

This folder is temporary and exists only to organize the collaboration notes, planning docs, and production intake checklist while development is still active.

## How to use this guide
- Reply to me in the same order as the sections below.
- Do not paste secrets directly if you can avoid it.
- For passwords, API keys, Firebase secrets, service account JSON, and database credentials, prefer a secure secret store or a temporary `.env.production` file.
- If you want a value added to an SRS document, append it rather than rewriting existing text unless I explicitly ask for a targeted update.

## Step 1: Project identity and ownership
Send these first:
1. Official company or client name
2. App names for Play Store / App Store
3. Primary contact person and role
4. Approval owner for production release
5. Support contact for future changes
6. Time zone and business hours

## Step 2: Production environment map
Send the exact target for each app:
1. Admin Dashboard production domain or hosting target
2. Backend production server URL
3. Mobile Customer production API base URL
4. Mobile Employee production API base URL
5. Staging URLs, if any
6. Local development URLs, if they must remain supported

## Step 3: Firebase / Google Cloud setup
Send these in order:
1. Google Cloud project ID
2. Firebase project ID
3. Firebase app IDs for Android, iOS, and web if already created
4. Firestore database ID
5. Firestore region
6. Whether Firestore rules are already written or still need review
7. Whether Authentication is enabled and which providers are required
8. Whether Cloud Messaging is needed
9. Whether App Check is enabled
10. Whether Analytics / Crashlytics are required

## Step 4: Secrets and credentials
Send the secret values only through a secure method, not in plain chat if possible:
1. Firestore / Firebase service account JSON path or secure access method
2. Database username and password if a separate database is used
3. Backend `.env` values that are needed in production
4. JWT secret / signing key handling method
5. SMTP credentials if email OTP or reset flows are enabled
6. Push notification server key if needed
7. Maps API key if location features are enabled
8. Any third-party API keys or webhook secrets

## Step 5: Backend production details
Send these next:
1. Backend deployment target
2. Database type: Firestore, PostgreSQL, MySQL, SQL Server, SQLite, or other
3. Whether the backend should use mock fallback in production or only in development
4. Required API endpoints that must be live before release
5. Rate limits or usage limits
6. Logging requirements
7. Error reporting requirements
8. Backup / restore plan
9. Admin user seed data requirements

## Step 6: App behavior rules
Tell me how production should behave for:
1. Login and session expiry
2. Password reset / OTP delivery
3. Offline behavior
4. Retry logic for failed API calls
5. Whether mock data should be hidden or retained as fallback
6. Upload limits for photos and files
7. Location permission handling
8. Notification behavior
9. Data retention rules
10. Account deletion or deactivation flow

## Step 7: UI / UX direction
Confirm these design choices:
1. Brand colors
2. Font family preferences
3. Button style preference
4. Light / dark mode policy
5. Icon style preference
6. Spacing and density preference
7. Accessibility requirements
8. Language and localization requirements
9. Any screens that need a premium or more vibrant visual treatment
10. Any design examples or competitor apps to match

## Step 8: Mobile store release data
Send this when ready for publishing:
1. Android package name
2. iOS bundle identifier
3. App version and build number policy
4. Play Store title and short description
5. Play Store full description
6. App icon source files
7. Feature graphic and screenshots
8. Privacy policy URL
9. Terms of service URL
10. Developer account ownership details
11. Release track preference: internal, closed, open, production
12. Whether signing keys already exist

## Step 9: Security and compliance
Confirm:
1. Whether any customer PII is stored
2. Whether CCTV or location data is sensitive and needs extra protection
3. Whether file uploads need encryption or signed URLs
4. Whether audit logs are required
5. Whether role-based access is required for admin, employee, and customer
6. Whether two-factor authentication is needed
7. Whether any data must never be stored on device
8. Whether production logs must mask sensitive fields

## Step 10: SRS updates
If you want the requirements documented formally, I will append the following sections to the SRS set:
1. Production environment and deployment requirements
2. Security and secret-handling requirements
3. Firebase / Firestore configuration requirements
4. Play Store publishing requirements
5. UI / UX accessibility and visual requirements
6. User flow and role-based access requirements

## Step 11: What I need from you first
Reply with this minimum set so I can prepare the production plan:
1. Company/client name
2. App names
3. Production backend URL
4. Google Cloud project ID
5. Firebase project ID
6. Firestore database ID
7. Firestore credentials delivery method
8. Database type and database credentials method
9. Package name and bundle ID
10. Brand colors and UI direction

## Recommended response format
Use this template in your reply:
```text
1. Company name:
2. App names:
3. Production backend URL:
4. Google Cloud project ID:
5. Firebase project ID:
6. Firestore database ID:
7. Firestore credentials method:
8. Database type:
9. Database credentials method:
10. Android package name:
11. iOS bundle identifier:
12. Brand colors:
13. UI direction:
14. Notes:
```

## Production readiness sequence
After you answer, I will work in this order:
1. Lock the production environment map
2. Add or update env handling for each app
3. Verify secret injection and removal of hardcoded values
4. Wire production API endpoints and Firebase settings
5. Review UI/UX polish and responsiveness
6. Add release metadata for Play Store
7. Final build verification
8. Prepare publishing checklist

## Important security note
Never commit live credentials into source control. Use one of these instead:
- `.env.production`
- secure CI/CD secret variables
- Firebase / Google Cloud secret manager
- encrypted local key storage for mobile apps

If you send me secrets in chat, I will treat them as temporary working values and help you replace them with safer production handling as soon as possible.
