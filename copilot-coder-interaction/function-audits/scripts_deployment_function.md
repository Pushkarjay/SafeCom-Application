# SCRIPTS AND DEPLOYMENT - COMPLETE FUNCTION AUDIT

**Date:** 2026-06-14
**Scope:** Every seed script, migration tool, CI/CD pipeline, and deployment configuration

---

## TABLE OF CONTENTS

1. [Seed Scripts](#1-seed-scripts)
2. [Migration Tools](#2-migration-tools)
3. [Testing Scripts](#3-testing-scripts)
4. [Build Configuration](#4-build-configuration)
5. [CI/CD Pipelines](#5-cicd-pipelines)
6. [Release Management](#6-release-management)
7. [Docker Deployment](#7-docker-deployment)
8. [Firebase Hosting](#8-firebase-hosting)
9. [Play Store Upload](#9-play-store-upload)
10. [Block Diagrams](#10-block-diagrams)
11. [Known Issues and Fixes Required](#11-known-issues-and-fixes-required)

---

## 1. SEED SCRIPTS

### Catalog Seeds
| Script | Purpose |
|--------|---------|
| seed-catalog-collections.mjs | Seed catalog product data |
| seed-core-data.mjs | Seed core Firestore data |
| seed-installation-nested.mjs | Seed nested service tree |
| seed-maintenance-repair-configs.mjs | Seed maintenance/repair configs |
| seed-master-products.mjs | Seed master products |
| seed-sdui-layouts.mjs | Seed SDUI layouts |
| seed-service-configs.mjs | Seed service configurations |
| seed-now.mjs | Quick seed for current state |
| seed-products.mjs | Legacy product seed |
| seedFirestore.js | General Firestore seeding |
| seed_installation_bundles.ts | Installation bundles seed (TS) |
| seed_sdui_layout.ts | SDUI layout seed (TS) |
| seed_camera_tree.js | Camera service tree seed |
| seed_camera_tree.ts | Camera service tree seed (TS) |

### Dependencies
- Firebase Admin SDK
- Service account key for Firestore access
- Run in order: core data -> catalog -> service tree -> SDUI

---

## 2. MIGRATION TOOLS

| Script | Purpose |
|--------|---------|
| migrateFirestore.js | Data migration between schema versions |
| inspectFirestore.js | Inspect Firestore collection contents |
| cleanupFirestore.js | Clean up orphaned or test data |
| cleanup-db.js | Database cleanup operations |
| cleanup-collections.js | Collection-specific cleanup |
| cleanup-duplicate-cms.mjs | Deduplicate CMS block entries |
| check-firestore.js | Firestore health check and validation |

### Migration History
1. Legacy to Normalized Schema: Migrated flat user collections to users + roles
2. Service Restructure: Migrated PService to nested Services tree
3. Booking Schema: Restructured bookings with canonical invoice

---

## 3. TESTING SCRIPTS

| Script | Purpose | Status |
|--------|---------|--------|
| test-apis.js | API endpoint testing | Manual |
| add_sha_to_firebase.js | Add SHA certificate to Firebase | One-time |
| e2e-testing-guide.sh | E2E test script | Manual |
| test-api.ps1 | PowerShell API test | Manual |

### Test Coverage
- No automated test framework configured
- No unit tests for backend services
- No widget tests for Flutter apps
- No integration tests for API flows

---

## 4. BUILD CONFIGURATION

### Backend (Node.js + TypeScript)
| File | Purpose |
|------|---------|
| backend_server/tsconfig.json | TypeScript config |
| backend_server/package.json | Dependencies and scripts |
| backend_server/Dockerfile | Docker build for Cloud Run |

### Admin Dashboard (React + Vite)
| File | Purpose |
|------|---------|
| tsconfig.json | TypeScript config |
| vite.config.ts | Vite build config |
| package.json | Dependencies |

### Flutter Apps
| File | Purpose |
|------|---------|
| mobile_customer/pubspec.yaml | Customer app deps |
| mobile_employee/pubspec.yaml | Employee app deps |
| */android/build.gradle | Android build config |

---

## 5. CI/CD PIPELINES

### Workflow Files (4 total)

| File | Purpose | Trigger |
|------|---------|---------|
| `build-mobile.yml` | Build Customer + Employee Flutter APKs/AABs | Push to `main` on mobile paths + manual dispatch |
| `deploy-backend.yml` | Build Docker image, deploy to Cloud Run (2 regions) | Push to `main` on backend paths + manual |
| `deploy-admin.yml` | Build + deploy Admin Dashboard to Firebase Hosting | Push to `main` on admin paths + manual |
| `deploy-landing.yml` | Deploy Customer Landing page to Firebase Hosting | Push to `main` on landing paths + manual |

---

### 5.1 build-mobile.yml (240 lines)

**Triggers:**
- Push to `main` when `mobile_customer/**`, `mobile_employee/**`, or `.github/workflows/build-mobile.yml` change
- Manual `workflow_dispatch` with inputs: `bump_version`, `upload_play_store`, `release_track`

**Job 1: build-customer**
```
1. actions/checkout@v4
2. actions/setup-java@v4 (JDK 17, Temurin)
3. flutter-actions/setup-flutter@v4 (stable, latest)
4. Decode keystore (base64 secret -> ~/.android/safecom-keystore.jks)
5. Decode google-services.json (base64 secret -> android/app/google-services.json)
6. Decode strings.xml (base64 secret -> android/app/src/main/res/values/strings.xml)
7. Bump build number (manual only: parse pubspec, increment, git commit [skip ci])
8. flutter pub get
9. flutter build apk --release (with keystore env vars)
10. flutter build appbundle --release (with keystore env vars)
11. actions/upload-artifact@v4 (APK + AAB saved)
```

**Job 2: build-employee** — identical structure for employee app

**Job 3: upload-play-store**
- Only runs on manual dispatch with `upload_play_store: true`
- Downloads artifacts from build-customer + build-employee
- `r0adkll/upload-google-play@v1` for both packages

**Issues with build-mobile.yml:**

| Issue | Details |
|-------|---------|
| No PR triggers | Build only runs on push to main — no PR validation |
| No `flutter test` | Zero test execution in CI — `widget_test.dart` exists but never runs |
| No `flutter analyze` | Linting/static analysis absent — `analysis_options.yaml` unused |
| No code formatting | `dart format` never enforced |
| Feature branches not built | Only main branch — can't validate before merge |
| `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` | Unusual compat flag, undocumented |
| `upload-google-play@v1` outdated | Last updated 2022 — should use `@v1.1.0` |
| No version bump on push | Auto-builds always produce same version |
| No iOS build | Only Android — no macOS runner configured |
| No dependency caching | `pub get` and Gradle run fresh every time |
| No security scanning | No SCA, SAST, or secret scanning |
| Employee job duplicated | Copy-paste — should use matrix strategy |

---

### 5.2 deploy-backend.yml

**Triggers:** Push to `main` on `backend_server/**` + manual dispatch

**Steps:**
1. `google-github-actions/auth@v2` (GCP service account auth)
2. `setup-gcloud@v2`
3. `gcloud builds submit` (builds Docker image)
4. `gcloud run deploy` to `us-central1`
5. `gcloud run deploy` to `asia-south1`

**Issues:**
- No tests run before deploy
- No health check step after deploy
- No rollback strategy
- No staging environment (deploys directly to prod)

---

### 5.3 deploy-admin.yml

**Triggers:** Push to `main` on `Admin/web_app/admin-dashboard/**` + manual

**Steps:**
1. npm ci
2. npm run build
3. `FirebaseExtended/action-hosting-deploy@v0`

**Issues:**
- No `npm run lint` or type check
- No tests
- No dependency caching

---

### 5.4 deploy-landing.yml

**Triggers:** Push to `main` on `customer_landing/**` + manual

**Steps:**
1. `FirebaseExtended/action-hosting-deploy@v0` (static HTML, no build step)

**Issues:** Minimal — static site with no build requirements

---

### Critical CI/CD Gaps

| Missing | Priority | Reason |
|---------|----------|--------|
| Unit tests (`flutter test`) | CRITICAL | Tests exist but never run — no quality gate |
| Static analysis (`flutter analyze`) | HIGH | Linting unused — code quality unchecked |
| PR checks (`pull_request`) | HIGH | Merges can break main silently |
| Backend tests (Jest/Vitest) | HIGH | Zero backend test coverage |
| Integration/E2E tests | MEDIUM | No end-to-end flow validation |
| Security scanning (SCA) | MEDIUM | No dependency vulnerability check |
| Dependency caching | MEDIUM | ~3min saved per build |
| Code coverage | MEDIUM | No coverage enforcement |
| iOS builds | MEDIUM | Only Android — no iOS pipeline |
| Firebase App Distribution | LOW | No test build distribution |
| Slack notifications | LOW | No build failure alerts |
| Automated tagging/releases | LOW | No git tag or release creation |

---

## 6. RELEASE MANAGEMENT

| Type | Location | Format |
|------|----------|--------|
| Customer APK | release-apks/customer/ | .apk |
| Customer AAB | release-apks/customer/ | .aab |
| Customer Web | release_assets/Mobile-Customer/ | Web build |
| Employee APK | release-apks/employee/ | .apk |
| Employee AAB | release-apks/employee/ | .aab |
| Employee Web | release_assets/Mobile-Employee/ | Web build |

---

## 7. DOCKER DEPLOYMENT

### Dockerfile
- Node.js 18 Alpine base
- Copies package.json, npm ci --only=production
- Copies dist/ directory
- Exposes port 8080
- CMD: node dist/index.js

### Target: Google Cloud Run
- Port: 8080
- Environment: cloudrun.env (gitignored)

### Not Configured
- No docker-compose.yml
- No Cloud Build config
- No Cloud Run service YAML

---

## 8. FIREBASE HOSTING

| Site | Target | Public Dir |
|------|--------|------------|
| Admin Dashboard | admin-dashboard | Admin/web_app/admin-dashboard/dist |
| Customer Landing | customer-landing | customer_landing |

### Not Configured
- No custom domain configured
- No SSL enforcement
- No CDN caching rules

---

## 9. PLAY STORE UPLOAD

### Scripts
- play_upload/ directory with Play Store upload automation
- Service account: play_upload/service-account.json (gitignored)

### Assets
- safecom-release.keystore (gitignored)
- keystore/ directory with signing keys

### Not Configured
- No automated Play Store publish in CI
- No in-app updates mechanism
- No beta/staged rollout config

---

## 10. BLOCK DIAGRAMS

### Build and Release Pipeline
`
Developer Push (main) -> GitHub Actions -> Build APK/AAB -> Artifacts -> (Manual) Play Store
`

### Local Development Setup
`
npm install -> Firebase emulators -> Run backend -> Flutter run / npm run dev / open landing
`

### Seed Data Flow
`
seed-core-data -> seed-catalog-collections -> seed-installation-nested -> seed-sdui-layouts
`

---

## 11. KNOWN ISSUES AND FIXES REQUIRED

### Issue 1: No Automated Tests
- Zero test coverage across entire project
- Fix: Jest for backend, Flutter test for mobile, Vitest for admin

### Issue 2: No CI for Backend/Admin
- CI only builds mobile APKs
- Fix: Add workflow for backend Docker build + Cloud Run deploy

### Issue 3: Seed Scripts Out of Sync
- Multiple scripts reference old schema
- Fix: Consolidate to single versioned seed script

### Issue 4: No Linting in CI
- ESLint/TSLint not run in CI
- Fix: Add lint step to all workflows

### Issue 5: Build Script Platform Dependent
- build_all.ps1 is Windows-only PowerShell
- Fix: Add equivalent shell script for Linux/macOS

### Issue 6: AAB Path Mismatch in CI
- GitHub Actions has outdated AAB output path
- Location: .github/workflows/build-mobile.yml
- Fix: Update artifact path to match current Flutter output

### Issue 7: No Versioning Strategy
- No semantic versioning for releases
- Fix: Version bump script + git tag workflow

### Issue 8: Firebase Hosting Deploy Manual
- Admin and landing page require manual deploy
- Fix: Add firebase deploy step to CI

---

**END OF AUDIT**