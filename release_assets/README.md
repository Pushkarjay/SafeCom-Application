Play Store Release Assets
=========================

Folder layout and checklist for preparing release assets for both customer and employee apps.

Files to prepare (store outside the repo):
- `keystore/release-key.jks` — keep secure, do NOT commit.
- `store_listing/` — screenshots, feature graphic, promo video, icons.
- `privacy_policy/` — hosted HTML or URL to your privacy policy.

Checklist
---------
1. Create release keystore (one-time) and store in a secure vault.
2. Produce AABs for both apps and verify locally on devices.
3. Prepare store assets (icons, screenshots, feature graphic).
4. Prepare store metadata (title, short/long description, support email).
5. Ensure privacy policy URL is reachable.
6. Upload to Play Console internal testing, verify, then promote to staged rollout.

Commands
--------
Build AAB (customer):
```bash
cd mobile_customer
flutter clean
flutter pub get
flutter build appbundle --release --build-name=1.0.1 --build-number=2
# artifact: build/app/outputs/bundle/release/app-release.aab
```

Build AAB (employee):
```bash
cd mobile_employee
flutter clean
flutter pub get
flutter build appbundle --release --build-name=1.0.1 --build-number=2
# artifact: build/app/outputs/bundle/release/app-release.aab
```

Do NOT commit any keystore, service-account JSON, or other secrets to GitHub.
