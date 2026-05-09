# Component Interaction Diagrams

## 1. Customer App Architecture

```mermaid
flowchart TB
    subgraph "Customer App - lib/"
        subgraph "Core Layer"
            Config[config/api_config.dart]
            Theme[theme/app_theme.dart]
            Utils[utils/error_handler.dart]
        end

        subgraph "Data Layer"
            API[api_service.dart]
            Repos[repositories/]
            Models[data/models/]
            Providers[data/providers/]
        end

        subgraph "Features Layer"
            Auth[features/auth/]
            Home[features/home/]
            Services[features/services/]
            Booking[features/booking/]
            Profile[features/profile/]
            Invoice[features/invoice/]
            Location[features/location/]
        end

        subgraph "SDUI Engine"
            SDUI[core/sdui/]
            Builders[sdui_builders.dart]
            Renderer[sdui_renderer.dart]
        end

        subgraph "Routing"
            Router[routes/app_router.dart]
            Routes[constants/app_routes.dart]
        end
    end

    API --> Config
    Repos --> API
    Repos --> Models
    Providers --> Repos
    Auth --> API
    Home --> SDUI
    Services --> Providers
    Booking --> Providers
    Profile --> Providers
    Router --> Routes
    Home --> Router
    Services --> Router
    Booking --> Router
    Profile --> Router
```

## 2. Employee App Architecture

```mermaid
flowchart TB
    subgraph "Employee App - lib/"
        subgraph "Core Layer"
            Config[config/api_config.dart]
            Theme[theme/app_theme.dart]
            Services[core/services/]
        end

        subgraph "Data Layer"
            API[datasources/api_service.dart]
            Repos[repositories/]
            Models[data/models/]
            Providers[data/providers/]
        end

        subgraph "Features Layer"
            Auth[features/auth/]
            Jobs[features/jobs/]
            Map[features/map/]
            Photos[features/photos/]
            Earnings[features/earnings/]
            Profile[features/profile/]
        end

        subgraph "Routing"
            Router[routes/app_router.dart]
            Routes[constants/app_routes.dart]
        end
    end

    API --> Config
    Repos --> API
    Repos --> Models
    Providers --> Repos
    Jobs --> API
    Jobs --> Providers
    Map --> Services
    Photos --> API
    Earnings --> API
    Router --> Routes
```

## 3. Admin Web Architecture

```mermaid
flowchart TB
    subgraph "Admin Web - src/"
        subgraph "Core Layer"
            Config[core/config/api.ts]
            Hooks[core/hooks/]
            Services[core/services/]
        end

        subgraph "Data Layer"
            DS[data/datasources/]
            Models[data/models/]
        end

        subgraph "Features Layer"
            Dashboard[features/dashboard/]
            Jobs[features/jobs/]
            Customers[features/customers/]
            Technicians[features/technicians/]
            Catalog[features/catalog/]
            Payments[features/payments/]
            Auth[features/auth/]
        end

        subgraph "Widgets"
            Layout[widgets/common/main_layout.tsx]
        end

        Config --> DS
        Hooks --> Services
        DS --> Models
        Dashboard --> Config
        Jobs --> DS
        Customers --> DS
        Technicians --> DS
        Catalog --> DS
        Payments --> DS
        Layout --> Hooks
```

## 4. Backend Component Interactions

```mermaid
flowchart LR
    subgraph "Routes (17 route files)"
        AuthR[auth.ts]
        JobR[jobs.ts]
        BookingR[bookings.ts]
        PayR[payments.ts]
        CatR[catalog.ts]
        EmpR[employees.ts]
        DashR[dashboard.ts]
        SDUIR[sdui.ts]
    end

    subgraph "Middleware"
        FireAuth[firebaseAuth.ts]
        JWT[auth.ts]
    end

    subgraph "Services"
        Firestore[firestore.ts]
        Notif[notificationService.ts]
        Catalog[catalogService.ts]
        User[userService.ts]
        Emp[employeeService.ts]
        Earn[earningsService.ts]
        Razor[razorpay.ts]
        SDUI[sduiService.ts]
    end

    subgraph "Data"
        FS[(Firestore)]
        FBA[(Firebase Auth)]
    end

    AuthR --> FireAuth
    JobR --> FireAuth
    BookingR --> FireAuth
    PayR --> FireAuth
    CatR --> FireAuth
    EmpR --> FireAuth
    DashR --> FireAuth
    SDUIR --> FireAuth

    FireAuth --> JWT
    JWT --> Firestore
    JobR --> Firestore
    BookingR --> Firestore
    PayR --> Firestore
    CatR --> Firestore

    Firestore --> FS
    Notif --> FS
    User --> FS
    Emp --> FS
    Catalog --> FS
    SDUI --> FS
    Notif --> FBA
```

## 5. Cross-Component Data Flow

```mermaid
sequenceDiagram
    participant C as Customer App
    participant E as Employee App
    participant A as Admin Web
    participant B as Backend
    participant F as Firestore
    participant N as FCM

    Note over C,B: 1. Customer books service
    C->>B: POST /api/bookings
    B->>F: Create booking + job
    B->>N: Send push to employees

    Note over E,B: 2. Employee accepts job
    E->>B: POST /api/jobs/:id/pickup
    B->>F: Update job status
    B->>N: Notify customer

    Note over A,B: 3. Admin manages catalog
    A->>B: POST /api/catalog/services-admin
    B->>F: Update service configuration
    F-->>C: Real-time catalog update

    Note over B,E: 4. Employee completes job
    E->>B: POST /api/jobs/:id/complete
    B->>F: Update job + invoice
    B->>N: Notify customer + admin

    Note over C,B: 5. Customer views invoice
    C->>B: GET /api/bookings/:id
    B->>F: Fetch booking + invoice
    F-->>C: Return invoice data
```

## Confidence Level

**High** - All component boundaries verified through file inspection and import statements across all applications.