# System Overview Diagram

```mermaid
flowchart TB
    subgraph "Client Layer"
        direction LR
        Customer[Customer App<br/>Flutter]:::mobile
        Employee[Employee App<br/>Flutter]:::mobile
        Admin[Admin Web<br/>React/Vite]:::web
    end

    subgraph "API Gateway Layer"
        Express[Express.js<br/>TypeScript]:::backend
    end

    subgraph "Firebase Platform"
        Auth[Firebase Auth]:::firebase
        Firestore[Firestore DB]:::firebase
        Storage[Cloud Storage]:::firebase
        FCM[Cloud Messaging]:::firebase
    end

    subgraph "Backend Services"
        direction TB
        S1[Auth Service]
        S2[Job Service]
        S3[Payment Service]
        S4[Catalog Service]
        S5[Notification Service]
        S6[SDUI Service]
    end

    Customer -->|HTTPS JSON| Express
    Employee -->|HTTPS JSON| Express
    Admin -->|HTTPS JSON| Express

    Express --> S1 & S2 & S3 & S4 & S5 & S6

    S1 & S2 --> Auth
    S2 & S3 & S4 & S6 --> Firestore
    S5 --> FCM
    S6 --> Storage

    classDef mobile fill:#4285F4,color:#fff
    classDef web fill:#34A853,color:#fff
    classDef backend fill:#EA4335,color:#fff
    classDef firebase fill:#FBBC04,color:#000
```

## Component Responsibilities

| Component | Responsibility | Key Files |
|-----------|---------------|-----------|
| Customer App | Service discovery, booking, payment | `mobile_customer/lib/features/*` |
| Employee App | Job management, earnings, location | `mobile_employee/lib/features/*` |
| Admin Web | Orchestration, catalog mgmt, analytics | `Admin/web_app/admin-dashboard/src/features/*` |
| Backend Server | API, business logic, Firebase integration | `backend_server/src/routes/*`, `backend_server/src/services/*` |

## Data Flow Summary

```
1. Customer selects service → SDUI fetches catalog from Firestore
2. Customer books service → POST /api/bookings
3. Backend creates Job + triggers notification
4. Employee picks up job → PATCH /api/jobs/:id
5. Employee completes work → POST /api/jobs/:id/complete
6. Admin views dashboard → GET /api/dashboard
```

## Environment Configuration

| Environment | Backend URL | Firebase Project |
|------------|-------------|------------------|
| Development | http://localhost:3000 | safecom-application-01 |
| Production | https://safecom-backend-*.cloudfunctions.net | safecom-application-01 |

## Confidence Level

**High** - Verified through code inspection of:
- `backend_server/src/app.ts` (route registration)
- `backend_server/src/middleware/firebaseAuth.ts` (auth flow)
- Mobile app API configuration files