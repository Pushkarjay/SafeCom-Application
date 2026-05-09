# Sequence Diagrams

## 1. Customer Booking Flow

```mermaid
sequenceDiagram
    participant Customer as Customer App
    participant API as Backend
    participant Firestore as Firestore DB
    participant FCM as Firebase Cloud Messaging

    Customer->>API: POST /api/bookings (service details)
    API->>Firestore: Create booking document
    API->>Firestore: Create job document
    API->>FCM: Send notification to employees
    Firestore-->>API: Confirm write
    API-->>Customer: Booking created (bookingId)

    Note over Customer: User proceeds to payment
    Customer->>API: POST /api/payments/razorpay/create-order
    API->>Firestore: Create pending payment
    API-->>Customer: Razorpay order details

    Customer->>Razorpay: Complete payment
    Razorpay-->>Customer: Payment success

    Customer->>API: POST /api/payments/razorpay/verify
    API->>Razorpay: Verify signature
    API->>Firestore: Update payment status to 'completed'
    API->>Firestore: Update booking status to 'confirmed'
    API->>FCM: Notify customer of confirmation
    API-->>Customer: Payment verified
```

## 2. Employee Job Completion Flow

```mermaid
sequenceDiagram
    participant Employee as Employee App
    participant API as Backend
    participant Firestore as Firestore DB
    participant FCM as Firebase Cloud Messaging
    participant Storage as Cloud Storage

    Employee->>API: POST /api/jobs/:id/pickup (employeeId)
    API->>Firestore: Update job status to 'assigned'
    API->>Firestore: Update booking assignedEmployeeId
    API->>FCM: Notify customer of assignment
    API-->>Employee: Job assigned

    Note over Employee: Employee performs work

    Employee->>API: POST /api/photos/upload (jobId, image)
    API->>Storage: Upload to Cloud Storage
    Storage-->>API: Download URL
    API->>Firestore: Store photo reference
    API-->>Employee: Photo uploaded

    Note over Employee: Work complete
    Employee->>API: POST /api/jobs/:id/complete
    Employee->>API: Body: {notes, actualAmount, collectedAmount}
    API->>Firestore: Update job status to 'completed'
    API->>Firestore: Set completionNotes, completedAt
    API->>Firestore: Generate invoice document
    API->>Firestore: Update booking status to 'completed'
    API->>FCM: Notify customer of completion
    API->>FCM: Notify admin of completion
    API-->>Employee: Job completed
```

## 3. Admin Service Catalog Update

```mermaid
sequenceDiagram
    participant Admin as Admin Web
    participant API as Backend
    participant Firestore as Firestore DB
    participant Cache as Redis (proposed)

    Admin->>API: POST /api/catalog/services-admin/config/:serviceId/category
    API->>Firestore: Update Services document (add category)
    Firestore-->>API: Confirm write
    API->>Cache: Invalidate catalog cache (if exists)
    API-->>Admin: Category created

    Note over Admin: Make service visible
    Admin->>API: PATCH /api/catalog/services-admin/config/:serviceId
    API->>Firestore: Update service status to 'active'
    API-->>Admin: Service activated

    Note over Customer: Next time customer loads catalog
    Customer->>API: GET /api/catalog-public/services
    API->>Cache: Check cache (miss)
    API->>Firestore: Query Services collection
    Firestore-->>API: Return service tree
    API->>Cache: Store in cache (5 min TTL)
    API-->>Customer: Updated catalog
```

## 4. Authentication Flow

```mermaid
sequenceDiagram
    participant User as User (Customer/Employee/Admin)
    participant Firebase as Firebase Auth
    participant App as Mobile/Web App
    participant Backend as Backend Server
    participant Firestore as Firestore DB

    User->>App: Request login
    App->>Firebase: Authenticate (phone/email/password)
    Firebase-->>App: Firebase ID Token

    App->>Backend: GET /api/resource (Bearer token)
    Backend->>Firebase: verifyIdToken(token)
    Firebase-->>Backend: Decoded claims {uid, email}

    Backend->>Firestore: Query user collection by firebaseUid
    alt User found with matching role
        Firestore-->>Backend: User profile
        Backend-->>App: Resource data
    else User not authorized
        Backend-->>App: 403 Forbidden
    end
```

## Confidence Level

**High** - Sequence diagrams based on verified API endpoint implementations and data flow patterns.