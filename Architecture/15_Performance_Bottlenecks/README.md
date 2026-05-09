# Performance Bottlenecks

## 1. In-Memory Query Filtering

**Location**: `backend_server/src/routes/jobs.ts:28-69`

**Issue**:
```typescript
// Loads ALL jobs from Firestore
const snapshot = await query.get()
// Then filters in JavaScript
jobs = jobs.filter((job) => job.status === statusFilter)
```

**Impact**: 
- O(n) read operation
- Doesn't scale with job count
- Memory overhead

**Fix**: Use composite indexes + query parameters

## 2. No Pagination

**Location**: All list endpoints

**Issue**: Returns all documents without pagination
```typescript
// From jobs.ts
return res.json({
  data: jobs, // No limit/offset
  pagination: { page: 1, limit: jobs.length, total: jobs.length }
})
```

**Impact**: 
- Response size grows with data
- Network overhead
- Client processing overhead

**Fix**: Implement cursor-based pagination

## 3. No Caching Layer

**Location**: All API endpoints

**Issue**: Every request hits Firestore directly
- Catalog products read on every request
- Service configurations read repeatedly

**Fix**: Implement Redis or in-memory cache for:
- Catalog products (5 min TTL)
- Service configurations (15 min TTL)
- Dashboard metrics (1 min TTL)

## 4. Blocking I/O in Middleware

**Location**: `backend_server/src/middleware/firebaseAuth.ts:24-29`

**Issue**:
```typescript
await auth.verifyIdToken(token) // Blocking for every request
```

**Impact**: Auth check adds latency to every request

**Fix**: 
- Cache verified tokens (short TTL)
- Use Firebase session cookies

## 5. N+1 Problem in Catalog Resolution

**Location**: `mobile_customer/lib/data/repositories/service_catalog_repository.dart`

**Issue**:
- Service tree contains product document references
- Each product reference resolved separately
- No batch resolution

**Fix**: Batch fetch all referenced products in one query

## 6. Large JSON Payloads

**Location**: `/api/catalog/services-admin/config/:serviceId`

**Issue**: Full service tree returned on every request
- Deep nested structure (10+ levels)
- Uncompressed size could be MBs

**Fix**: 
- Implement delta updates
- Compress responses (gzip)
- Pagination within large collections

## 7. No Connection Pooling

**Location**: `backend_server/src/services/firestore.ts`

**Issue**: Creating new Firestore client per request (assumed)

**Fix**: Singleton pattern for Firestore client

## 8. Mobile App Image Loading

**Location**: Both Flutter apps

**Issue**: No image caching strategy visible
- Profile images loaded every time
- Service images loaded on scroll

**Fix**: Use cached_network_image package

## Performance Metrics Missing

- No request latency tracking
- No error rate monitoring
- No Firestore read count tracking
- No custom performance dashboard

## Confidence Level

**High** - Bottlenecks identified through code review. Some are assumed based on patterns.