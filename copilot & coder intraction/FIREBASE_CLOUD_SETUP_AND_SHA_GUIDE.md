# SafeCom Firebase Cloud Setup and SHA Guide

Date: 2026-04-30
Project: safecom-application-01
Project Number: 177425757120

## 1) Current App Mapping (verified in code)

Android app IDs in code:
- `mobile_customer/android/app/build.gradle.kts` -> `applicationId = "com.safecom.customer"`
- `mobile_employee/android/app/build.gradle.kts` -> `applicationId = "com.safecom.employee"`

iOS bundle IDs in code (fixed):
- `mobile_customer/ios/Runner.xcodeproj/project.pbxproj` -> `com.safecom.customer`
- `mobile_employee/ios/Runner.xcodeproj/project.pbxproj` -> `com.safecom.employee`

Important:
- Firebase app nicknames can be anything.
- What must match exactly is:
  - Android package name
  - iOS bundle ID

## 2) SHA Fingerprints You Need To Add in Firebase Console

Generated from local signing report (`./gradlew signingReport`):

- SHA-1:
  `38:1E:AE:A1:A5:31:0E:F3:8E:58:28:A8:B2:B3:2A:6D:A3:EA:17:30`

- SHA-256:
  `12:F6:E2:AD:20:B8:AA:35:48:C1:43:D3:46:A7:5D:CF:34:C5:9E:90:2C:E5:93:CF:33:F3:BB:19:D5:04:4B:49`

Use these for both Android apps for debug/development.

## 3) Where To Add SHA in Firebase Console

For Android app `com.safecom.customer`:
- Firebase Console -> Project settings -> Your apps -> Android app -> Add fingerprint
- Add SHA-1 and SHA-256 above

For Android app `com.safecom.employee`:
- Firebase Console -> Project settings -> Your apps -> Android app -> Add fingerprint
- Add SHA-1 and SHA-256 above

After adding fingerprints:
- Download updated `google-services.json` for each Android app

## 4) Replace Firebase Config Files Correctly

Android:
- Place customer file at: `mobile_customer/android/app/google-services.json`
- Place employee file at: `mobile_employee/android/app/google-services.json`

iOS:
- Place customer file at: `mobile_customer/ios/Runner/GoogleService-Info.plist`
- Place employee file at: `mobile_employee/ios/Runner/GoogleService-Info.plist`

Do not swap customer/employee files.

## 5) Firebase Services to Enable (Cloud-first setup)

Enable and keep configured:
- Authentication:
  - Email/Password
  - Phone
  - Google
- Firestore Database (Native mode)
- Cloud Storage
- Cloud Messaging (FCM)
- App Check (start with Play Integrity for Android)

Optional but recommended:
- Crashlytics
- Analytics

## 6) Already Applied in Code

- Firebase Core + Auth dependencies added in both apps.
- Firebase initialization added in both apps (`main.dart`).
- Android Google services plugin added:
  - `mobile_customer/android/settings.gradle.kts`
  - `mobile_customer/android/app/build.gradle.kts`
  - `mobile_employee/android/settings.gradle.kts`
  - `mobile_employee/android/app/build.gradle.kts`
- iOS bundle IDs corrected to match Firebase app registrations.

## 7) Commands to Rebuild After Replacing Config Files

Run from workspace root:

```powershell
Set-Location 'E:\Projects\Working\SafeCom-Application\mobile_customer'
flutter clean
flutter pub get
flutter run
```

```powershell
Set-Location 'E:\Projects\Working\SafeCom-Application\mobile_employee'
flutter clean
flutter pub get
flutter run
```

## 8) Why Firestore looked inconsistent before

- Employee and customer app auth paths previously had fallback logic.
- We are now moving to Firebase-authenticated token flow.
- Remaining work: enforce Firebase token auth on all backend protected routes and ensure admin dashboard reads from same Firestore collections as mobile apps.

## 9) Next Cloud Tasks (recommended immediate order)

1. Replace config files with freshly downloaded versions after adding SHA.
2. Test Firebase Email/Phone/Google login on both apps.
3. Link authenticated users to Firestore user/employee documents (`firebaseUid` mapping).
4. Ensure admin dashboard consumes Firestore collections used by mobile apps.
5. Add Firestore security rules by role (`admin`, `employee`, `customer`).

## 10) Release SHA note

Current SHA values are for local debug keystore.
For Play Store release, add release keystore SHA-1/SHA-256 too.
If using Play App Signing, also add Play Console App Signing certificate fingerprints in Firebase.
