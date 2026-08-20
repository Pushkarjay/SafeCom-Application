# SafeCom Technology Stack

A full inventory of the technologies, frameworks, libraries, and infrastructure used across the SafeCom CCTV Service Platform.

> 📌 Related docs: [MASTER_ARCHITECTURE_INDEX.md](./MASTER_ARCHITECTURE_INDEX.md) ·
> [01_High_Level_Architecture](./01_High_Level_Architecture/README.md) ·
> [AUDIT_DELTA_2026_05_09_to_2026_08_09.md](./AUDIT_DELTA_2026_05_09_to_2026_08_09.md)

---

## Overview

| Layer | Tech | Directory |
|-------|------|-----------|
| Customer Mobile App | Flutter + Riverpod | `mobile_customer/` |
| Employee Mobile App | Flutter + Riverpod | `mobile_employee/` |
| Admin Web Dashboard | React + TypeScript + Vite | `Admin/web_app/admin-dashboard/` |
| Admin Mobile App (planned) | Flutter + Riverpod | `Admin/mobile_app/` |
| Backend API | Node.js + Express + TypeScript | `backend_server/` |
| Customer Landing | Static HTML/CSS/JS | `customer_landing/` |
| Database | Firestore (NoSQL) | — |
| Infrastructure | Google Cloud Platform + Firebase | `.github/workflows/`, `firebase.json` |

---

## Customer Mobile App — `mobile_customer/`

Flutter app for service discovery, booking, and payments (v1.3.9+38).

| Category | Technology | Version |
|----------|-----------|---------|
| Language / SDK | Dart | ^3.11.5 |
| Framework | Flutter | 3.x (stable) |
| State management | `flutter_riverpod` | ^2.6.1 |
| Routing | `go_router` | ^14.8.1 |
| HTTP client | `dio` | ^5.8.0+1 |
| Maps & location | `google_maps_flutter`, `geolocator`, `geocoding` | ^2.6.1 / ^12.0.0 / ^3.0.0 |
| Payments | `razorpay_flutter` | ^1.3.7 |
| Firebase | `firebase_core`, `firebase_auth`, `google_sign_in` | ^2.32.0 / ^4.20.0 / ^6.2.1 |
| Local storage | `shared_preferences` | ^2.2.2 |
| Utils | `url_launcher`, `cupertino_icons` | ^6.3.1 / ^1.0.9 |
| Linting / testing | `flutter_lints`, `flutter_test` | ^6.0.0 / sdk |

## Employee Mobile App — `mobile_employee/`

Flutter app for job management, attendance, earnings, and navigation (v1.1.3+29).

| Category | Technology | Version |
|----------|-----------|---------|
| Language / SDK | Dart | ^3.11.5 |
| Framework | Flutter | 3.x (stable) |
| State management | `flutter_riverpod` | ^2.6.1 |
| Routing | `go_router` | ^14.8.1 |
| HTTP client | `dio` | ^5.8.0+1 |
| Maps & location | `google_maps_flutter`, `geolocator`, `geocoding` | ^2.6.1 / ^12.0.0 / ^3.0.0 |
| Firebase | `firebase_core`, `firebase_auth`, `firebase_messaging` | ^2.32.0 / ^4.20.0 / ^14.9.4 |
| Utils | `url_launcher`, `intl`, `cupertino_icons` | ^6.3.0 / ^0.20.2 / ^1.0.8 |
| Linting / testing | `flutter_lints`, `flutter_test` | ^6.0.0 / sdk |

## Admin Web Dashboard — `Admin/web_app/admin-dashboard/`

React SPA for admin CRUD, service-tree builder, CMS, and analytics.

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React / React DOM | ^18.2.0 |
| Language | TypeScript | ^5.2.2 |
| Build tool | Vite (`@vitejs/plugin-react`) | ^5.0.8 / ^4.2.1 |
| State management | Zustand | ^4.4.1 |
| Routing | React Router DOM | ^6.20.0 |
| HTTP client | Axios | ^1.6.5 |
| Charts | Recharts | ^2.10.3 |
| Dates | date-fns | ^2.30.0 |
| Firebase (client) | firebase | ^12.12.1 |
| Linting | ESLint, `@typescript-eslint`, `eslint-plugin-react-hooks` | ^8.55.0 / ^6.14.0 / ^4.6.0 |

