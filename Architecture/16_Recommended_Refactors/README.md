# Recommended Refactoring

## High Priority Refactors

### 1. Implement Pagination

**Current**: Returns all records
**Proposed**: Cursor-based pagination

```typescript
// Add to all list endpoints
interface PaginationParams {
  cursor?: string;  // Last document ID
  limit: number;    // Default 20
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}
```

**Files to modify**: All route files in `/routes/`

### 2. Fix Jobs Query (Add Composite Indexes)

**Current**: In-memory filtering
**Proposed**: Firestore composite queries

```typescript
// Instead of filter in memory
const query = db.collection('jobs')
  .where('status', '==', statusFilter)
  .where('assignedTo.employeeId', '==', technicianId)
  .orderBy('createdAt', 'desc')
```

**Add to** `firestore.indexes.json`

### 3. Extract Shared Code from Mobile Apps

**Duplicated between customer and employee apps**:
- API service layer
- Error handling
- Token management

**Proposed**: Create shared Flutter package

```
safecom_core/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── storage/
│   └── utils/
```

### 4. Add Rate Limiting

**Current**: No rate limiting
**Proposed**: Express rate limiter

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
})
```

### 5. Implement Caching Layer

**Proposed**: Redis for:
- Catalog products (5 min TTL)
- Service tree (15 min TTL)
- Dashboard metrics (1 min TTL)

## Medium Priority Refactors

### 6. Move to GraphQL

**Current**: REST API
**Proposed**: GraphQL for:
- Reduced over-fetching
- Flexible queries
- Schema introspection

**Complexity**: High, significant refactor

### 7. Add Firestore Real-time Listeners

**Current**: Polling via REST
**Proposed**: Firestore snapshot listeners

```dart
// In Flutter
StreamSubscription<QuerySnapshot> subscription = 
  firestore.collection('jobs')
    .where('assignedTo.employeeId', isEqualTo: uid)
    .snapshots()
    .listen((snapshot) { ... })
```

### 8. Implement Transaction Support

**Current**: Separate writes
**Proposed**: Atomic transactions

```typescript
await firestore.runTransaction(async (transaction) => {
  const jobRef = db.collection('jobs').doc(jobId)
  const bookingRef = db.collection('bookings').doc(bookingId)
  // Both succeed or both fail
})
```

### 9. Add Logging + Monitoring

**Current**: Basic console logging
**Proposed**:
- Structured logging (Pino/Winston)
- APM integration (Datadog/New Relic)
- Custom metrics endpoint

## Low Priority Refactors

### 10. Split Backend into Modules

Current monolithic structure:
```
src/
├── routes/ (17 files)
├── services/ (8 files)
└── middleware/ (2 files)
```

Proposed modular structure:
```
src/
├── modules/
│   ├── auth/
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── middleware.ts
│   ├── jobs/
│   ├── bookings/
│   └── catalog/
└── shared/
```

### 11. Add API Versioning

**Current**: `/api/*`
**Proposed**: `/api/v1/*`

### 12. Migrate to Cloud Functions

**Current**: Express server on Cloud Run
**Proposed**: Firebase Cloud Functions per endpoint

## Confidence Level

**High** - Refactors identified based on code review and industry best practices.