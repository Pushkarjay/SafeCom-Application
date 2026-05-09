# High-Level Architecture Overview

## System Summary

SafeCom is a comprehensive CCTV installation and maintenance service platform that consists of four major components:

1. **Customer Mobile App** (Flutter) - Self-service booking, service discovery, payment, and tracking
2. **Employee Mobile App** (Flutter) - Job management, earnings tracking, location services
3. **Admin Web Dashboard** (React + Vite) - Service catalog management, job orchestration, analytics
4. **Backend Server** (Express + TypeScript) - REST API, business logic, Firebase integration

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
│  │  ROUTES LAYER                                                       │   │
│  │  ├── /api/auth          - Authentication                            │   │
│  │  ├── /api/catalog-public - Public service catalog                   │   │
│  │  ├── /api/sdui          - Server-driven UI layouts                  │   │
│  │  ├── /api/customers     - Customer management                       │   │
│  │  ├── /api/employees    - Employee operations                        │   │
│  │  ├── /api/jobs          - Job lifecycle                             │   │
│  │  ├── /api/bookings     - Booking management                        │   │
│  │  ├── /api/payments     - Payment processing                         │   │
│  │  ├── /api/dashboard    - Analytics & metrics                        │   │
│  │  └── /api/catalog/*    - Service/Product/Accessory management       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  MIDDLEWARE LAYER                                                   │   │
│  │  ├── firebaseAuth.ts   - Firebase ID token verification             │   │
│  │  └── auth.ts            - JWT token generation/validation           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  SERVICES LAYER                                                     │   │
│  │  ├── firestore.ts      - Database abstraction                       │   │
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
│ - Auth          │   │ - Auth          │   │ - Dashboard     │
│ - Home/SDUI     │   │ - Job Board     │   │ - Jobs          │
│ - Services      │   │ - Job Detail    │   │ - Customers     │
│ - Booking       │   │ - Work Complete │   │ - Technicians   │
│ - Payment       │   │ - Earnings      │   │ - Catalog       │
│ - Profile       │   │ - Map/Location  │   │ - Payments      │
│ - Invoices      │   │ - Photo Upload │   │ - Services      │
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

**High** - Architecture inferred from 40+ source files with consistent patterns across all components.