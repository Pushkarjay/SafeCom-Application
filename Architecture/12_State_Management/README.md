# State Management Architecture

## Overview

Both mobile apps use **Riverpod** (Flutter's recommended state management solution) with a provider-based architecture.

## Customer App State Management

### Provider Structure

```mermaid
flowchart TB
    subgraph "Providers (lib/data/providers/)"
        Cart[cart_provider.dart]
        Data[data_providers.dart]
    end

    subgraph "Feature Providers (lib/features/*/providers/)"
        Auth[auth/providers/auth_provider.dart]
        Location[location/providers/location_provider.dart]
        Home[home/providers/home_providers.dart]
        Booking[booking/providers/booking_flow_provider.dart]
        Booking[booking/providers/active_order_provider.dart]
        Profile[profile/providers/booking_provider.dart]
    end

    subgraph "Service Providers (lib/features/services/providers/)"
        Install[installation_flow_provider.dart]
        Maintain[maintenance_flow_provider.dart]
        Repair[repair_flow_provider.dart]
        Product[product_selection_provider.dart]
    end

    Auth --> Data
    Location --> Data
    Booking --> Cart
    Services --> Cart
    Home --> Data
    Profile --> Data
```

### Key Providers

| Provider | Purpose | Location |
|----------|---------|----------|
| `AuthProvider` | Authentication state, user session | `lib/features/auth/providers/auth_provider.dart` |
| `CartProvider` | Shopping cart for services | `lib/data/providers/cart_provider.dart` |
| `LocationProvider` | User location state | `lib/features/location/providers/location_provider.dart` |
| `BookingFlowProvider` | Booking wizard state | `lib/features/booking/providers/booking_flow_provider.dart` |
| `ActiveOrderProvider` | Current active order tracking | `lib/features/booking/providers/active_order_provider.dart` |
| `InstallationFlowProvider` | Installation service flow | `lib/features/services/providers/installation_flow_provider.dart` |
| `MaintenanceFlowProvider` | Maintenance service flow | `lib/features/services/providers/maintenance_flow_provider.dart` |
| `RepairFlowProvider` | Repair service flow | `lib/features/services/providers/repair_flow_provider.dart` |
| `HomeProviders` | Home screen data | `lib/features/home/providers/home_providers.dart` |

### Provider Implementation Pattern

```dart
// Example: AuthProvider
class AuthProvider extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthProvider(this._authService) : super(AuthState.initial());

  Future<void> signInWithPhone(String phone) async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await _authService.signIn(phone);
      state = state.copyWith(user: user, isAuthenticated: true);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}
```

## Employee App State Management

### Provider Structure

```mermaid
flowchart TB
    subgraph "Providers (lib/data/providers/)"
        JobsP[jobs_provider.dart]
        EmployeeP[employee_providers.dart]
    end

    subgraph "Feature Providers (lib/features/*/providers/)"
        Map[map/providers/employee_location_provider.dart]
    end

    JobsP --> EmployeeP
    Map --> JobsP
```

### Key Providers

| Provider | Purpose | Location |
|----------|---------|----------|
| `JobsProvider` | Job list state, filtering | `lib/data/providers/jobs_provider.dart` |
| `JobsProviders` | Jobs data management | `lib/data/providers/jobs_providers.dart` |
| `EmployeeProviders` | Employee profile state | `lib/data/providers/employee_providers.dart` |
| `EmployeeLocationProvider` | Location tracking | `lib/features/map/providers/employee_location_provider.dart` |

## Data Flow Pattern

```mermaid
sequenceDiagram
    participant UI as UI Widget
    participant Provider as StateNotifier
    participant Repository as Repository
    participant DataSource as DataSource
    participant API as Backend API

    UI->>Provider: User Action
    Provider->>Repository: Call Method
    Repository->>DataSource: Fetch Data
    DataSource->>API: HTTP Request
    API-->>DataSource: JSON Response
    DataSource-->>Repository: Parsed Data
    Repository-->>Provider: Domain Model
    Provider->>UI: State Update
    UI->>UI: Rebuild
```

## SDUI State (Server-Driven UI)

The customer app supports dynamic UI rendering via SDUI:

```mermaid
flowchart LR
    Backend[Backend /sdui] --> JSON[JSON Layout]
    JSON --> SDUIProvider[core/sdui/sdui_provider.dart]
    SDUIProvider --> Renderer[core/sdui/sdui_renderer.dart]
    Renderer --> Widgets[SDUI Components]
```

**Files**:
- `lib/core/sdui/sdui_provider.dart` - Provides layout data
- `lib/core/sdui/sdui_renderer.dart` - Renders components
- `lib/core/sdui/sdui_builders.dart` - Component builders
- `lib/core/sdui/sdui_models.dart` - Data models
- `lib/core/sdui/sdui_component_registry.dart` - Component mapping

## Admin Web State Management

The Admin web app uses React's built-in state management:

- **useState**: Local component state
- **useReducer**: Complex state (in hooks)
- **Context**: Shared auth state
- **React Query**: Server state caching (if used - needs verification)

**Files**:
- `src/core/hooks/useAuthenticatedData.ts` - Auth hook
- `src/core/services/auth_service.ts` - Auth logic

## State Persistence

| App | Storage | Purpose |
|-----|---------|---------|
| Customer | SecureStorage | Auth tokens |
| Customer | In-memory | Cart, active booking |
| Employee | SecureStorage | Auth tokens |
| Employee | In-memory | Job cache |
| Admin | Memory/LocalStorage | Auth token |

## Confidence Level

**High** - Verified through code inspection of all provider files in both mobile apps.