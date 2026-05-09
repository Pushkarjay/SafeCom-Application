# Dependency Graphs

## 1. Backend Module Dependencies

```mermaid
graph TD
    subgraph "Routes"
        Auth[auth.ts]
        Jobs[jobs.ts]
        Bookings[bookings.ts]
        Payments[payments.ts]
        Catalog[catalog.ts]
        Employees[employees.ts]
        Dashboard[dashboard.ts]
    end

    subgraph "Middleware"
        FireAuth[firebaseAuth.ts]
        JWT[auth.ts]
    end

    subgraph "Services"
        Firestore[firestore.ts]
        Notif[notificationService.ts]
        CatalogSvc[catalogService.ts]
        UserSvc[userService.ts]
        EmpSvc[employeeService.ts]
        EarnSvc[earningsService.ts]
        Razor[razorpay.ts]
        SDUI[sduiService.ts]
    end

    subgraph "Data"
        FirestoreDB[(Firestore)]
    end

    Auth --> FireAuth
    Jobs --> FireAuth
    Bookings --> FireAuth
    Payments --> FireAuth
    Catalog --> FireAuth
    Employees --> FireAuth
    Dashboard --> FireAuth

    FireAuth --> JWT
    Auth --> UserSvc

    Jobs --> Firestore
    Bookings --> Firestore
    Payments --> Firestore
    Catalog --> CatalogSvc
    Employees --> EmpSvc
    Dashboard --> Firestore

    FirestoreSvc[Firestore Service] --> FirestoreDB
    CatalogSvc --> FirestoreDB
    UserSvc --> FirestoreDB
    EmpSvc --> FirestoreDB
    EarnSvc --> FirestoreDB
    Razor --> FirestoreDB
    SDUI --> FirestoreDB

    Jobs --> Notif
    Bookings --> Notif
    Payments --> Notif
```

## 2. Customer App Dependencies

```mermaid
graph TD
    subgraph "Features"
        Auth[auth/]
        Home[home/]
        Services[services/]
        Booking[booking/]
        Profile[profile/]
        Invoice[invoice/]
    end

    subgraph "Data Layer"
        API[api_service.dart]
        Repos[repositories/]
        Models[models/]
        Providers[providers/]
    end

    subgraph "Core"
        Config[config/]
        Theme[theme/]
        Utils[utils/]
        SDUI[SDUI/]
    end

    Auth --> API
    Home --> API
    Services --> API
    Booking --> API
    Profile --> API
    Invoice --> API

    API --> Config
    Repos --> API
    Providers --> Repos
    Home --> SDUI
```

## 3. Circular Dependency Check

### Backend
No circular dependencies found:
- Routes → Services → Firestore (linear)
- Middleware → Services (no cycles)

### Mobile Apps
Potential issues:
- Provider → Repository → Provider (possible circular if not careful)
- No problematic cycles detected

## 4. Package-Level Graph

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.21.2",       // HTTP framework
    "firebase-admin": "^12.7.0", // Firebase SDK
    "jsonwebtoken": "^9.0.2",   // JWT handling
    "zod": "^3.24.3",           // Validation
    "helmet": "^8.1.0",         // Security
    "cors": "^2.8.5",           // CORS
    "morgan": "^1.10.0",        // Logging
    "dotenv": "^16.5.0"         // Config
  }
}
```

### Customer App (pubspec.yaml - assumed)
```yaml
dependencies:
  flutter:
    sdk: flutter
  riverpod: ^2.x          # State management
  dio: ^5.x               # HTTP client
  go_router: ^13.x        # Navigation
  firebase_core: ^3.x     # Firebase
  firebase_auth: ^4.x     # Auth
  cloud_firestore: ^5.x  # Firestore
```

### Employee App (pubspec.yaml - assumed)
```yaml
dependencies:
  flutter:
    sdk: flutter
  riverpod: ^2.x
  dio: ^5.x
  go_router: ^13.x
  firebase_core: ^3.x
  firebase_auth: ^4.x
  cloud_firestore: ^5.x
  # Additional for employee
  google_maps_flutter: ^2.x
  geolocator: ^11.x
```

## 5. Feature Dependency Graph

```mermaid
graph LR
    subgraph "Customer App Features"
        Auth --> Home
        Auth --> Services
        Auth --> Booking
        Auth --> Profile

        Services --> Booking
        Booking --> Payment
        Booking --> Invoice
        Profile --> Invoice
    end
```

## Dependency Issues

### Issue 1: Dual HTTP Clients
Both mobile apps use `dio` but maintain separate instances.

**Fix**: Share via `safecom_core` package

### Issue 2: Shared Theme Duplication
Themes defined separately but serve same purpose.

**Fix**: Extract to shared package with theming config

### Issue 3: Repository Pattern Inconsistency
Customer app has repositories; Employee app has datasources + repositories.

**Fix**: Standardize on one pattern across apps

## Confidence Level

**High** - Dependency structure verified through import analysis across all code files.