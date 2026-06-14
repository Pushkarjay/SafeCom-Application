# DATABASE & FIRESTORE — COMPLETE FUNCTION AUDIT

**Date:** 2026-06-14
**Scope:** Every collection, document structure, index, rule, migration, and data relationship in Firestore

---

## TABLE OF CONTENTS

1. [Collections Overview](#1-collections-overview)
2. [Active Collections Detail](#2-active-collections-detail)
3. [Legacy/Deprecated Collections](#3-legacydeprecated-collections)
4. [Document Relationships](#4-document-relationships)
5. [Firestore Security Rules](#5-firestore-security-rules)
6. [Firestore Indexes](#6-firestore-indexes)
7. [Service Tree (Services Collection)](#7-service-tree-services-collection)
8. [SDUI Layouts](#8-sdui-layouts)
9. [Data Migration History](#9-data-migration-history)
10. [Block Diagrams](#10-block-diagrams)
11. [Multi-Case Behavior Analysis](#11-multi-case-behavior-analysis)
12. [Known Issues & Fixes Required](#12-known-issues--fixes-required)

---

## 1. COLLECTIONS OVERVIEW

### Active Collections (18)

| # | Collection | Documents | Purpose | Created |
|---|-----------|-----------|---------|---------|
| 1 | `admins` | ~ few | Admin user profiles | Original |
| 2 | `customers` | ~ growing | Customer records | Original |
| 3 | `employees` | ~ growing | Employee/technician records | Original |
| 4 | `users` | ~ all users | Central user registry (Firebase linked) | 2026-05 |
| 5 | `jobs` | ~ growing | Job/work order records | 2026-05 |
| 6 | `bookings` | ~ growing | Customer booking records | 2026-05 |
| 7 | `payments` | ~ growing | Payment transaction records | 2026-05 |
| 8 | `earnings` | ~ growing | Technician earnings records | 2026-05 |
| 9 | `catalog_product` | ~ 100+ | Master product catalog | Original |
| 10 | `catalog_packages` | ~ few | Product packages/bundles | 2026-05 |
| 11 | `catalog_addons` | ~ few | Product add-ons | 2026-05 |
| 12 | `catalog_taxes` | ~ few | Tax rate configurations | 2026-05 |
| 13 | `catalog_recommendations` | ~ few | Recommendation rules | 2026-05 |
| 14 | `catalog_invoice_templates` | ~ few | Invoice template configs | 2026-05 |
| 15 | `Services` | ~ few (nested tree) | Service configuration tree | Original |
| 16 | `sdui_layouts` | ~ few | SDUI layout JSON | 2026-05 |
| 17 | `home_cms` | ~ few | CMS blocks (banners, promos) | 2026-05 |
| 18 | `serviceable_areas` | ~ few | Serviceability zone data | 2026-05 |

### Legacy Collections (Deleted/Deprecated — 10)

| Collection | Status | Replaced By |
|-----------|--------|-------------|
| `PService` | ❌ Deleted | `Services` + `catalog_product` |
| `Customer_User` | ❌ Deleted | `customers` + `users` |
| `Admin_User` | ❌ Deleted | `admins` + `users` |
| `Employee_User` | ❌ Deleted | `employees` + `users` |
| `Orders` | ❌ Deleted | `bookings` + `jobs` |
| `Bookings` (old) | ❌ Deleted | `bookings` (restructured) |
| `Banners` | ❌ Deleted | `home_cms` |
| `Configurations` | ❌ Deleted | `catalog_*` collections |
| `Locations` | ❌ Deleted | `serviceable_areas` |
| `Offers` | ❌ Deleted | `catalog_recommendations` |

---

## 2. ACTIVE COLLECTIONS DETAIL

### `admins`
```typescript
{
  uid: string,          // Firebase UID
  email: string,
  name: string,
  role: "super_admin" | "admin",
  status: "active" | "inactive",
  createdAt: Timestamp
}
```
**Access:** Admin dashboard auth validation
**Written by:** Firebase console (manual)
**Used by:** `auth.ts` middleware for JWT generation

### `users` — Central User Registry
```typescript
{
  firebaseUid: string,     // Firebase Auth UID (unique)
  email: string,
  name: string,
  phone: string,
  role: "customer" | "employee" | "admin",
  googleLinked: boolean,
  phoneLinked: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```
**Access:** Read/write by Firebase UID
**Indexes:** `email`, `phone`
**Used by:** `userService.ts` for account linking and merge logic

### `customers`
```typescript
{
  uid: string,              // Firebase UID (references users.firebaseUid)
  name: string,
  phone: string,
  email: string,
  profileImage: string,     // URL
  address: string,
  defaultLocationId: string,
  savedLocations: Array<{ id, label, address, lat, lng }>,
  totalOrders: number,
  totalSpent: number,
  status: "active" | "inactive",
  createdAt: Timestamp
}
```
**Subcollections:** `addresses/{addressId}`
**Used by:** `customers.ts`, `addresses.ts`, `bookings.ts`

### `employees`
```typescript
{
  uid: string,              // Firebase UID
  name: string,
  phone: string,
  email: string,
  photo: string,            // URL
  role: "technician",
  department: string,
  skills: string[],         // Service category IDs
  location: GeoPoint,
  rating: number,
  totalJobs: number,
  completionRate: number,
  status: "active" | "inactive",
  deviceTokens: string[],   // FCM tokens
  createdAt: Timestamp
}
```
**Used by:** `employees.ts`, `technicians.ts`, `jobs.ts`

### `jobs`
```typescript
{
  jobId: string,
  bookingId: string,          // Optional link to booking
  customerId: string,
  technicianId: string,       // Null when unassigned
  serviceType: string,
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "cancelled",
  items: Array<{
    productId: string,
    name: string,
    quantity: number,
    unitPrice: number,
    total: number
  }>,
  total: number,
  paidAmount: number,
  scheduledDate: Timestamp,
  timeSlot: string,
  address: {
    line: string,
    city: string,
    state: string,
    pincode: string,
    lat: number,
    lng: number
  },
  notes: string,
  photos: string[],           // URLs from employee completion
  startedAt: Timestamp,
  completedAt: Timestamp,
  createdAt: Timestamp
}
```
**Indexes:** `employeeId + status`, `status + createdAt`
**Used by:** `jobs.ts`, `employees.ts`, `technicians.ts`

### `bookings`
```typescript
{
  bookingId: string,
  customerId: string,
  serviceType: string,
  items: Array<{
    productId: string,
    name: string,
    quantity: number,
    unitPrice: number,
    total: number
  }>,
  total: number,
  paidAmount: number,
  status: "confirmed" | "in_progress" | "completed" | "cancelled",
  scheduledDate: Timestamp,
  timeSlot: string,
  addressId: string,
  paymentId: string,
  invoice: {
    subtotal: number,
    gstRate: number,
    gstAmount: number,
    advancePercent: number,
    advanceAmount: number,
    total: number,
    status: "pending" | "paid"
  },
  createdAt: Timestamp
}
```
**Indexes:** `customerId + createdAt`
**Used by:** `bookings.ts`

### `payments`
```typescript
{
  paymentId: string,
  bookingId: string,
  customerId: string,
  amount: number,
  paidAmount: number,
  remainingAmount: number,
  method: "razorpay" | "cash" | "upi",
  status: "pending" | "completed" | "failed" | "refunded",
  razorpayOrderId: string,
  razorpayPaymentId: string,
  createdAt: Timestamp
}
```
**Used by:** `payments.ts`, `razorpay.ts`

### `catalog_product`
```typescript
{
  id: string,
  sku: string,
  name: string,
  description: string,
  category: string,
  group: string,
  brand: string,
  unit: string,
  price: number,
  cost: number,
  stockEnabled: boolean,
  stock: number,
  status: "active" | "inactive",
  visible: boolean,
  images: string[],
  tags: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```
**Indexes:** `category + status`, `status + displayOrder`
**Used by:** `catalog.ts`, `catalogPublic.ts`, `catalogService.ts`

### `catalog_packages`
```typescript
{
  id: string,
  name: string,
  description: string,
  products: Array<{ productId, quantity, discountPercent }>,
  totalPrice: number,
  status: "active" | "inactive",
  createdAt: Timestamp
}
```

### `catalog_addons`
```typescript
{
  id: string,
  name: string,
  description: string,
  price: number,
  applicableServices: string[],
  status: "active" | "inactive"
}
```

### `catalog_taxes`
```typescript
{
  id: string,
  name: string,       // e.g., "GST 18%"
  rate: number,        // e.g., 18
  type: "percentage" | "fixed",
  applicableTo: string[],
  isDefault: boolean
}
```

### `catalog_recommendations`
```typescript
{
  id: string,
  title: string,
  description: string,
  productId: string,
  imageUrl: string,
  placement: "checkout" | "home" | "service_selection",
  condition: {          // Rule engine
    serviceTypes?: string[],
    minCartValue?: number,
    maxCartValue?: number
  },
  priority: number,
  active: boolean,
  createdAt: Timestamp
}
```

### `catalog_invoice_templates`
```typescript
{
  id: string,
  name: string,
  header: { logo, businessName, address, gstin },
  footer: { terms, notes },
  layout: { showGst, showDiscount, showTax },
  isDefault: boolean
}
```

### `home_cms`
```typescript
{
  id: string,
  type: "banner" | "promo" | "announcement",
  title: string,
  subtitle: string,
  imageUrl: string,
  actionUrl: string,
  position: number,
  visible: boolean,
  startDate: Timestamp,
  endDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```
**Used by:** `homeCms.ts`

### `serviceable_areas`
```typescript
{
  code: string,             // e.g., "BBSR-01"
  name: string,             // e.g., "Bhubaneswar - Phase 1"
  city: string,
  state: string,
  boundary: {               // Polygon or radius
    type: "polygon" | "radius",
    coordinates: GeoPoint[] | { center: GeoPoint, radiusKm: number }
  },
  active: boolean,
  createdAt: Timestamp
}
```
**Used by:** `serviceability.ts`

---

## 3. LEGACY/DEPRECATED COLLECTIONS

### Deleted Collections
The following collections existed in earlier versions of the app and were deleted during migration:

| Collection | Legacy Structure | Migration |
|-----------|-----------------|-----------|
| `PService` | Flat service documents | → `Services` nested tree + `catalog_product` |
| `Customer_User` | `{ uid, name, phone, email, address }` | → `users` + `customers` |
| `Admin_User` | `{ uid, name, email, role }` | → `admins` + `users` |
| `Employee_User` | `{ uid, name, phone, email, skills }` | → `employees` + `users` |
| `Bookings` (old) | Flat booking docs | → `bookings` with canonical invoice |
| `Orders` | Order documents | → `bookings` + `jobs` |
| `Banners` | Banner content | → `home_cms` |
| `Configurations` | App config key-values | → `catalog_*` collections |
| `Locations` | Fixed location list | → `serviceable_areas` with geo query |
| `Offers` | Offer/promo documents | → `catalog_recommendations` |

### Why Migrated
- **Normalization:** Separated flat user collections into `users` (registry) + role-specific collections
- **Service Tree:** Replaced flat `PService` with nested tree structure in `Services` for infinite-depth service configuration
- **Unified Catalog:** Consolidated product data into `catalog_product` with proper indexing
- **Geo Support:** `serviceable_areas` replaced static location list with polygon/radius support

---

## 4. DOCUMENT RELATIONSHIPS

### User → Role Relationship
```
users.firebaseUid
  ├── customers.uid (if role = "customer")
  ├── employees.uid (if role = "employee")
  └── admins.uid (if role = "admin")
```

### Booking → Payment → Job Relationship
```
bookings.bookingId
  ├── payments.bookingId (payment records)
  ├── jobs.bookingId (optional — if job auto-created)
  └── customers.uid (customer reference)
```

### Service Tree → Catalog Relationship
```
Services/{serviceId}
  └── Category/{catKey}
      └── Setup/{setupKey}
          └── Product/{slotKey}
              ├── Option/{optionKey} → references catalog_product.id
              └── ClubbedOption → references catalog_product.id
```

### Employee → Job Relationship
```
employees.uid
  └── jobs.technicianId (assigned jobs)
  └── earnings (via employees/:id/earnings or earnings collection)
```

### Customer → Address Relationship
```
customers.uid
  └── customers/:uid/addresses/{addressId} (subcollection)
```

---

## 5. FIRESTORE SECURITY RULES

### Current Rules (`firestore.rules`)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Admin-only write access to all collections
    function isAdmin() {
      return request.auth != null
        && request.auth.token.admin == true;
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Public read access (catalog, services, SDUI)
    match /catalog_product/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /Services/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /sdui_layouts/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /home_cms/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /serviceable_areas/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Authenticated read for user-specific data
    match /users/{doc} {
      allow read: if isOwner(doc) || isAdmin();
      allow write: if isOwner(doc) || isAdmin();
    }

    match /customers/{doc} {
      allow read: if isOwner(doc) || isAdmin();
      allow write: if isOwner(doc) || isAdmin();
    }

    match /customers/{customerId}/addresses/{addressId} {
      allow read, write: if isOwner(customerId) || isAdmin();
    }

    match /employees/{doc} {
      allow read: if isOwner(doc) || isAdmin();
      allow write: if isOwner(doc) || isAdmin();
    }

    // Admin-only for admin data
    match /admins/{doc} {
      allow read, write: if isAdmin();
    }

    // Booking/Payment/Job — customer reads own, employee reads assigned, admin reads all
    match /bookings/{doc} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    match /payments/{doc} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    match /jobs/{doc} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Rule Analysis
- **Public read:** Catalog, Services, SDUI, CMS, Serviceable areas
- **Auth read:** Users, Customers, Employees (own document), Bookings, Payments, Jobs
- **Admin write:** All collections
- **No granular write rules for bookings/payments/jobs** — all write goes through backend (admin-only rule prevents direct client writes)

---

## 6. FIRESTORE INDEXES

### Current Indexes (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "PService",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "displayOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "Catalog_Product",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "Orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Required Indexes (Not Explicitly Defined)
The following query patterns exist in code but may not have explicit composite indexes:

| Collection | Query Pattern | Status |
|-----------|--------------|--------|
| `jobs` | `where('technicianId',==) where('status',==)` | May need composite |
| `bookings` | `where('customerId',==) orderBy('createdAt')` | May need composite |
| `catalog_product` | `where('category',==) where('status',==)` | Existing |
| `earnings` | `where('employeeId',==) orderBy('date')` | May need composite |

---

## 7. SERVICE TREE (SERVICES COLLECTION)

### Structure
The `Services` collection uses a nested document structure to represent the full service configuration tree:

```
Services/{serviceId}          // e.g., "Installation"
├── name: "CCTV Installation"
├── icon: "videocam"
├── enabled: true
└── categories: {
    └── "{catKey}": {          // e.g., "Camera"
        ├── name: "Camera Systems"
        ├── icon: "camera"
        ├── renderType: "list"  // "option" | "list"
        ├── selectionType: "multiple"  // "single" | "multiple"
        └── setups: {
            └── "{setupKey}": {    // e.g., "4MP"
                ├── name: "4MP Camera"
                ├── renderType: "list"
                └── products: {
                    └── "{slotKey}": {   // e.g., "4MP-Option-4133"
                        ├── productId: "PROD037"  // references catalog_product
                        ├── defaultQty: 4
                        ├── minQty: 0
                        ├── maxQty: 16
                        ├── displayName: "4MP IR Camera"
                        ├── renderType: "option"
                        ├── selectionType: "single"
                        └── clubbedOptions: {
                            └── "{optionKey}": {
                                ├── productId: "PROD038"
                                ├── defaultQty: 1
                                ├── minQty: 0
                                ├── maxQty: 1
                                └── type: "option" | "mandatory"
                            }
                        }
                    }
                }
            }
        }
    }
}
```

### Tree Levels
| Level | Firestore Path | Description |
|-------|---------------|-------------|
| 1 | `Services/{serviceId}` | Service type (Installation, Maintenance, etc.) |
| 2 | `.categories.{catKey}` | Category group (Camera, Storage, Cable) |
| 3 | `.categories.{catKey}.setups.{setupKey}` | Setup/sub-category (4MP, 2MP, 8MP) |
| 4 | `.categories.{catKey}.setups.{setupKey}.products.{slotKey}` | Product slot (individual configurable item) |
| 5 | `.products.{slotKey}.clubbedOptions.{optionKey}` | Clubbed/variant options (cable, mount, bracket) |

### Render Types
| Type | Behavior | Example |
|------|----------|---------|
| `option` | **Single/multi select** — user picks from list (radio/checkbox) | Hard Disk: 1TB vs 2TB vs 3TB |
| `list` | **Quantity stepper** — user adjusts quantity per item | Camera: quantity 0-16 per camera type |

### Selection Types
| Type | Behavior |
|------|----------|
| `single` | Radio button selection — user picks exactly one option |
| `multiple` | Checkbox selection — user can pick multiple options |

### Dependency System
Products can declare dependencies on other products in the same category:
```
Cable: { dependsOn: "Camera", defaultQty: 8, minQty: -2 }
```
- When Camera quantity changes → Cable quantity auto-updates
- Negative minQty allows offset behavior (Cable min = Camera - 2)
- Dependency chain: if Camera = 0, Cable = -2 (displayed as 0)

### Used By
- `catalogService.ts` (940 lines) — constructs the full tree, resolves product references
- `servicesAdmin.ts` — admin tree builder endpoints
- `catalogPublic.ts` — public pricing endpoints
- `installation_flow_provider.dart` — customer app tree rendering

---

## 8. SDUI LAYOUTS

### Collection: `sdui_layouts`

```typescript
{
  id: string,
  name: string,             // e.g., "Home Screen - Bhubaneswar"
  screen: string,           // e.g., "home"
  layoutType: "default" | "personalized",
  config: {                 // Full layout JSON
    screen: "home",
    version: 1,
    sections: [
      {
        id: "banner",
        type: "section",
        components: [
          {
            type: "banner_carousel",
            data: { source: "cms", limit: 5 },
            styles: { height: 200 }
          }
        ]
      },
      {
        id: "services",
        type: "section",
        components: [
          {
            type: "service_grid",
            data: { columns: 3, showLabels: true }
          }
        ]
      }
    ]
  },
  status: "draft" | "published",
  regions: string[],        // e.g., ["BBSR", "CTC"]
  featureFlags: { [key]: boolean },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Feature Flags
```typescript
// Stored in sdui_layouts or separate config
{
  "show_new_services": true,
  "enable_recommendations": true,
  "dark_mode_available": false,
  "phase_4_booking_flow": true
}
```

---

## 9. DATA MIGRATION HISTORY

### Phase 1: Original Schema (Pre-2026-05)
- Flat collections: `PService`, `Customer_User`, `Admin_User`, `Employee_User`, `Orders`, `Bookings`
- No central user registry
- No service tree (flat product/service lists)

### Phase 2: Schema Migration (2026-05)
- Created `users` collection as central registry
- Migrated `Customer_User` → `users` + `customers`
- Migrated `Admin_User` → `admins` + `users`
- Migrated `Employee_User` → `employees` + `users`
- Restructured `Services` collection for nested tree
- Created `catalog_product` collection
- Deleted legacy collections

### Phase 3: SDUI + CMS (2026-05 to 2026-06)
- Created `sdui_layouts` collection
- Created `home_cms` collection
- Created `catalog_recommendations` collection
- Created `serviceable_areas` collection
- Added `bookings` with canonical invoice structure

### Phase 4: Payment + Jobs (Current)
- Created `payments` collection
- Created `jobs` collection with status workflow
- Created `earnings` collection
- Added Razorpay payment records

---

## 10. BLOCK DIAGRAMS

### Data Flow: Service Configuration
```
Admin Dashboard → Service Tree Builder
        │
        ▼
Firestore: Services/{serviceId}/categories/...
        │
        ▼
Backend: catalogService.ts (resolve product refs)
        │
        ▼
Firestore: catalog_product (price, name, unit)
        │
        ▼
Public API: GET /api/catalog-public/pricing/installation
        │
        ▼
Customer App: DynamicServiceScreen
```

### Data Flow: Booking Creation
```
Customer App → Service Selection → Invoice
        │
        ▼
POST /api/payments/razorpay/create-order
        │
        ▼
Razorpay SDK → Order Created
        │
        ▼
Customer pays in Razorpay Checkout
        │
        ▼
POST /api/payments/razorpay/verify
        │
        ▼
POST /api/bookings
        │
        ├──→ Firestore: bookings document
        ├──→ Firestore: payments document
        ├──→ Canonical invoice generated
        └──→ (Optional) Firestore: jobs document
```

### Data Flow: Job Completion
```
Employee App → Start Job → Complete Job
        │
        ▼
POST /api/jobs/:id/complete
        │
        ├──→ Firestore: jobs (status: completed, photos[], notes)
        ├──→ Firestore: earnings (new earning entry)
        ├──→ FCM: notification to customer
        └──→ Firestore: bookings (status: completed)
```

---

## 11. MULTI-CASE BEHAVIOR ANALYSIS

### Case 1: User Signs In with Google, Then Phone
1. User signs in with Google → `users` doc created with `googleLinked: true`
2. User links phone via PhoneCollectionScreen → phone added to doc
3. Later signs in with phone OTP (different Firebase UID)
4. `POST /api/users/link` detects same phone on different UID
5. `mergeFirestoreUserAccounts` merges both UIDs to primary doc
6. Both auth methods point to same Firestore user

### Case 2: Service Tree With Dependencies
1. Admin configures Camera (max 16) and Cable (depends on Camera, min -2)
2. Customer selects Camera qty 8 → Cable auto-set to 8 (dependent)
3. Customer increases Camera to 12 → Cable auto-updates to 12
4. Cable stepper is locked (canEditQuantity = false)
5. If Camera = 0: Cable = -2 (clamped to 0 for display)

### Case 3: Service Area Check Out of Bounds
1. Customer location: lat=20.0, lng=85.0 (not in serviceable areas)
2. `GET /api/serviceability?lat=20.0&lng=85.0`
3. Point-in-polygon check against all active areas → no match
4. Returns `{ serviceable: false }`
5. Customer app shows "Not available in your area" banner
6. Browsing still allowed, but checkout blocked

### Case 4: Race Condition — Two Admins Edit Same Product
1. Admin A opens product edit form for PROD037
2. Admin B opens same product edit form
3. Admin A saves changes → `PATCH /api/catalog/products/PROD037`
4. Admin B saves changes → `PATCH /api/catalog/products/PROD037`
5. Last write wins (Firestore optimistic concurrency)
6. No conflict detection — Admin A's changes silently overwritten

---

## 12. KNOWN ISSUES & FIXES REQUIRED

### Issue 1: No Optimistic Concurrency Control
- **Problem:** Multiple admin users editing same document causes last-write-wins
- **Fix:** Use Firestore transactions with version fields or `update` with precondition

### Issue 2: Missing Composite Index for Jobs Query
- **Problem:** `jobs` queries with `technicianId + status` + `orderBy('scheduledDate')` may hit composite index errors at scale
- **Fix:** Add explicit composite indexes for all query patterns

### Issue 3: Legacy Index Entries for Deleted Collections
- **Problem:** `firestore.indexes.json` still has entries for `PService`, `Catalog_Product` (old naming), `Orders`
- **Fix:** Remove legacy index entries, add indexes for current collections

### Issue 4: No TTL / Data Retention Policy
- **Problem:** Old bookings, jobs, and payment records accumulate indefinitely
- **Fix:** Implement TTL policy — archive completed jobs older than 6 months to cold storage

### Issue 5: Service Tree Depth Validation Missing
- **Problem:** Admin can create arbitrarily deep service trees with no depth validation
- **Fix:** Enforce max tree depth (e.g., 5 levels) in admin endpoints

### Issue 6: No Data Export/Audit Tool
- **Problem:** No way to export Firestore data for backup or audit
- **Fix:** Implement export endpoint or script for full/partial data export

### Issue 7: Security Rules Allow Auth Read on All Bookings
- **Problem:** Rule allows any authenticated user to read all bookings
- **Fix:** Restrict booking reads to owner + admin: `allow read: if isOwner(resource.data.customerId) || isAdmin()`

### Issue 8: Earnings Collection Structure Undefined
- **Problem:** Earnings data may be stored in `employees/:id/earnings` subcollection or flat `earnings` collection — needs standardization
- **Fix:** Standardize on flat `earnings` collection with `employeeId` field

---

## APPENDIX: COLLECTION SUMMARY

| Collection | Type | Read Access | Write Access | Size |
|-----------|------|-------------|--------------|------|
| `admins` | Flat | Admin only | Admin only | ~ few |
| `users` | Flat | Owner, Admin | Owner, Admin | ~ all users |
| `customers` | Flat | Owner, Admin | Owner, Admin | ~ growing |
| `employees` | Flat | Owner, Admin | Owner, Admin | ~ growing |
| `jobs` | Flat | Auth, Admin | Admin | ~ growing |
| `bookings` | Flat | Auth, Admin | Admin | ~ growing |
| `payments` | Flat | Auth, Admin | Admin | ~ growing |
| `earnings` | Flat | Owner, Admin | Admin | ~ growing |
| `catalog_product` | Flat | Public | Admin | ~ 100+ |
| `catalog_packages` | Flat | Public | Admin | ~ few |
| `catalog_addons` | Flat | Public | Admin | ~ few |
| `catalog_taxes` | Flat | Public | Admin | ~ few |
| `catalog_recommendations` | Flat | Public | Admin | ~ few |
| `catalog_invoice_templates` | Flat | Auth | Admin | ~ few |
| `Services` | Nested tree | Public | Admin | ~ few (deep) |
| `sdui_layouts` | Flat | Public | Admin | ~ few |
| `home_cms` | Flat | Public | Admin | ~ few |
| `serviceable_areas` | Flat | Public | Admin | ~ few |

---

**END OF AUDIT**
