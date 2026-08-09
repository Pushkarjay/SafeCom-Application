# Data Flow Diagrams

## 1. Service Discovery Data Flow

```mermaid
flowchart LR
    subgraph "Mobile Customer App"
        Home[Home Screen]
        Provider[ServiceCatalogRepository]
        SDUI[SDUI Provider]
    end

    subgraph "Backend"
        API["/api/catalog-public"]
        Resolver[Product Resolver]
    end

    subgraph "Firestore"
        Services[Services Collection]
        Products[catalog_product Collection]
    end

    Home --> Provider
    Provider --> API
    API --> Services
    API --> Resolver
    Resolver --> Products
    Products --> Resolver
    Resolver --> API
    API --> Provider
    Provider --> SDUI
```

## 2. Booking Data Flow

```mermaid
flowchart TB
    subgraph "Input"
        Cart[Cart Provider]
        Form[Booking Form]
    end

    subgraph "Processing"
        API[Booking API]
        Validator[Zod Validator]
        Creator[Booking Creator]
    end

    subgraph "Storage"
        BookingDB[bookings]
        JobDB[jobs]
        CustomerDB[customers]
    end

    subgraph "Output"
        Notif[Notification Service]
        Pay[Payment Service]
    end

    Cart --> Form
    Form --> API
    API --> Validator
    Validator --> Creator
    Creator --> BookingDB
    Creator --> JobDB
    Creator --> CustomerDB
    Creator --> Notif
    BookingDB --> Pay
```

## 3. Payment Data Flow

```mermaid
flowchart LR
    subgraph "Customer"
        Cart[Cart]
        Payment[Payment Screen]
        Razor[Razorpay SDK]
    end

    subgraph "Backend"
        Order[Create Order]
        Verify[Verify Payment]
        Update[Update Status]
    end

    subgraph "External"
        RazorAPI[Razorpay API]
    end

    subgraph "Internal"
        PayDB[payments collection]
        JobDB[jobs collection]
    end

    Cart --> Payment
    Payment --> Order
    Order --> RazorAPI
    RazorAPI --> Order
    Order --> Razor
    Razor --> Payment
    Payment --> Verify
    Verify --> RazorAPI
    RazorAPI --> Verify
    Verify --> Update
    Update --> PayDB
    Update --> JobDB
```

## 4. Employee Job Data Flow

```mermaid
flowchart TB
    subgraph "Employee App"
        List[Jobs List]
        Detail[Job Detail]
        Complete[Work Completion]
    end

    subgraph "Backend"
        Fetch[Get Jobs]
        Pickup[Pick Up Job]
        CompleteAPI[Complete Job]
    end

    subgraph "Firestore"
        JobsColl[jobs collection]
        BookingsColl[bookings collection]
    end

    List --> Fetch
    Fetch --> JobsColl
    JobsColl --> Fetch
    Fetch --> List

    Detail --> Pickup
    Pickup --> JobsColl
    Pickup --> BookingsColl
    JobsColl --> Pickup
    Pickup --> Detail

    Complete --> CompleteAPI
    CompleteAPI --> JobsColl
    CompleteAPI --> BookingsColl
    JobsColl --> CompleteAPI
```

## 5. Admin Analytics Data Flow

```mermaid
flowchart LR
    subgraph "Admin Dashboard"
        Load[Load Dashboard]
        Display[Display Metrics]
    end

    subgraph "Backend"
        Metrics[Dashboard Endpoint]
        Aggregator[Data Aggregator]
    end

    subgraph "Firestore"
        Jobs[jobs]
        Customers[customers]
        Employees[employees]
        Payments[payments]
    end

    Load --> Metrics
    Metrics --> Aggregator
    Aggregator --> Jobs
    Aggregator --> Customers
    Aggregator --> Employees
    Aggregator --> Payments
    Jobs --> Aggregator
    Customers --> Aggregator
    Employees --> Aggregator
    Payments --> Aggregator
    Aggregator --> Metrics
    Metrics --> Display
```

## Data Transformation Points

| Flow | Transform | Location |
|------|-----------|----------|
| Service Discovery | Firestore refs → Product objects | `backend_server/src/services/catalogService.ts` |
| Booking Creation | Input DTO → Firestore doc | `backend_server/src/routes/bookings.ts` |
| Job Completion | Input → Job + Invoice | `backend_server/src/routes/jobs.ts:complete` |
| Payment Verification | Razorpay response → DB update | `backend_server/src/routes/razorpay.ts` |

## Confidence Level

**High** - Data flows verified through code inspection of repositories, services, and API endpoints.