# API Flow Analysis

## API Entry Points

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Admin login (Firebase token) |
| GET | `/api/catalog-public/*` | Service catalog (read-only) |
| GET | `/api/sdui/*` | UI layouts |
| GET | `/api/serviceability/*` | Location validation |

### Protected Endpoints (Firebase Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/dashboard/*` | Analytics & metrics |
| GET/POST | `/api/customers/*` | Customer management |
| GET/POST/PATCH | `/api/jobs/*` | Job lifecycle |
| GET/POST/PATCH | `/api/bookings/*` | Booking management |
| GET/POST | `/api/employees/*` | Employee operations |
| GET/POST | `/api/payments/*` | Payment processing |
| GET/POST | `/api/catalog/*` | Catalog management (admin) |

## Request Lifecycle

```mermaid
flowchart TB
    Client[Client App] -->|HTTP Request| CDN[CDN / Load Balancer]
    CDN -->|Forward| Express[Express.js Server]

    subgraph "Middleware Pipeline"
        Helmet[Helmet.js - Security Headers]
        CORS[CORS - Origin Validation]
        JSON[express.json() - Body Parser]
        Morgan[Morgan - Request Logging]
    end

    Express --> Helmet --> CORS --> JSON --> Morgan

    subgraph "Authentication"
        AuthM[firebaseAuth Middleware]
        Token[Verify Firebase ID Token]
        Claims[Extract UID + Claims]
    end

    Morgan --> AuthM --> Token --> Claims

    subgraph "Route Handler"
        Router[Route Matching]
        Controller[Controller Logic]
        Validation[Zod Validation]
        Service[Service Layer]
    end

    Claims --> Router --> Controller --> Validation --> Service

    subgraph "Data Layer"
        Firestore[Firestore Service]
        Query[Query Collection]
    end

    Service --> Firestore --> Query

    subgraph "Response"
        Transform[Response Transform]
        JSONResp[JSON Response]
    end

    Query --> Transform --> JSONResp --> Client
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Firebase
    participant Backend
    participant Firestore

    Note over Client: 1. User logs in with Firebase
    Client->>Firebase: Authenticate (phone/email)
    Firebase-->>Client: Firebase ID Token

    Note over Client: 2. Client calls API with token
    Client->>Backend: GET /api/resource (Authorization: Bearer <token>)

    Note over Backend: 3. Backend verifies token
    Backend->>Firebase: verifyIdToken(token)
    Firebase-->>Backend: Decoded claims (uid, email, role)

    Note over Backend: 4. Check authorization
    Backend->>Firestore: Query admins/employees by uid
    Firestore-->>Backend: User profile with role

    Note over Backend: 5. Return response
    Backend-->>Client: JSON response
```

## Catalog API Flow

```mermaid
flowchart LR
    subgraph "Customer Flow"
        C[Customer App] -->|1. GET /catalog-public/services| B[Backend]
        B -->|2. Query Services collection| F[Firestore]
        F -->|3. Return tree structure| B
        B -->|4. JSON with product refs| C
        C -->|5. Resolve product refs| F2[Firestore]
    end

    subgraph "Admin Flow"
        A[Admin Web] -->|POST /catalog/services-admin| B2[Backend]
        B2 -->|Update Services doc| F3[Firestore]
        F3 -->|Trigger onUpdate| C[Cloud Functions]
        C -->|Invalidate cache| Redis[(Cache)]
    end
```

## Job Management Flow

```mermaid
flowchart TB
    subgraph "Create Job Flow"
        C[Customer] -->|POST /bookings| B[Backend]
        B -->|1. Create booking| F[Firestore]
        B -->|2. Create job doc| F
        B -->|3. Notify employees| N[FCM]
    end

    subgraph "Job Assignment Flow"
        E[Employee] -->|POST /jobs/:id/pickup| B2[Backend]
        B2 -->|1. Verify job status| F2[Firestore]
        B2 -->|2. Update assignedTo| F2
        B2 -->|3. Update booking| F2
        B2 -->|4. Notify customer| N2[FCM]
    end

    subgraph "Job Completion Flow"
        E2[Employee] -->|POST /jobs/:id/complete| B3[Backend]
        B3 -->|1. Update job status| F3[Firestore]
        B3 -->|2. Generate invoice| F3
        B3 -->|3. Update booking| F3
        B3 -->|4. Notify all| N3[FCM]
    end
```

## Payment Flow (Razorpay Integration)

```mermaid
sequenceDiagram
    participant Customer
    participant Backend
    participant Razorpay
    participant Firestore

    Note over Customer,Backend: Create Order
    Customer->>Backend: POST /payments/razorpay/create-order
    Backend->>Razorpay: Create order (amount, currency)
    Razorpay-->>Backend: order_id
    Backend->>Firestore: Store pending payment
    Backend-->>Customer: order_id, payment details

    Note over Customer,Razorpay: Payment
    Customer->>Razorpay: Complete payment (razorpay_order_id, payment_id)
    Razorpay-->>Customer: Payment success

    Note over Customer,Backend: Verify Payment
    Customer->>Backend: POST /payments/razorpay/verify
    Backend->>Razorpay: Verify signature
    Razorpay-->>Backend: Valid
    Backend->>Firestore: Update payment status to 'completed'
    Backend-->>Customer: Success
```

## Middleware Flow

```mermaid
flowchart LR
    subgraph "verifyFirebaseIdToken Middleware"
        A[Request] -->|Authorization Header| B{Has Bearer Token?}
        B -->|No| C[401 Error]
        B -->|Yes| D[Extract Token]
        D -->|verifyIdToken| E[Firebase Auth]
        E -->|Valid| F[Attach firebaseUid]
        E -->|Invalid| G[401 Error]
        F --> H[Next Handler]
    end
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-05-09T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "timestamp": "2026-05-09T12:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2026-05-09T12:00:00.000Z"
}
```

## Confidence Level

**High** - Verified through:
- `backend_server/src/app.ts` (route registration)
- `backend_server/src/routes/*.ts` (handler implementations)
- `backend_server/src/middleware/firebaseAuth.ts` (auth flow)