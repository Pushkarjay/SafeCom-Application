# Firestore Analysis

## Collection Read/Write Patterns

### Hot Collections (High Frequency)

| Collection | Operations | Concern |
|------------|------------|---------|
| `jobs` | Read + Write | In-memory filtering in jobs.ts |
| `bookings` | Write heavy | Links to jobs, invoices |
| `catalog_product` | Read heavy | Service discovery uses this |
| `customers` | Read + Write | Auth linked |

### Cold Collections (Low Frequency)

| Collection | Operations |
|------------|------------|
| `admins` | Read on auth |
| `employees` | Read on job assignment |
| `sdui_layouts` | Read on app start |
| `Services` | Read on catalog fetch |

## Query Patterns Analysis

### Jobs Collection
```typescript
// From backend_server/src/routes/jobs.ts:28-69
// PROBLEM: In-memory filtering
const snapshot = await query.get()
let jobs: CanonicalJob[] = []
snapshot.forEach((doc) => {
  jobs.push({ ... })
})
// Then filter by:
jobs = jobs.filter((job) => job.status === statusFilter)
jobs = jobs.filter((job) => job.assignedTo?.employeeId === technicianId)
```

**Issue**: Loading all jobs, then filtering in memory. Will not scale.

### Recommended Indexes

```json
{
  "indexes": [
    {
      "collection": "jobs",
      "fields": [
        { "fieldPath": "status", "order": "ASC" },
        { "fieldPath": "createdAt", "order": "DESC" }
      ]
    },
    {
      "collection": "jobs",
      "fields": [
        { "fieldPath": "assignedTo.employeeId", "order": "ASC" },
        { "fieldPath": "status", "order": "ASC" }
      ]
    },
    {
      "collection": "bookings",
      "fields": [
        { "fieldPath": "customerId", "order": "ASC" },
        { "fieldPath": "createdAt", "order": "DESC" }
      ]
    }
  ]
}
```

## Real-time Sync Opportunities

### Currently Not Utilized
- No Firestore real-time listeners in mobile apps for:
  - Job status updates
  - Booking status changes
  - New job notifications

### Opportunity
Add snapshot listeners in:
- `mobile_employee/lib/data/repositories/jobs_repository.dart`
- `mobile_customer/lib/data/repositories/booking_repository.dart`

## Data Integrity Issues

1. **Duplicate Data**
   - Jobs contain booking data (potential drift)
   - Bookings mirror job status

2. **No Transactions**
   - Job + Booking updates not atomic
   - Payment + Invoice not atomic

3. **No Soft Deletes**
   - Hard deletes in some collections
   - No audit trail

## Firestore Rules Assumptions

Based on code patterns:
- `auth.uid == resource.data.firebaseUid` for user documents
- `auth.uid != null` for read access on catalog
- Admin has full access via custom claims or collection-based

## Confidence Level

**High** - Schema and query patterns verified through code inspection. Security rules not verified.