## Backend API — `backend_server/`

REST API deployed on Cloud Run, dual-region.

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 22 (Docker `node:22-alpine`) |
| Framework | Express | ^4.21.2 |
| Language | TypeScript (ESM, `tsx` dev runner) | ^5.8.3 / ^4.20.3 |
| Firebase | `firebase-admin` | ^12.7.0 |
| Validation | Zod | ^3.24.3 |
| Auth | JSON Web Token | ^9.0.2 |
| Payments | Razorpay (REST integration) | — |
| Security / logging | Helmet, CORS, Morgan, dotenv | ^8.1.0 / ^2.8.5 / ^1.10.0 / ^16.5.0 |
| Modules | 25 route files · 8 services · 2 middleware | — |

Key source layout (`backend_server/src/`):

- `routes/` — `auth`, `bookings`, `catalog`, `customers`, `employees`, `jobs`, `payments`, `razorpay`, `recommendations`, `sdui`, `services`, `products`, `homeCms`, `dashboard`, etc.
- `services/` — `catalogService`, `sduiService`, `razorpay`, `notificationService`, `earningsService`, `employeeService`, `userService`, `firestore`
- `contracts/` — `canonical_contracts`, `sdui_contracts`
- `middleware/` — `auth` (JWT), `firebaseAuth`

## Customer Landing — `customer_landing/`

Static marketing + legal pages (index, privacy policy, terms of service, refund policy, account deletion, data collection, contact). Hand-written HTML/CSS/JS with Google Fonts (Playfair Display + Plus Jakarta Sans), deployed to Firebase Hosting (`safecom-customer`).

## Infrastructure & DevOps

| Area | Technology |
|------|-----------|
| Cloud platform | Google Cloud Platform — project `safecom-application-01` |
| NoSQL database | Firestore — database `safecom-database-nosql` |
| Auth | Firebase Authentication (email/password + Google Sign-In) |
| File storage | Cloud Storage |
| Backend hosting | Cloud Run (`safecom-backend`) — dual-region `us-central1` + `asia-south1` |
| Container registry | Google Container Registry (GCR) |
| Web hosting | Firebase Hosting — sites `safecom-application-01` (admin) + `safecom-customer` (landing) |
| Push notifications | Firebase Cloud Messaging (employee app) |
| Payments gateway | Razorpay |
| Map / location services | Google Maps Platform (Maps SDK + Geolocation) |
| App distribution | Google Play Store (tracks: internal, alpha, beta, production) |
| Signing | JKS keystore (`safecom-release.keystore`) |
| CI/CD | GitHub Actions (see below) |

### GitHub Actions Workflows — `.github/workflows/`

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Quality gates: backend build, admin lint+build, Flutter analyze + test, Docker build |
| `build-mobile.yml` | Build APK/AAB for both Flutter apps, bump build numbers, upload to Play Store |
| `deploy-admin.yml` | Build admin dashboard → Firebase Hosting |
| `deploy-backend.yml` | Cloud Build → push image → deploy to Cloud Run (both regions) |
| `deploy-landing.yml` | Deploy customer landing → Firebase Hosting |
| `rollback-backend.yml` | Roll back a deployed backend image tag |
| `setup-play-listing.yml` / `diagnose-play-app.yml` | Play Store listing setup / diagnostics |
| `secret_scanning.yml` | GitHub secret scanning policy |

---

## Runtime & Version Notes

- Flutter SDK channel: stable, latest (pinned per-run by CI, cached for speed)
- Backend runtime pins `node:22-alpine`; CI uses Node 22 (backend) and Node 20 (admin build)
- Mobile min SDK / build config is managed via Gradle in each Flutter app
- Firebase config: `firebase.json` (hosting sites + rewrites), `firestore.rules`, `firestore.indexes.json`

*Last updated: 2026-08-20 — compiled from package manifests, pubspec files, Dockerfile, and CI workflow definitions.*