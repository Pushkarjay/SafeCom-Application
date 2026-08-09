# High-Level Architecture Overview

## System Summary

SafeCom is a comprehensive CCTV installation and maintenance service platform that consists of four major components:

1. **Customer Mobile App** (Flutter 1.3.9+38) - Self-service booking, service discovery, payment, and tracking
2. **Employee Mobile App** (Flutter 1.1.3+29) - Job management, earnings tracking, location services
3. **Admin Web Dashboard** (React + Vite) - Service catalog management, job orchestration, analytics
4. **Backend Server** (Express + TypeScript) - REST API, business logic, Firebase integration

Plus a **static Customer Landing** site (marketing + legal/Play-Store policy pages).

> 📌 **Audit update 2026-08-09** — see the appendices at the end of this document and
> the **[Audit Delta](../AUDIT_DELTA_2026_05_09_to_2026_08_09.md)** for what changed
> since the original 2026-05-09 snapshot.

## Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FIREBASE PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Firebase Auth        │  Firestore DB        │  Firebase Cloud Storage   │
│  ─────────────────    │  ─────────────────    │  ─────────────────────    │
│  - Customer Auth      │  - Collections        │  - Invoice PDFs           │
│  - Employee Auth      │  - Real-time sync     │  - Profile Images         │
│  - Admin Auth         │  - Offline support    │  - Service Images         │
└───────────────────────┴───────────────────────┴────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND SERVER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript (Port: 3000 / Deployed on Cloud Run)      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ROUTES LAYER (25 route files)                                       │   │
│  │  ├── /api/auth           - Authentication                            │   │
│  │  ├── /api/catalog-public - Public service catalog & pricing          │   │
│  │  ├── /api/sdui           - Server-driven UI layouts (public)         │   │
│  │  ├── /api/home-cms       - Home page CMS (public read)               │   │
│  │  ├── /api/serviceability - Serviceable-area check + CRUD (public)    │   │
│  │  ├── /api/customers      - Customer management + addresses           │   │
│  │  ├── /api/users          - Customer lookup (/me, by-phone, by-email) │   │
│  │  ├── /api/employees      - Employee operations + device tokens       │   │
│  │  ├── /api/jobs           - Job lifecycle (pickup, complete, patch)   │   │
│  │  ├── /api/bookings       - Booking management + job creation         │   │
│  │  ├── /api/payments       - Payment records + razorpay order/verify   │   │
│  │  ├── /api/technicians    - Technician management + passwords         │   │
│  │  ├── /api/dashboard      - Analytics & metrics                       │   │
│  │  ├── /api/catalog/*      - products, services, accessories,          │   │
│  │  │                          maintenance-plans, recommendations       │   │
│  │  ├── /api/catalog/services-admin      - Dynamic service tree builder │   │
│  │  ├── /api/catalog/installation-admin  - Installation tree builder    │   │
│  │  └── /api/catalog/sdui-admin          - SDUI layouts + feature flags │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  MIDDLEWARE LAYER (2 auth paths)                                    │   │
│  │  ├── firebaseAuth.ts   - verifyFirebaseIdToken (mobile clients)     │   │
│  │  └── auth.ts           - authenticateToken + requireRole (admin JWT)│   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  SERVICES LAYER (8 services)                                        │   │
│  │  ├── firestore.ts      - Database abstraction (custom DB id)        │   │
│  │  ├── notificationService.ts - Push notifications (FCM)             │   │
│  │  ├── catalogService.ts - Service catalog business logic            │   │
│  │  ├── userService.ts    - User management                           │   │
│  │  ├── employeeService.ts - Employee operations                      │   │
│  │  ├── earningsService.ts - Employee earnings                         │   │
│  │  ├── razorpay.ts       - Payment gateway integration               │   │
│  │  └── sduiService.ts    - Dynamic UI layouts                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   CUSTOMER      │   │   EMPLOYEE      │   │    ADMIN        │
│   MOBILE APP   │   │   MOBILE APP    │   │    WEB APP      │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ Flutter/Dart    │   │ Flutter/Dart   │   │ React/Vite/TS   │
│                 │   │                 │   │                 │
│ Features:       │   │ Features:       │   │ Features:       │
│ - Guest browse  │   │ - Auth          │   │ - Dashboard     │
│ - Home/SDUI     │   │ - Job Board     │   │ - Jobs          │
│ - Dynamic Svc   │   │ - Job Detail    │   │ - Customers     │
│ - Cart + Msg    │   │ - Work Complete │   │ - Technicians   │
│ - Booking       │   │ - Earnings      │   │ - Svc Tree Bldr │
│ - Payment       │   │ - Map/Location  │   │ - Mobile Prev   │
│ - Profile       │   │ - FCM Notifs    │   │ - Payments      │
│ - Invoices      │   │ - Dark Mode     │   │ - Serviceability│
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Communication Patterns

### Synchronous (REST API)
- All client-server communication uses HTTP REST
- JSON payload format
- Firebase ID token in Authorization header (Bearer token)

### Asynchronous (Real-time)
- Firestore snapshots for data sync
- No WebSocket infrastructure (potential enhancement)
- Push notifications via FCM (Firebase Cloud Messaging)

## Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Customer App | Flutter | 3.x |
| Employee App | Flutter | 3.x |
| Admin Web | React + Vite | 18.x |
| Backend | Express.js + TypeScript | 5.x / 5.x |
| Database | Firestore (NoSQL) | - |
| Auth | Firebase Auth | - |
| Storage | Firebase Cloud Storage | - |
| Notifications | Firebase Cloud Messaging | - |
| Payment Gateway | Razorpay | API v2 |
| Backend Hosting | Google Cloud Run (dual-region) | asia-south1 + us-central1 |
| Frontend Hosting | Firebase Hosting | Admin Web + Landing |
| Mobile Distribution | Google Play Store | internal / alpha / beta / production |

## Service Catalog Architecture

The system uses a **hierarchical service structure** stored in Firestore:

```
Services Collection
├── Installation
│   ├── Wi-Fi Camera → Products → Options
│   ├── DVR → Setups (4/8/16/32 cam) → Products → Options
│   └── IP Camera → ...
├── AMC (Annual Maintenance Contract)
│   ├── 4 Camera Setup
│   ├── 8 Camera Setup
│   └── ...
├── Repair
│   ├── No Video Output
│   ├── Night Vision Issues
│   └── ...
├── Upgrade
│   ├── 2MP to 5MP
│   ├── NVR + Storage
│   └── ...
└── Accessories
```

Each service references products from the `catalog_product` collection via Firestore document references.

## Security Model

1. **Authentication**: Firebase Auth (multiple providers: Phone, Email)
2. **Authorization**:
   - Role-based: `admin`, `employee`, `customer`
   - Backend middleware validates Firebase ID token
   - Admin routes require role check against Firestore `admins` collection
3. **API Security**:
   - CORS configured with allowed origins
   - Helmet.js for HTTP headers
   - Rate limiting not implemented (risk)
4. **Data Security**:
   - Firestore security rules (not reviewed)
   - Service account for backend operations

## Deployment Architecture

- **Backend**: Deployed on Google Cloud Run (inferred from firebase.json)
- **Static Hosting**: Firebase Hosting for Admin Web
- **Mobile Apps**: Firebase App Distribution / Play Store

## Key Observations

### Strengths
1. Clear separation of concerns between apps
2. Centralized Firestore for real-time data sync
3. SDUI pattern for dynamic service catalog
4. Strong typing in backend (TypeScript + Zod)

### Architectural Risks
1. Monolithic backend - single point of failure
2. No API gateway / rate limiting
3. In-memory filtering for complex queries (jobs route)
4. No WebSocket for real-time updates
5. Duplicate business logic between mobile apps

## Confidence Level

**High** - Architecture inferred from 80+ source files with consistent patterns across all components.

---

## Appendix A — Audit Update (2026-08-09)

### What changed since the original 2026-05-09 snapshot

1. **Guest-First architecture** — the customer app now only requires login for
   payment, confirmation, profile, order history, and booking detail. Browsing,
   estimates, scheduling, and recommendations are public. Phone collection and
   optional email were added to the auth flow.
2. **Dynamic service tree** — services are fully dynamic (admin-built tree:
   categories → setups → products → options → branches/clubs, with a
   quantity/dependency engine). The customer app renders any service through the
   `DynamicServiceScreen`; `installationAdmin`, `servicesAdmin`, `sduiAdmin`
   route families power the builders.
3. **Backend growth** — 17 → **25 route files**; added `addresses`, `homeCms`,
   `installationAdmin`, `maintenance-plans`, `products`, `razorpay`,
   `recommendations`, `sduiAdmin`, `serviceability`, `servicesAdmin`, `users`,
   `accessories`; dual auth middleware (Firebase ID tokens for mobile, admin JWT
   + `requireRole` for the dashboard).
4. **Deployment** — backend now deployed to **two Cloud Run regions**
   (asia-south1 + us-central1); all deploys automated via GitHub Actions
   (8 workflows), including Play Store multi-track rollout with auto version
   bump and track promotion.
5. **Data layer** — custom Firestore DB `safecom-database-nosql`; new collections
   `catalog_maintenance_plans`, `sdui_feature_flags`, `serviceable_areas`,
   `home_cms`, `booking_counters`, `users`.
6. **Payments** — Razorpay signature now required at verify; booking advance
   (`amountPaid`) recorded; min ₹100 charge.
7. **Messaging** — customer's custom message travels cart → booking → job →
   employee app → admin dashboard (`invoice.customTextBox`).
8. **Privacy** — Android auto-backup disabled on both apps (`allowBackup=false`,
   guard-tested) so uninstall clears user data.
9. **UI/UX** — customer app light premium theme (warm amber `#D4760A` + slate
   `#0F172A`), employee app gained dark mode + FCM notifications, admin dashboard
   redesigned (dark command-center, dual-phone mobile preview, service tree
   builder, serviceable areas, invoice PDF). See **[21_UI_UX](../21_UI_UX/README.md)**.
10. **Employee app** — photo capture/gallery feature removed.

Full record: **[Audit Delta](../AUDIT_DELTA_2026_05_09_to_2026_08_09.md)**.