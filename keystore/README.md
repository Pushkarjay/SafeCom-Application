Release Keystore Instructions
=============================

Generate a release keystore on a secure developer machine and never commit it to git.

One-time key generation (example):
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias safecom_release
```

Recommended storage
- Keep the keystore in a secure location (encrypted disk or secret manager).
- Add the keystore path and passwords to your local Gradle properties `~/.gradle/gradle.properties`:

```properties
# do NOT commit this file
SAFECOM_KEYSTORE=/path/to/release-key.jks
SAFECOM_KEYSTORE_PASSWORD=your_keystore_password
SAFECOM_KEY_ALIAS=safecom_release
SAFECOM_KEY_PASSWORD=your_key_password
```

The Android builds in this repo are wired to read these properties when present. If not present, the debug signing will be used for local debug builds.
