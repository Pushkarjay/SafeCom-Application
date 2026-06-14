# BACKEND SERVER — COMPLETE FUNCTION AUDIT

**Date:** 2026-06-14
**Scope:** Every route, service, middleware, contract, and data flow in the Node.js/Express backend

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Middleware](#2-authentication--middleware)
3. [User Management Routes](#3-user-management-routes)
4. [Customer Routes](#4-customer-routes)
5. [Employee Routes](#5-employee-routes)
6. [Technician Routes](#6-technician-routes)
7. [Job Routes](#7-job-routes)
8. [Booking Routes](#8-booking-routes)
9. [Payment Routes](#9-payment-routes)
10. [Dashboard Routes](#10-dashboard-routes)
11. [Catalog Routes (Admin)](#11-catalog-routes-admin)
12. [Catalog Public Routes](#12-catalog-public-routes)
13. [SDUI Routes](#13-sdui-routes)
14. [CMS Routes](#14-cms-routes)
15. [Serviceability Routes](#15-serviceability-routes)
16. [Services Layer](#16-services-layer)
17. [Contracts & Types](#17-contracts--types)
18. [Firestore Integration](#18-firestore-integration)
19. [Block Diagrams](#19-block-diagrams)
20. [Multi-Case Behavior Analysis](#20-multi-case-behavior-analysis)
21. [Known Issues & Fixes Required](#21-known-issues--fixes-required)

---

## 1. ARCHITECTURE OVERVIEW

### Tech Stack
- **Runtime:** Node.js + Express.js
- **Language:** TypeScript
- **Database:** Firestore (Google Cloud)
- **Auth:** Dual system — Firebase Auth tokens + JWT (admin)
- **Payments:** Razorpay SDK
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Validation:** Zod schemas

### Directory Structure
```
backend_server/src/
├── routes/          # 24 route files
├── services/        # 8 service files
├── middleware/      # 2 middleware files
├── contracts/       # Interface definitions
├── types.ts         # Shared types
└── index.ts         # App entry point
```

### Middleware Chain
```
Request → CORS → JSON Parse → Firebase/JWT Auth → Route Handler → Response
                                     │
                               requireRole() (admin only)
```

---

## 2. AUTHENTICATION & MIDDLEWARE

### Auth Middleware (`middleware/auth.ts`)
- **Dual Auth System:**
  1. **JWT Auth:** Used by admin dashboard — verifies `Authorization: Bearer <token>` against `admins` collection
  2. **Firebase Auth:** Used by mobile apps — verifies Firebase ID token via Admin SDK
- **Functions:**
  - `authenticateToken` — JWT verification for admin routes
  - `optionalAuthenticateToken` — Optional auth (public endpoints with enhanced data if authenticated)
  - `requireRole(...roles)` — RBAC middleware factory
  - `verifyFirebaseIdToken` — Firebase ID token validation

### Firebase Auth Middleware (`middleware/firebaseAuth.ts`)
- `verifyFirebaseIdToken` flow:
  1. Extract token from `Authorization: Bearer <token>`
  2. Call `admin.auth().verifyIdToken(token)`
  3. Attach `firebaseUid` and `firebaseClaims` to request
  4. On failure: 401 Unauthorized

### Auth Route (`routes/auth.ts`)
- `POST /api/auth/login` — Admin login
  1. Receives `{ email, firebaseUid }` + Firebase ID token
  2. Validates against `admins` collection by `firebaseUid` or `email`
  3. Generates JWT with admin claims
  4. Returns `{ token, admin }`
- **Logout:** Client-side only (localStorage clear)

---

## 3. USER MANAGEMENT ROUTES

### User Route (`routes/users.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/users/link` | Firebase | **Account merge**: Links Firebase user to Firestore user document |
| GET | `/api/users/by-email/:email` | None | Check email availability |
| GET | `/api/users/by-phone/:phone` | None | Check phone availability |
| GET | `/api/users/me` | Firebase | Get current user |
| GET | `/api/users/:id` | Firebase | Get user by ID |

### POST /api/users/link — Account Merge Logic
1. Receives `{ firebaseUid, email, name, phone, role }`
2. Checks Firestore `users` collection for existing record by email or phone
3. If exists and different Firebase UID → calls `mergeFirestoreUserAccounts()`
4. If exists with same Firebase UID → updates `updatedAt`
5. If new → creates `users` document with `{ firebaseUid, email, name, phone, role, googleLinked, createdAt, updatedAt }`
6. Returns user document

### Merge Logic (`userService.mergeFirestoreUserAccounts`)
1. Detects duplicate accounts (same phone/email, different UID)
2. Merges booking history, addresses, and profile data
3. Updates both user docs to reference the same Firestore document
4. Soft-deletes duplicate user document

---

## 4. CUSTOMER ROUTES

### Customer Route (`routes/customers.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/customers?page=N` | Admin | List customers (paginated) |
| GET | `/api/customers/:id` | Auth | Get customer detail |
| POST | `/api/customers` | Admin | Create customer |
| PATCH | `/api/customers/:id` | Auth | Update customer profile |
| DELETE | `/api/customers/:id` | Admin | Delete customer (soft) |

### Address Sub-routes (`routes/addresses.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/customers/:customerId/addresses` | Auth | List saved addresses |
| POST | `/api/customers/:customerId/addresses` | Auth | Add address |
| PATCH | `/api/customers/:customerId/addresses/:id` | Auth | Update address |
| DELETE | `/api/customers/:customerId/addresses/:id` | Auth | Delete address |

### Customer Model
```typescript
CustomerRecord {
  id: string, name: string, email: string, phone: string,
  address: string, registeredDate: Timestamp,
  totalOrders: number, totalSpent: number, status: "active"|"inactive"
}
```

### Admin Reflection
- Full CRUD from admin /customers screens
- Customer metrics aggregated for dashboard

---

## 5. EMPLOYEE ROUTES

### Employee Route (`routes/employees.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/employees/:id` | Firebase | Get employee profile |
| PATCH | `/api/employees/:id` | Firebase | Update employee profile |
| GET | `/api/employees/:id/earnings` | Firebase | Get earnings history |
| POST | `/api/employees/device-token` | Firebase | Register FCM device token |
| POST | `/api/employees/location` | Firebase | Update live location |

### Earnings Route
- `GET /api/employees/:id/earnings?period=week|month|all`
- Aggregates completed jobs with payment status
- Returns `{ total, paid, pending, entries[] }`

### Employee Model
```typescript
Employee {
  id: string, name: string, email: string, phone: string,
  photo: string, role: "technician", skills: string[],
  location: GeoPoint, rating: number, totalJobs: number,
  completionRate: number, status: "active"|"inactive",
  deviceTokens: string[], createdAt: Timestamp
}
```

---

## 6. TECHNICIAN ROUTES

### Technician Route (`routes/technicians.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/technicians?page=N` | Admin | List technicians |
| GET | `/api/technicians/:id` | Admin | Get technician detail |
| POST | `/api/technicians` | Admin | Create technician |
| PATCH | `/api/technicians/:id` | Admin | Update technician |
| DELETE | `/api/technicians/:id` | Admin | Delete technician |
| POST | `/api/technicians/:id/password` | Admin | Reset technician password |

---

## 7. JOB ROUTES

### Job Route (`routes/jobs.ts`) — 430 lines
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/jobs` | Auth | List jobs (filterable: employeeId, status, unassigned) |
| GET | `/api/jobs/:id` | Auth | Get job detail |
| POST | `/api/jobs` | Admin | Create job |
| PATCH | `/api/jobs/:id` | Auth | Update job |
| DELETE | `/api/jobs/:id` | Admin | Delete job |
| POST | `/api/jobs/:id/pickup` | Firebase | Accept job (employee) |
| POST | `/api/jobs/:id/complete` | Firebase | Complete job with photos |

### Job Status Flow
```
unassigned → assigned → in_progress → completed → (archived)
                                                      ↘ cancelled
```

### Pickup Logic
1. Validates job exists and status is `unassigned`
2. Sets `technicianId = employeeId`, status = `assigned`
3. On race condition (already taken): returns 409 Conflict

### Complete Logic
1. Validates job exists and status is `in_progress`
2. Accepts `{ photos[], notes, paymentCollected }`
3. Updates status to `completed`, records `completedAt`
4. Updates earnings for technician
5. Creates notification for customer

---

## 8. BOOKING ROUTES

### Booking Route (`routes/bookings.ts`) — 477 lines
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/bookings` | Firebase | List user bookings |
| GET | `/api/bookings/:id` | Firebase | Get booking detail |
| POST | `/api/bookings` | Firebase | Create booking from payment |
| PATCH | `/api/bookings/:id` | Admin | Update booking |
| DELETE | `/api/bookings/:id` | Admin | Delete booking |

### POST /api/bookings — Booking Creation
1. Receives items, customerId, total, payment details
2. Generates canonical invoice with GST 18%, advance payment
3. Creates booking record in Firestore
4. Optionally creates job record (if auto-assign enabled)
5. Returns booking with invoice

### Canonical Invoice Generation
```typescript
CanonicalInvoice {
  id: string,
  bookingId: string,
  items: InvoiceLineItem[],
  subtotal: number,
  gstRate: number (18%),
  gstAmount: number,
  advancePercent: number (50%),
  advanceAmount: number,
  total: number,
  status: "pending" | "paid"
}
```

---

## 9. PAYMENT ROUTES

### Payment Route (`routes/payments.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/payments` | Admin | List payments |
| GET | `/api/payments/:id` | Admin | Get payment detail |
| DELETE | `/api/payments/:id` | Admin | Delete payment |
| POST | `/api/payments/:id/request` | Admin | Request payment |

### Razorpay Route (`routes/razorpay.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payments/razorpay/create-order` | Firebase | Create Razorpay order |
| POST | `/api/payments/razorpay/verify` | Firebase | Verify payment signature |

### Razorpay Integration
- **Create Order:** `razorpay.orders.create({ amount, currency, receipt })`
- **Verify:** HMAC SHA256 signature verification of `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Webhook:** Optional webhook for payment status updates

---

## 10. DASHBOARD ROUTES

### Dashboard Route (`routes/dashboard.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/admin/metrics` | Admin | Dashboard KPIs |

### Metrics Aggregated
```typescript
DashboardMetrics {
  totalCustomers: number,
  activeTechnicians: number,
  pendingJobs: number,
  totalRevenue: number,
  completionRate: number,
  avgResponseTime: number,
  systemHealth: {
    firestore: boolean,
    firebaseAuth: boolean,
    paymentGateway: boolean,
    notification: boolean
  },
  topTechnicians: TopTechnician[],
  recentBookings: RecentBooking[]
}
```

### Revenue Trend
- Aggregated from `bookings` collection
- Last 7 dates with daily totals
- Used by Recharts `LineChart` on admin dashboard

---

## 11. CATALOG ROUTES (ADMIN)

### Catalog Route (`routes/catalog.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/products` | None | List products |
| GET | `/api/catalog/products/:id` | None | Get product |
| POST | `/api/catalog/products` | Admin | Create product |
| PATCH | `/api/catalog/products/:id` | Admin | Update product |
| DELETE | `/api/catalog/products/:id` | Admin | Delete product |
| GET | `/api/catalog/packages` | Token | List packages |
| POST | `/api/catalog/packages` | Admin | Create package |
| PATCH | `/api/catalog/packages/:id` | Admin | Update package |
| DELETE | `/api/catalog/packages/:id` | Admin | Delete package |
| GET | `/api/catalog/addons` | Token | List add-ons |
| POST | `/api/catalog/addons` | Admin | Create add-on |
| PATCH | `/api/catalog/addons/:id` | Admin | Update add-on |
| DELETE | `/api/catalog/addons/:id` | Admin | Delete add-on |
| GET | `/api/catalog/taxes` | Token | List taxes |
| POST | `/api/catalog/taxes` | Admin | Create tax |
| PATCH | `/api/catalog/taxes/:id` | Admin | Update tax |
| DELETE | `/api/catalog/taxes/:id` | Admin | Delete tax |
| GET | `/api/catalog/recommendations` | None | List recommendations |
| POST | `/api/catalog/recommendations` | Admin | Create recommendation |
| PATCH | `/api/catalog/recommendations/:id` | Admin | Update recommendation |
| DELETE | `/api/catalog/recommendations/:id` | Admin | Delete recommendation |
| GET | `/api/catalog/invoices` | Token | List invoice templates |
| POST | `/api/catalog/invoices` | Admin | Create template |
| PATCH | `/api/catalog/invoices/:id` | Admin | Update template |
| DELETE | `/api/catalog/invoices/:id` | Admin | Delete template |

### Service Admin Route (`routes/servicesAdmin.ts`)
- **Service tree builder:** Full CRUD for nested service configuration
- Endpoints for: category CRUD, setup CRUD, product management, render config, dependencies, cloning, branching
- See `admin_dashboard_function.md` for full endpoint reference

### Installation Admin Route (`routes/installationAdmin.ts`)
- Admin configuration for installation service pricing
- Group/category management

### Accessories Route (`routes/accessories.ts`)
- Full CRUD for accessory catalog items
- Pricing and inventory management

### Maintenance Plans Route (`routes/maintenance-plans.ts`)
- Full CRUD for maintenance plan configurations
- Plan types, visit counts, pricing

### Recommendations Route (`routes/recommendations.ts`)
- CRUD + query by placement (checkout, home, service selection)
- Recommendation rule engine

### SDUI Admin Route (`routes/sduiAdmin.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/sdui-admin/layouts` | Admin | List layouts |
| GET | `/api/catalog/sdui-admin/layouts/:id` | Admin | Get layout |
| POST | `/api/catalog/sdui-admin/layouts/:id` | Admin | Save layout |
| POST | `/api/catalog/sdui-admin/layouts/:id/reset` | Admin | Reset layout to default |
| GET | `/api/catalog/sdui-admin/feature-flags` | Admin | List feature flags |
| POST | `/api/catalog/sdui-admin/feature-flags/:key` | Admin | Set feature flag |

---

## 12. CATALOG PUBLIC ROUTES

### Public Catalog Route (`routes/catalogPublic.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog-public/services` | None | List enabled services |
| GET | `/api/catalog-public/pricing/installation` | None | Installation pricing contracts |
| GET | `/api/catalog-public/pricing/maintenance` | None | Maintenance pricing contracts |
| GET | `/api/catalog-public/pricing/repair` | None | Repair pricing contracts |
| GET | `/api/catalog-public/pricing/amc` | None | AMC plan configurations |
| GET | `/api/catalog-public/upgrade` | None | Upgrade bundle catalog |
| GET | `/api/catalog-public/accessories` | None | Accessory items |
| GET | `/api/catalog-public/products` | None | All products (with filters) |
| GET | `/api/catalog-public/recommendations` | None | Recommendations by placement |

### Product Route (`routes/products.ts`)
- `GET /api/catalog/products` — Public product listing
- `GET /api/catalog/products/:id` — Single product detail

### Service Route (`routes/services.ts`)
- `GET /api/catalog/services` — Public enabled services list

---

## 13. SDUI ROUTES

### SDUI Route (`routes/sdui.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/sdui/layout` | None | Get screen layout with personalization |
| GET | `/api/sdui/screens` | None | List available screens |

### GET /api/sdui/layout — SDUI Engine
1. Query params: `screen`, `lat`, `lng`, `customerId` (optional)
2. Fetches layout configuration from Firestore `sdui_layouts`
3. Personalizes based on:
   - Location (serviceable areas, region-specific content)
   - Customer history (recommendations, past orders)
   - Feature flags (A/B testing, phased rollouts)
4. Returns JSON layout with sections, components, styles
5. Used by customer app `SduiRenderer` to build dynamic UI

---

## 14. CMS ROUTES

### Home CMS Route (`routes/homeCms.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/home-cms` | None | List visible CMS blocks |
| GET | `/api/home-cms/admin` | Admin | List all blocks (incl. hidden) |
| POST | `/api/home-cms` | Admin | Create CMS block |
| PATCH | `/api/home-cms/:id` | Admin | Update CMS block |
| DELETE | `/api/home-cms/:id` | Admin | Delete CMS block |

### CMS Block Model
```typescript
CmsBlock {
  id: string,
  type: "banner" | "promo" | "announcement",
  title: string,
  subtitle?: string,
  imageUrl: string,
  actionUrl?: string,
  position: number,
  visible: boolean,
  startDate?: Timestamp,
  endDate?: Timestamp,
  createdAt: Timestamp
}
```

---

## 15. SERVICEABILITY ROUTES

### Serviceability Route (`routes/serviceability.ts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/serviceability` | None | Check location serviceability |

### GET /api/serviceability
1. Query params: `lat`, `lng`
2. Checks against `serviceable_areas` collection
3. Uses point-in-polygon or radius-based matching
4. Returns `{ serviceable: boolean, area?: string, message?: string }`

### Admin Reflection
- Serviceable areas managed via `/settings/serviceable-areas` admin screen
- Polygon/radius data configured by admin

---

## 16. SERVICES LAYER

### Firestore Service (`services/firestore.ts`)
- Firebase Admin SDK initialization
- `getDb()` — Firestore database instance
- `queryCollection(collection, constraints)` — Generic query with filters
- `getDocument(collection, id)` — Single document fetch
- `createDocument(collection, data)` — Document creation
- `updateDocument(collection, id, data)` — Document update
- `deleteDocument(collection, id)` — Document deletion
- `getCollection(collection)` — Full collection fetch

### User Service (`services/userService.ts`) — 308 lines
- `upsertFirestoreUser(firebaseUid, data)` — Create or update user
- `linkCustomerToFirebase(firebaseUid, customerData)` — Link customer account
- `linkEmployeeToFirebase(firebaseUid, employeeData)` — Link employee account
- `getFirestoreUserByUid(firebaseUid)` — Lookup by Firebase UID
- `getFirestoreUserByPhone(phone)` — Lookup by phone
- `getFirestoreUserByEmail(email)` — Lookup by email
- `mergeFirestoreUserAccounts(primaryUid, secondaryUid)` — Merge duplicate accounts
- `updateCustomerPhone(firebaseUid, phone)` — Update phone number

### Catalog Service (`services/catalogService.ts`) — 940 lines
- **Service tree construction:** Builds nested service configuration from Firestore
- `getServiceConfig(serviceId)` — Full tree with all nodes
- `resolveProductReferences(node)` — Resolves product IDs to catalog data
- `getPricingContract(serviceType, categoryId)` — Pricing data for public API
- **Node types:** category, setup, product, option, branch, club
- **Render types:** option (single/multi select), list (quantity stepper)
- **Dependency engine:** Quantity auto-follow logic between products
- **Validation:** Tree structure integrity checks

### Employee Service (`services/employeeService.ts`)
- `getEmployeeProfile(employeeId)` — Full profile with stats
- `updateEmployeeLocation(employeeId, lat, lng)` — Location update

### Earnings Service (`services/earningsService.ts`)
- `getEarningsByEmployee(employeeId, period)` — Aggregated earnings
- `calculateEarnings(jobId)` — Job-specific earnings calculation

### Notification Service (`services/notificationService.ts`)
- `sendNotification(userId, title, body, data)` — FCM push notification
- `sendToTopic(topic, payload)` — Topic-based broadcast
- `sendJobAssignmentNotification(employeeId, jobId)` — New job alert

### Razorpay Service (`services/razorpay.ts`)
- `createOrder(amount, currency, receipt)` — Razorpay order creation
- `verifySignature(orderId, paymentId, signature)` — HMAC verification
- `processRefund(paymentId, amount)` — Refund processing

### SDUI Service (`services/sduiService.ts`)
- `buildLayout(screen, location, customerId)` — Layout builder
- `personalizeLayout(layout, context)` — Personalization engine
- `getFeatureFlags()` — Feature flag evaluation

---

## 17. CONTRACTS & TYPES

### Canonical Contracts (`contracts/canonical_contracts.ts`)
```typescript
CanonicalInvoice {
  id: string,
  bookingId: string,
  customerId: string,
  items: InvoiceLineItem[],
  subtotal: number,
  gstRate: number,
  gstAmount: number,
  advancePercent: number,
  advanceAmount: number,
  total: number,
  status: "pending" | "paid",
  createdAt: Timestamp
}

CanonicalBooking {
  id: string,
  customerId: string,
  serviceType: string,
  items: InvoiceLineItem[],
  total: number,
  paidAmount: number,
  status: "confirmed" | "in_progress" | "completed" | "cancelled",
  scheduledDate: Timestamp,
  addressId: string,
  invoice: CanonicalInvoice,
  createdAt: Timestamp
}

CanonicalJob {
  id: string,
  bookingId: string,
  customerId: string,
  technicianId?: string,
  serviceType: string,
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "cancelled",
  items: InvoiceLineItem[],
  total: number,
  scheduledDate: Timestamp,
  photos: string[],
  notes: string,
  createdAt: Timestamp
}

CreateBookingRequest {
  customerId: string,
  serviceType: string,
  items: { productId: string, name: string, quantity: number, unitPrice: number }[],
  total: number,
  paymentId: string,
  scheduledDate: string,
  timeSlot: string,
  addressId: string
}

InvoiceLineItem {
  productId: string,
  name: string,
  quantity: number,
  unitPrice: number,
  total: number
}

ApiResponse<T> {
  success: boolean,
  data?: T,
  error?: string
}
```

### SDUI Contracts (`contracts/sdui_contracts.ts`)
```typescript
SduiComponent {
  type: "banner_carousel" | "service_grid" | "recommendation_row" | "product_row" | "text_block" | "image_block" | "action_button",
  data: any,
  children?: SduiComponent[],
  actions?: SduiAction[],
  visibility?: SduiVisibility,
  styles?: SduiStyles
}

SduiLayout {
  screen: string,
  version: number,
  sections: SduiSection[]
}

SduiAction {
  type: "navigate" | "api_call" | "open_url",
  payload: any,
  navigation?: { route: string, params?: any }
}

SduiVisibility {
  roles?: string[],
  locations?: string[],
  featureFlags?: string[]
}
```

### Shared Types (`types.ts`)
- `AuthUser { uid, email, name, role, token }`
- `DashboardMetrics { ... }`
- `CustomerRecord { ... }`
- `TechnicianRecord { ... }`
- `JobRecord { ... }`
- `PaymentRecord { ... }`
- `Employee { ... }`
- `Earning { ... }`
- `FirestoreUser { ... }`
- `FirestoreCustomer { ... }`
- `FirestoreEmployee { ... }`
- `SavedAddress { ... }`
- All catalog types (Product, Service, Category, Group, etc.)

---

## 18. FIRESTORE INTEGRATION

### Collections Used

| Collection | Access Pattern | Route Files |
|-----------|---------------|-------------|
| `users` | Read/Write by UID | users.ts |
| `customers` | CRUD by ID | customers.ts, addresses.ts |
| `employees` | CRUD by ID | employees.ts |
| `technicians` | CRUD by ID | technicians.ts |
| `admins` | Read by email/UID | auth.ts |
| `jobs` | CRUD, filtered queries | jobs.ts |
| `bookings` | CRUD by customer | bookings.ts |
| `payments` | CRUD | payments.ts |
| `catalog_product` | CRUD, public read | catalog.ts, catalogPublic.ts |
| `catalog_packages` | CRUD | catalog.ts |
| `catalog_addons` | CRUD | catalog.ts |
| `catalog_taxes` | CRUD | catalog.ts |
| `catalog_recommendations` | CRUD, query by placement | recommendations.ts |
| `catalog_invoice_templates` | CRUD | catalog.ts |
| `Services` | Tree read/write | servicesAdmin.ts, catalogService.ts |
| `sdui_layouts` | CRUD | sdui.ts, sduiAdmin.ts |
| `home_cms` | CRUD | homeCms.ts |
| `serviceable_areas` | CRUD, geo query | serviceability.ts |
| `earnings` | Read by employee | earningsService.ts |

### Firestore Indexes
- `jobs` by `employeeId` + `status`
- `bookings` by `customerId` + `createdAt`
- `catalog_product` by `category` + `status` + `displayOrder`

### Firestore Rules
- Admin write access to all collections
- Authenticated read for user-specific data
- Public read for catalog and SDUI data

---

## 19. BLOCK DIAGRAMS

### Request Lifecycle
```
Mobile App / Admin Dashboard
        │
        ▼
   HTTP Request
        │
        ▼
   CORS Middleware
        │
        ▼
   JSON Body Parser
        │
        ▼
   Auth Middleware ──── JWT (admin) or Firebase ID token (mobile)
        │
        ▼
   Route Handler ──── Zod Validation
        │
        ├──→ Service Layer ───→ Firestore CRUD
        │
        ▼
   Response (JSON)
```

### Payment Flow
```
Customer App → POST /api/payments/razorpay/create-order
        │
        ▼
Razorpay SDK → Order created
        │
        ▼
Customer completes payment in Razorpay Checkout
        │
        ▼
Customer App → POST /api/payments/razorpay/verify
        │
        ▼
HMAC Signature Verification
        │
        ├── Valid ──→ POST /api/bookings → Create Booking
        │
        └── Invalid → 400 Bad Request → Payment Failed
```

### Service Tree Construction
```
Admin Dashboard → Service Tree Builder UI
        │
        ▼
POST /api/catalog/services-admin/... → Firestore Services collection
        │
        ▼
Customer App → GET /api/catalog-public/pricing/installation
        │
        ▼
catalogService.ts → getPricingContract()
        │
        ▼
Firestore Services → Resolve product refs → Build tree
        │
        ▼
Return pricing contract to customer app
        │
        ▼
Customer App renders DynamicServiceScreen with tree data
```

---

## 20. MULTI-CASE BEHAVIOR ANALYSIS

### Case 1: Account Merge — Same Phone, Different Google Account
1. User A signs in with Google (Firebase UID-A)
2. User A provides phone: 9999999999 → new Firestore user created
3. User B signs in with different Google account (Firebase UID-B)
4. User B provides same phone: 9999999999
5. `GET /api/users/by-phone/9999999999` returns existing user
6. `POST /api/users/link` detects collision
7. `mergeFirestoreUserAccounts(UID-A, UID-B)` called
8. Both Firebase UIDs point to same Firestore document
9. Booking history merged, secondary UID soft-deleted

### Case 2: Job Pickup Race Condition
1. Two employees see same unassigned job simultaneously
2. Both tap "Accept" at almost the same time
3. Employee 1: `POST /api/jobs/:id/pickup` → success (status → assigned)
4. Employee 2: `POST /api/jobs/:id/pickup` → 409 Conflict
5. Employee 2's app shows "Job was just taken"
6. Employee 2's available jobs refreshes (job removed)

### Case 3: Razorpay Payment Verification Failure
1. Customer completes payment on Razorpay
2. `POST /api/payments/razorpay/verify` receives invalid signature
3. HMAC comparison fails → 400 response
4. Customer app shows error: "Payment verification failed"
5. Booking NOT created (no POST /api/bookings)
6. Customer can retry payment or contact support
7. Admin can see failed payment attempts in payment logs

### Case 4: Public Catalog Caching
1. Multiple customer apps hit `GET /api/catalog-public/pricing/installation`
2. Backend fetches from Firestore each time (no in-memory cache)
3. Response size can be large (full service tree with product references)
4. No stale-while-revalidate or CDN caching configured
5. Under heavy load: Firestore read quota exhausted

### Case 5: Admin Creates Job with Overlapping Schedule
1. Admin creates job for technician on a booked time slot
2. Backend does NOT check for schedule conflicts
3. Job created successfully
4. Employee app shows time conflict warning
5. Employee must manually prioritize or contact admin

---

## 21. KNOWN ISSUES & FIXES REQUIRED

### Issue 1: No In-Memory Caching for Public Catalog
- **Problem:** Every public catalog request hits Firestore directly
- **Location:** `catalogService.ts` — `getPricingContract()`
- **Impact:** Firestore read costs scale linearly with traffic
- **Fix:** Implement Redis or in-memory cache with TTL for public endpoints

### Issue 2: No Input Validation on Several Endpoints
- **Problem:** Some admin endpoints lack Zod validation schemas
- **Location:** Various route files
- **Fix:** Add Zod validation middleware to all POST/PATCH endpoints

### Issue 3: No Schedule Conflict Detection
- **Problem:** Jobs can be assigned to technicians with overlapping schedules
- **Location:** `jobs.ts` — `POST /api/jobs` and `POST /api/jobs/:id/pickup`
- **Fix:** Check for existing jobs at same time slot before assignment

### Issue 4: Firestore Read Quotas at Scale
- **Problem:** No caching layer, every request = Firestore read
- **Location:** All route handlers
- **Fix:** Implement CDN caching for public endpoints, in-memory cache for admin

### Issue 5: No Rate Limiting
- **Problem:** Public endpoints have no rate limiting
- **Location:** `catalogPublic.ts`, `sdui.ts`
- **Fix:** Add express-rate-limit middleware

### Issue 6: Error Responses Inconsistent
- **Problem:** Some endpoints return `{ error: string }`, others `{ message: string }`, others plain text
- **Location:** Various route files
- **Fix:** Standardize on `ApiResponse<T>` pattern across all endpoints

### Issue 7: No Request Logging Middleware
- **Problem:** No structured request/response logging
- **Location:** App entry point
- **Fix:** Add morgan or Winston middleware for HTTP logging

### Issue 8: Razorpay Webhook Not Implemented
- **Problem:** Payment status updates rely on client-side verification only
- **Location:** `razorpay.ts`
- **Fix:** Implement Razorpay webhook for server-side payment confirmation

### Issue 9: No Data Pagination on Some List Endpoints
- **Problem:** Some list endpoints don't support pagination
- **Location:** Various route files
- **Fix:** Add cursor-based or offset-based pagination to all list endpoints

---

## APPENDIX: COMPLETE ENDPOINT INDEX

### Admin Auth
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | None | Admin login |

### Dashboard
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/admin/metrics` | Admin | Dashboard metrics |

### Users
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/users/link` | Firebase | Link user |
| GET | `/api/users/by-email/:email` | None | Check email |
| GET | `/api/users/by-phone/:phone` | None | Check phone |
| GET | `/api/users/me` | Firebase | Current user |
| GET | `/api/users/:id` | Firebase | Get user |

### Customers
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/customers` | Admin | List |
| GET | `/api/customers/:id` | Auth | Get |
| POST | `/api/customers` | Admin | Create |
| PATCH | `/api/customers/:id` | Auth | Update |
| DELETE | `/api/customers/:id` | Admin | Delete |

### Addresses
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `.../customerId/addresses` | Auth | List |
| POST | `.../customerId/addresses` | Auth | Create |
| PATCH | `.../customerId/addresses/:id` | Auth | Update |
| DELETE | `.../customerId/addresses/:id` | Auth | Delete |

### Employees
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/employees/:id` | Firebase | Profile |
| PATCH | `/api/employees/:id` | Firebase | Update |
| GET | `/api/employees/:id/earnings` | Firebase | Earnings |
| POST | `/api/employees/device-token` | Firebase | FCM token |
| POST | `/api/employees/location` | Firebase | Location |

### Technicians
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/technicians` | Admin | List |
| GET | `/api/technicians/:id` | Admin | Get |
| POST | `/api/technicians` | Admin | Create |
| PATCH | `/api/technicians/:id` | Admin | Update |
| DELETE | `/api/technicians/:id` | Admin | Delete |
| POST | `.../:id/password` | Admin | Reset password |

### Jobs
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/jobs` | Auth | List |
| GET | `/api/jobs/:id` | Auth | Get |
| POST | `/api/jobs` | Admin | Create |
| PATCH | `/api/jobs/:id` | Auth | Update |
| DELETE | `/api/jobs/:id` | Admin | Delete |
| POST | `/api/jobs/:id/pickup` | Firebase | Accept |
| POST | `/api/jobs/:id/complete` | Firebase | Complete |

### Bookings
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/bookings` | Firebase | List |
| GET | `/api/bookings/:id` | Firebase | Get |
| POST | `/api/bookings` | Firebase | Create |
| PATCH | `/api/bookings/:id` | Admin | Update |
| DELETE | `/api/bookings/:id` | Admin | Delete |

### Payments
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/payments` | Admin | List |
| GET | `/api/payments/:id` | Admin | Get |
| DELETE | `/api/payments/:id` | Admin | Delete |
| POST | `/api/payments/:id/request` | Admin | Request |

### Razorpay
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payments/razorpay/create-order` | Firebase | Create order |
| POST | `/api/payments/razorpay/verify` | Firebase | Verify |

### Catalog (Admin)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/products` | None | List |
| GET | `/api/catalog/products/:id` | None | Get |
| POST | `/api/catalog/products` | Admin | Create |
| PATCH | `/api/catalog/products/:id` | Admin | Update |
| DELETE | `/api/catalog/products/:id` | Admin | Delete |
| GET | `/api/catalog/packages` | Token | List packages |
| POST | `/api/catalog/packages` | Admin | Create |
| PATCH | `/api/catalog/packages/:id` | Admin | Update |
| DELETE | `/api/catalog/packages/:id` | Admin | Delete |
| GET | `/api/catalog/addons` | Token | List addons |
| POST | `/api/catalog/addons` | Admin | Create |
| PATCH | `/api/catalog/addons/:id` | Admin | Update |
| DELETE | `/api/catalog/addons/:id` | Admin | Delete |
| GET | `/api/catalog/taxes` | Token | List taxes |
| POST | `/api/catalog/taxes` | Admin | Create |
| PATCH | `/api/catalog/taxes/:id` | Admin | Update |
| DELETE | `/api/catalog/taxes/:id` | Admin | Delete |
| GET | `/api/catalog/recommendations` | None | List |
| POST | `/api/catalog/recommendations` | Admin | Create |
| PATCH | `/api/catalog/recommendations/:id` | Admin | Update |
| DELETE | `/api/catalog/recommendations/:id` | Admin | Delete |
| GET | `/api/catalog/invoices` | Token | List templates |
| POST | `/api/catalog/invoices` | Admin | Create |
| PATCH | `/api/catalog/invoices/:id` | Admin | Update |
| DELETE | `/api/catalog/invoices/:id` | Admin | Delete |

### Catalog (Public)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog-public/services` | None | Services |
| GET | `/api/catalog-public/pricing/installation` | None | Installation |
| GET | `/api/catalog-public/pricing/maintenance` | None | Maintenance |
| GET | `/api/catalog-public/pricing/repair` | None | Repair |
| GET | `/api/catalog-public/pricing/amc` | None | AMC |
| GET | `/api/catalog-public/upgrade` | None | Upgrades |
| GET | `/api/catalog-public/accessories` | None | Accessories |
| GET | `/api/catalog-public/products` | None | Products |
| GET | `/api/catalog-public/recommendations` | None | Recommendations |

### SDUI
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/sdui/layout` | None | Screen layout |
| GET | `/api/sdui/screens` | None | Screen list |

### SDUI Admin
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/sdui-admin/layouts` | Admin | List |
| GET | `/api/catalog/sdui-admin/layouts/:id` | Admin | Get |
| POST | `/api/catalog/sdui-admin/layouts/:id` | Admin | Save |
| POST | `/api/catalog/sdui-admin/layouts/:id/reset` | Admin | Reset |
| GET | `/api/catalog/sdui-admin/feature-flags` | Admin | List |
| POST | `/api/catalog/sdui-admin/feature-flags/:key` | Admin | Set |

### CMS
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/home-cms` | None | Visible blocks |
| GET | `/api/home-cms/admin` | Admin | All blocks |
| POST | `/api/home-cms` | Admin | Create |
| PATCH | `/api/home-cms/:id` | Admin | Update |
| DELETE | `/api/home-cms/:id` | Admin | Delete |

### Serviceability
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/serviceability` | None | Check area |

---

**END OF AUDIT**
