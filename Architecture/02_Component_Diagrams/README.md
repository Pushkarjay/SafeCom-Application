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
            Earnings[features/earnings/]
            Profile[features/profile/]
        end

        subgraph "Core Services"
            Notif[core/services/notification_service.dart]
            Theme[core/theme/app_theme.dart + theme_provider]
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
    Earnings --> API
    Notif --> API
    Router --> Routes
```

> **Audit 2026-08-09**: `features/photos/` (photo capture + gallery) was removed;
> `core/services/notification_service.dart` (FCM) and `theme_provider.dart`
> (light/dark) were added.

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
            Settings[features/settings/]
            MobilePreview[features/mobile_preview/]
            Styles[features/styles/]
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
        Settings --> DS
        MobilePreview --> DS
        Layout --> Hooks
```

> **Audit 2026-08-09**: added `features/settings/` (serviceable areas),
> `features/mobile_preview/` (dual-phone SDUI preview), `features/styles/`;
> catalog consolidated (products/accessories/maintenance-plans merged into the
> catalog module, deduped).

## 4. Backend Component Interactions

```mermaid
flowchart LR
    subgraph "Routes (25 route files)"
        AuthR[auth.ts]
        JobR[jobs.ts]
        BookingR[bookings.ts]
        PayR[payments.ts · razorpay.ts]
        CatR[catalog.ts · products · services · accessories · maintenance-plans · recommendations]
        EmpR[employees.ts · technicians.ts]
        DashR[dashboard.ts]
        SDUIR[sdui.ts · sduiAdmin.ts]
        SvcAdminR[servicesAdmin.ts · installationAdmin.ts]
        CustR[customers.ts · addresses.ts · users.ts]
        SvcR[serviceability.ts · homeCms.ts]
    end

    subgraph "Middleware"
        FireAuth[firebaseAuth.ts]
        JWT[auth.ts + requireRole]
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
        FS[(Firestore: safecom-database-nosql)]
        FBA[(Firebase Auth)]
        RZ[(Razorpay)]
    end

    AuthR --> FireAuth
    JobR --> FireAuth
    BookingR --> FireAuth
    PayR --> FireAuth
    CatR --> JWT
    EmpR --> FireAuth
    DashR --> JWT
    SDUIR --> FireAuth
    SvcAdminR --> JWT
    CustR --> FireAuth
    SvcR --> FireAuth

    Firestore --> FS
    Notif --> FS
    User --> FS
    Emp --> FS
    Catalog --> FS
    SDUI --> FS
    Notif --> FBA
    Razor --> RZ
```

> **Audit 2026-08-09**: routes grew 17 → 25; auth is tiered (Firebase ID tokens
> for mobile via `verifyFirebaseIdToken`, admin JWT + `requireRole` for
> management routes); Razorpay moved to its own route module with signature
> verification; Firestore uses the custom DB `safecom-database-nosql`.

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

---

## Audit Update (2026-08-09)

1. Customer app: SDUI engine extended (promo banner `hideWhenServiceable`,
   component registry, feature flags); `features/cart/`, `features/info/`,
   `features/splash/`, `features/navigation/` modules added; guest-first auth.
2. Employee app: `features/photos/` removed; notification service + theme
   provider added.
3. Admin web: catalog consolidated; settings/mobile-preview/styles modules added.
4. Backend: see §4 diagram above (25 route files, tiered auth, Razorpay module).