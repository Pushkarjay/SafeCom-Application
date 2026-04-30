# Play Store release artifacts checklist

Use this checklist before uploading `mobile_customer` to Google Play.

## Build artifact

- [x] Android App Bundle: `build/app/outputs/bundle/release/app-release.aab`
- [ ] Optional APK for local smoke testing: `build/app/outputs/flutter-apk/app-release.apk`
- [ ] Confirm build name and build number are correct in `pubspec.yaml` or the build command

## Signing and secrets

- [ ] Release keystore created and stored securely
- [ ] Keystore alias and passwords stored outside the repo
- [ ] `android/gradle.properties` or `~/.gradle/gradle.properties` contains the release signing variables
- [ ] Production Razorpay keys are set on the backend
- [ ] Mock verification is disabled for production

## Store listing assets

- [ ] App title
- [ ] Short description
- [ ] Full description
- [ ] App icon, final high-resolution version
- [ ] Feature graphic
- [ ] Phone screenshots
- [ ] Tablet screenshots if supported
- [ ] Promo graphic or video if desired
- [ ] Privacy policy URL
- [ ] Support email / contact details

## Compliance and policy

- [ ] Privacy policy explains payment processing and any data collected
- [ ] Permissions are reviewed and justified
- [ ] Google Maps / location usage is documented
- [ ] Payment gateway usage is described clearly
- [ ] Data Safety form completed in Play Console

## Validation before upload

- [x] `flutter analyze`
- [x] `flutter test`
- [x] `flutter build appbundle --release`
- [ ] Manual install test on a real device
- [ ] Razorpay flow tested with production or test keys as appropriate

## Upload package

- [ ] Upload the `.aab` to Internal testing first
- [ ] Add release notes
- [ ] Verify crash-free startup and key user journeys
- [ ] Promote to Closed testing
- [ ] Promote to Production only after sign-off

## Recommended folder for release assets

Create a local folder outside the repo, for example:

```text
release_assets/
  screenshots/
  feature_graphic/
  privacy_policy/
  store_listing_copy/
  keystore_backup/
```

Keep secrets out of the repo and only upload the AAB plus store assets in Play Console.
