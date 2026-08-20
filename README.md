# SafeCom CCTV Service Platform

A comprehensive CCTV installation, maintenance, and repair service platform with customer, employee, and admin applications.

## Platform Components

| App | Technology | Status | Description |
|-----|-----------|--------|-------------|
| **Customer Mobile** | Flutter + Riverpod | ✅ Active (v1.3.9) | Booking, payment, invoice, service discovery |
| **Employee Mobile** | Flutter + Riverpod | ✅ Active (v1.1.1) | Job management, map nav, photo capture, earnings |
| **Admin Dashboard** | React + TypeScript + Vite | ✅ Active | Full CRUD, service tree builder, CMS, analytics |
| **Backend API** | Express + TypeScript | ✅ Active | Dual-region Cloud Run (us-central1 + asia-south1) |

## Quick Links

- **Admin Dashboard:** https://safecom-application-01.web.app
- **Backend API (us-central1):** https://safecom-backend-177425757120.us-central1.run.app
- **Backend API (asia-south1):** https://safecom-backend-177425757120.asia-south1.run.app
- **Firestore DB:** safecom-database-nosql
- **CI/CD:** GitHub Actions (build + deploy pipelines)

## Tech Stack

### Mobile (Customer `mobile_customer/` · Employee `mobile_employee/`)
- **Flutter 3.x / Dart** ^3.11.5 · **Riverpod** ^2.6.1 (state) · **GoRouter** ^14.8.1 (routing) · **Dio** ^5.8.0 (HTTP)
- **Google Maps** (`google_maps_flutter`, `geolocator`, `geocoding`) · **Razorpay** (`razorpay_flutter`, customer only)
- **Firebase SDK** (`firebase_core`, `firebase_auth`, `google_sign_in`, `firebase_messaging` for employee)
- **Shared**: `shared_preferences`, `url_launcher`, `intl` · Linting via `flutter_lints`

### Admin Web (`Admin/web_app/admin-dashboard/`)
- **React 18** · **TypeScript 5** · **Vite 5** · **Zustand 4** (state) · **React Router 6**
- **Axios** (HTTP) · **Recharts** (analytics) · **date-fns** · **Firebase JS SDK 12**
- Linting via ESLint + `@typescript-eslint`

### Backend (`backend_server/`)
- **Node.js 22** · **Express 4** · **TypeScript 5** (`tsx` dev runner) · **Zod 3** (validation)
- **Firebase Admin SDK 12** · **JWT** (auth) · **Razorpay** integration
- **Helmet / CORS / Morgan / dotenv** · Modules: 25 routes · 8 services · 2 middleware
- Containerized via **Docker** (`node:22-alpine`)

### Customer Landing (`customer_landing/`)
- Static **HTML/CSS/JS** (vanilla) — marketing + legal/Play-Store pages

### Infrastructure & DevOps
- **Firebase**: Auth, Firestore (`safecom-database-nosql`), Cloud Storage, FCM, Hosting
- **Cloud Run** dual-region (`us-central1` + `asia-south1`) · **GCR**
- **Google Play Store** (internal/alpha/beta/production) · **Google Maps Platform**
- **GitHub Actions**: build, lint/test, deploy backend/admin/landing, Play Store rollout

For a full per-package inventory with versions, see **[Architecture/TECH_STACK.md](./Architecture/TECH_STACK.md)**.

## Documentation

- `docs/` — SRS documents for all platform components
- `planning_and_progress/` — Progress logs, roadmaps, audits, status reports
- `Architecture/` — 20-section architecture documentation with diagrams
- `database-architecture/` — Database schemas and ERD

