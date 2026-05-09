# Runtime Execution Flow

## 1. Backend Server Startup

```mermaid
flowchart TB
    subgraph "Startup Sequence"
        Start[server.ts main] --> Init[initialize Firebase]
        Init --> Create[createApp()]
        Create --> Middleware[Register middleware]
        Middleware --> Routes[Register routes]
        Routes --> Listen[Start HTTP server]
        Listen --> Ready[Server ready]
    end
```

**From** `backend_server/src/server.ts`:
```typescript
const app = createApp()
const port = process.env.PORT || 3000
app.listen(port, () => { ... })
```

**From** `backend_server/src/app.ts`:
```typescript
export function createApp() {
  const app = express()
  // Security middleware
  app.use(helmet())
  app.use(cors(...))
  app.use(express.json(...))
  app.use(morgan('dev'))

  // Route registration
  app.use('/api/auth', authRouter)
  app.use('/api/jobs', verifyFirebaseIdToken, jobsRouter)
  // ... more routes

  return app
}
```

## 2. Customer App Startup

```mermaid
flowchart TB
    subgraph "App Launch"
        Main[main.dart] --> Init[Firebase init]
        Init --> Provider[Initialize Providers]
        Provider --> Theme[Setup Theme]
        Theme --> Router[GoRouter init]
        Router --> Splash[Splash Screen]
        Splash --> Auth[Check Auth State]
        Auth -->|Authenticated| Home
        Auth -->|Unauthenticated| Login
    end
```

**From** `mobile_customer/lib/main.dart`:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(ProviderScope(child: SafeComApp()));
}
```

## 3. Request Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Middleware
    participant Route
    participant Service
    participant Firestore

    Client->>Express: HTTP Request
    Express->>Middleware: Apply middleware
    
    Note over Middleware: Security (Helmet, CORS, JSON)
    
    Middleware->>Route: Route to handler
    Route->>Service: Call service
    Service->>Firestore: Query/Write
    Firestore-->>Service: Result
    Service-->>Route: Domain object
    Route-->>Client: JSON Response
```

## 4. Mobile App API Call Flow

```mermaid
sequenceDiagram
    participant UI
    participant Provider
    participant Repository
    participant ApiService
    participant Backend
    participant Firestore

    UI->>Provider: User action
    Provider->>Repository: Call method
    Repository->>ApiService: HTTP request
    ApiService->>Backend: REST call
    Backend->>Firestore: Data operation
    Firestore-->>Backend: Result
    Backend-->>ApiService: JSON response
    ApiService-->>Repository: Parsed data
    Repository-->>Provider: Domain model
    Provider->>UI: State update
    UI->>UI: Rebuild
```

## 5. State Update Propagation

```mermaid
flowchart LR
    subgraph "Provider Pattern"
        Change[StateNotifier.notifier] --> State[State]
        State --> Listen[Listener]
        Listen --> Widget[Consumer/Widget]
        Widget --> User[User sees update]
    end
```

## 6. Background Job Flow

```mermaid
flowchart TB
    subgraph "Current State (None)"
        NoBackground[No background jobs]
    end

    subgraph "Future Opportunity"
        CloudFn[Cloud Function]
        Queue[Task Queue]
        Cron[Cron Scheduler]
    end
```

## Execution Patterns Identified

| Pattern | Location | Implementation |
|---------|----------|----------------|
| Express middleware chain | `app.ts` | Sequential |
| Route handlers | `routes/*.ts` | Request-response |
| StateNotifiers | `lib/features/*/providers/` | Riverpod |
| Firestore snapshots | Not used | Could add |
| Cloud Functions | Not used | Could add |

## Confidence Level

**High** - Verified through code inspection of initialization and request handling code.