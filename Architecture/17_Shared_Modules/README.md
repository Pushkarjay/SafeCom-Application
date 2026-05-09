# Shared Modules Analysis

## Current Shared State

### Mobile Apps - Code Duplication

Both customer and employee Flutter apps share similar patterns but have **duplicated code**:

| Component | Customer App | Employee App |
|-----------|--------------|--------------|
| API Service | `lib/data/datasources/api_service.dart` | `lib/data/datasources/api_service.dart` |
| Error Handler | `lib/core/utils/error_handler.dart` | Not present |
| Theme | `lib/core/theme/app_theme.dart` | `lib/core/theme/app_theme.dart` |
| API Config | `lib/core/config/api_config.dart` | `lib/core/config/api_config.dart` |
| Route Constants | `lib/core/constants/app_routes.dart` | `lib/core/constants/app_routes.dart` |
| App Router | `lib/routes/app_router.dart` | `lib/routes/app_router.dart` |

### Backend - Shared Services

The backend has proper service sharing:

| Service | Usage |
|---------|-------|
| `firestore.ts` | All routes |
| `notificationService.ts` | Jobs, Bookings, Payments |
| `catalogService.ts` | Catalog routes |
| `userService.ts` | Auth, Dashboard |
| `employeeService.ts` | Employees, Jobs |
| `razorpay.ts` | Payment routes |

## Duplication Details

### 1. API Service

**Customer App** (`mobile_customer/lib/data/datasources/api_service.dart`):
```dart
class ApiService {
  final Dio _dio;
  // Methods: get, post, put, delete
  // Includes token handling
}
```

**Employee App** (`mobile_employee/lib/data/datasources/api_service.dart`):
```dart
class ApiService {
  final Dio _dio;
  // Nearly identical implementation
}
```

### 2. API Configuration

**Customer App** (`mobile_customer/lib/core/config/api_config.dart`):
```dart
class ApiConfig {
  static const String baseUrl = 'https://...';
  // Timeouts, headers
}
```

**Employee App** (`mobile_employee/lib/core/config/api_config.dart`):
```dart
class ApiConfig {
  static const String baseUrl = 'https://...';
  // Nearly identical
}
```

### 3. Theme

**Customer App** (`mobile_customer/lib/core/theme/app_theme.dart`):
```dart
class AppTheme {
  static ThemeData get theme => ...
}
```

**Employee App** (`mobile_employee/lib/core/theme/app_theme.dart`):
```dart
class AppTheme {
  static ThemeData get theme => ...
  // Similar but with different colors
}
```

## Shared Module Opportunities

### 1. Flutter Package (Recommended)

Create a shared package:

```
safecom_core/
├── lib/
│   ├── api/
│   │   ├── api_client.dart      # Shared HTTP client
│   │   ├── api_config.dart      # Configuration
│   │   └── endpoints.dart      # Endpoint definitions
│   ├── auth/
│   │   ├── auth_service.dart   # Firebase auth wrapper
│   │   └── token_manager.dart   # Token handling
│   ├── storage/
│   │   └── secure_storage.dart # Secure storage wrapper
│   ├── theme/
│   │   ├── app_theme.dart      # Base theme
│   │   └── theme_config.dart   # Theme config
│   ├── utils/
│   │   ├── error_handler.dart  # Error handling
│   │   └── logger.dart         # Logging utility
│   └── widgets/
│       ├── loading_indicator.dart
│       └── error_widget.dart
```

**Benefits**:
- Single source of truth
- Easier updates
- Consistent behavior

**Migration Effort**: Medium (2-3 weeks)

### 2. Backend Shared Library

Currently well-structured. Consider:
- Separate npm package for common utilities
- Shared Zod schemas as npm package

## Backend Route Files

```
backend_server/src/routes/
├── auth.ts              (136 lines)
├── bookings.ts          (not fully inspected)
├── catalog.ts           (not fully inspected)
├── catalogPublic.ts     (not fully inspected)
├── customers.ts         (not fully inspected)
├── dashboard.ts         (not fully inspected)
├── employees.ts         (not fully inspected)
├── jobs.ts              (319 lines)
├── maintenance-plans.ts (not fully inspected)
├── payments.ts          (not fully inspected)
├── products.ts          (not fully inspected)
├── razorpay.ts          (not fully inspected)
├── recommendations.ts   (not fully inspected)
├── serviceability.ts    (not fully inspected)
├── services.ts          (not fully inspected)
├── servicesAdmin.ts     (not fully inspected)
├── sdui.ts              (not fully inspected)
├── sduiAdmin.ts         (not fully inspected)
├── technicians.ts       (not fully inspected)
└── users.ts             (not fully inspected)
```

## Confidence Level

**High** - Code duplication verified through file inspection of both mobile apps.