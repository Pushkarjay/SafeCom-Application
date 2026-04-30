## Play Store release checklist and commands

This document lists the minimal steps to prepare `mobile_customer` for release to Google Play (AAB) and recommended configuration changes.

1) Verify app version

- Current `pubspec.yaml` version is `1.0.0+1`. Bump as needed before release, e.g. to `1.0.1+2`.

2) Create a release keystore (one-time)

Run on a machine with Java JDK installed:

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias safecom_release
```

Securely store `release-key.jks` and the alias/passwords. Do NOT commit the keystore or passwords to git.

3) Add signing config to `~/.gradle/gradle.properties` or `android/gradle.properties`

Add the following (example using environment variables):

```
SAFECOM_KEYSTORE=path/to/release-key.jks
SAFECOM_KEY_ALIAS=safecom_release
SAFECOM_KEY_PASSWORD=your_keystore_password
SAFECOM_KEYSTORE_PASSWORD=your_key_password
```

Alternatively, add them to `~/.gradle/gradle.properties` to avoid checking into repo.

4) Update `android/app/build.gradle.kts` signingConfig (if you want an in-repo example)

Use Gradle variables that read from `gradle.properties` so secrets are not checked in. The current project defaults to debug signing; replace the release signingConfig with a secure reference before building for Play.

Example snippet:

```kotlin
android {
  signingConfigs {
    create("release") {
      storeFile = file(project.findProperty("SAFECOM_KEYSTORE") as String)
      storePassword = project.findProperty("SAFECOM_KEYSTORE_PASSWORD") as String
      keyAlias = project.findProperty("SAFECOM_KEY_ALIAS") as String
      keyPassword = project.findProperty("SAFECOM_KEY_PASSWORD") as String
    }
  }

  buildTypes {
    release {
      signingConfig = signingConfigs.getByName("release")
    }
  }
}
```

5) Build the release AAB

From repo root:

```bash
cd mobile_customer
flutter clean
flutter pub get
# set build name/number if needed
flutter build appbundle --release --build-name=1.0.1 --build-number=2
```

This produces `build/app/outputs/bundle/release/app-release.aab`.

6) Backend & payment gateway

- Ensure production Razorpay keys are set in your backend environment (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and remove `RAZORPAY_ALLOW_MOCK_VERIFY` or set it to `false`.
- Test end-to-end with Razorpay test keys first, then switch to live keys only after verifying flows.

7) Testing & final checks

- Run `flutter analyze` and `flutter test` locally.
- Confirm `android:exported` flags and permission requirements are reviewed in `android/app/src/main/AndroidManifest.xml`.
- Confirm the `applicationId` in `android/app/build.gradle.kts` is correct: `com.safecom.customer`.

8) Play Store assets & metadata

- Prepare listing: title, short + long description, screenshots (phone/tablet), feature graphic, promo assets, privacy policy URL.
- Privacy policy must disclose payment gateway usage and any data collected by the app and backend.

9) Upload & release

- Use Google Play Console to upload the AAB, fill release notes, run internal testing track first, then move to closed/production when ready.

10) Post-release

- Monitor Play Console for crashes, ANRs, and review user feedback.
- Rotate/secure production keys and revoke any test-only keys.

If you want, I can:
- Generate a sample `android/keystore/README.md` with exact Gradle snippets to add.
- Attempt to run `flutter build appbundle` here (I may be blocked if Android SDK isn't available in this environment).
