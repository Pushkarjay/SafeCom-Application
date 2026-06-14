# SafeCom CCTV Service Platform

A comprehensive CCTV installation, maintenance, and repair service platform with customer, employee, and admin applications.

## Platform Components

| App | Technology | Status | Description |
|-----|-----------|--------|-------------|
| **Customer Mobile** | Flutter + Riverpod | ✅ Active (v1.3.6) | Booking, payment, invoice, service discovery |
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

- **Mobile:** Flutter 3.x, Riverpod, Dio, GoRouter, Firebase SDK
- **Admin Web:** React 18, TypeScript 5, Vite, Zustand, Axios, Recharts
- **Backend:** Node.js, Express, TypeScript, Firebase Admin SDK, Zod, Razorpay
- **Infrastructure:** Firebase Auth, Firestore, Cloud Storage, Cloud Run, Firebase Hosting, GitHub Actions

## Documentation

- `docs/` — SRS documents for all platform components
- `planning_and_progress/` — Progress logs, roadmaps, audits, status reports
- `Architecture/` — 20-section architecture documentation with diagrams
- `database-architecture/` — Database schemas and ERD

