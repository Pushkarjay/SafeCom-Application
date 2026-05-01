Play Console Upload (automation scaffold)
=======================================

This folder contains a safe template and instructions to automate uploads to the Google Play Console using a service account. It intentionally does NOT include any credentials.

Steps to enable API uploads:
1. Create a Google Play Console service account with `Release Manager` permissions.
2. Generate a JSON key and store it securely on your machine (e.g., `~/.secrets/play-service-account.json`).
3. Grant the service account access to your Play Console app (Settings → API access).
4. Use `fastlane supply` or the Google Play Developer API to upload AABs. (Example script included below.)

Template upload script (Python) will look for `PLAY_SERVICE_ACCOUNT` env var or a local path; do NOT commit the service account JSON.
