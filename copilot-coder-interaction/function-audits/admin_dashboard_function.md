# ADMIN DASHBOARD — COMPLETE FUNCTION AUDIT

**Date:** 2026-06-08
**Scope:** Every function, button, behavior, Firestore storage pattern, admin display, and customer reflection

---

## TABLE OF CONTENTS

1. [Authentication Flow](#1-authentication-flow)
2. [Dashboard Home](#2-dashboard-home)
3. [Customer Management](#3-customer-management)
4. [Technician Management](#4-technician-management)
5. [Job Management](#5-job-management)
6. [Payment Management](#6-payment-management)
7. [Catalog Management](#7-catalog-management)
8. [Service Tree Builder (Core)](#8-service-tree-builder-core)
9. [Mobile Preview / SDUI](#9-mobile-preview--sdui)
10. [Settings — Serviceable Areas](#10-settings--serviceable-areas)
11. [Firestore Data Model Reference](#11-firestore-data-model-reference)
12. [Block Diagrams](#12-block-diagrams)
13. [Multi-Case Behavior Analysis](#13-multi-case-behavior-analysis)
14. [Known Issues & Fixes Required](#14-known-issues--fixes-required)

---

## 1. AUTHENTICATION FLOW

### Login Screen
- **Fields:** Email (text, required), Password (password, with show/hide toggle)
- **Button:** "Sign In" (disabled while loading)
- **Behavior:**
  1. Calls `signInWithEmailAndPassword` (Firebase Auth SDK)
  2. Obtains Firebase ID token
  3. POSTs to `POST /api/auth/login` with `{ email, firebaseUid }` + `Authorization: Bearer <idToken>`
  4. Backend validates against `admins` collection (by `firebaseUid` or `email`)
  5. On success: stores token in `localStorage('safecom_admin_token')`, admin object in `localStorage('safecom_admin')`
  6. Zustand store updated → router guard allows access
  7. On failure: Firebase sign-out, localStorage cleared, error displayed

### Logout
- **Button:** Logout (sidebar footer)
- **Behavior:** Firebase sign-out → localStorage clear → redirect to `/login`

### Firestore Storage
- **Collection:** `admins`
- **Fields:** `{ email, name, role: 'super_admin'|'admin', firebaseUid }`

### Customer Reflection
- None — admin-only

---

## 2. DASHBOARD HOME

### Metrics Displayed (6 cards)
| Metric | Icon | Source | Animation |
|--------|------|--------|-----------|
| Total Customers | people | `GET /api/admin/metrics` | `useCounter` animated |
| Active Technicians | wrench | same | animated |
| Pending Jobs | hourglass | same | animated |
| Total Revenue | ₹ | same (displayed in lakhs) | animated |
| Completion Rate | % | same | animated |
| Avg Response Time | hours | same | animated |

### Quick Actions (3 buttons)
| Button | Action |
|--------|--------|
| "Add Technician" | Navigate to `/technicians/new` |
| "Create Job" | Navigate to `/jobs/new` |
| "View Reports" | Toggle revenue chart visibility |

### Additional Sections
- **Revenue Trend:** Recharts `LineChart` — last 7 dates from bookings
- **System Status:** Firestore, Firebase Auth, Payment Gateway, Notification indicators
- **Top Technicians:** Name, jobs completed, rating (progress bar)
- **Recent Bookings:** Table (service type, amount, status, date) — max 5

### Firestore Storage
- **Collection:** `bookings`, `customers`, `employees`, `jobs`
- Reads aggregated metrics — no direct writes

### Customer Reflection
- None — admin-only dashboard

---

## 3. CUSTOMER MANAGEMENT

### Customer List Screen
- **Search:** By name or email (text input)
- **Sort:** Clickable column headers (name, email, phone, totalOrders, totalSpent, status)
- **Pagination:** Previous/Next buttons
- **Bulk Actions:**
  - Select all checkbox (header)
  - Per-row checkbox
  - Bulk delete: `DELETE /api/customers/{id}` for each selected
- **Row Actions:**
  - View → `/customers/{id}`
  - Edit → `/customers/{id}/edit`
  - Delete → Confirm dialog → `DELETE /api/customers/{id}` → page reload

### Customer Detail Screen
- **Tabs:** Info, Jobs, Payments
- **Info Tab:** Email (mailto link), Phone (tel link), Address, Status, Member Since, Total Orders, Lifetime Value
- **Jobs Tab:** Table — job ID, service type, technician, status, amount, scheduled date
- **Payments Tab:** Table — payment ID, job ID, amount, method, date + total paid summary
- **Buttons:** Back, Edit Customer

### Customer Form Screen (Create/Edit)
- **Fields:** Full Name (required), Email (required, validated), Phone (required), Address (textarea, required), Status (select: active/inactive)
- **Buttons:** Cancel, Submit ("Create Customer" / "Update Customer")
- **Create Behavior:** `POST /api/customers` with `{ totalOrders: 0, totalSpent: 0 }`
- **Update Behavior:** `PATCH /api/customers/:id`

### Firestore Storage
- **Collection:** `customers`
- **Fields:** `{ name, email, phone, address, status, totalOrders, totalSpent, createdAt, updatedAt }`

### Customer Reflection
- Customer data visible in customer mobile app profile
- `totalOrders` and `totalSpent` updated by booking/payment flows

---

## 4. TECHNICIAN MANAGEMENT

### Technician List Screen
- Same pattern as customers: search, sort, bulk select/delete, individual CRUD
- **Table Columns:** Name, Email, Location, Total Jobs, Rating (★ + decimal), Status

### Technician Detail Screen (3 modes: New/Edit/View)

#### Create Mode
- **Fields:** Name, Email, Phone (auto-normalizes to +91 prefix), Location, Status (available/on-job/inactive), Skills (comma-separated, Enter to add), Password (min 6 chars)
- **Button:** "Create Technician"
- **Behavior:**
  1. Validates all fields + password
  2. `POST /api/technicians` with `{ name, email, phone, password, location, skills, status }`
  3. Backend creates Firebase Auth user + Firestore record
  4. Shows alert with credentials to share with technician

#### Edit Mode
- **Fields:** Same as Create (without password)
- **Additional Button:** "Set Password" → `POST /api/technicians/:id/password` with `{ password }`
- **Update:** `PATCH /api/technicians/:id`
- **Delete:** `DELETE /api/technicians/:id` → navigate to list

#### View Mode
- **Sections:** Profile (name, rating, status, email, phone, location, total jobs, joining date)
- **Stats:** Completed jobs, earnings, skills count
- **Skills Tags:** Displayed as chips
- **Tabs:** Info, Jobs (table of assigned jobs)

### Firestore Storage
- **Collection:** `employees`
- **Fields:** `{ name, email, phone, location, skills, status, totalJobs, rating, password, createdAt }`
- **Firebase Auth:** Separate user created with email/password

### Customer Reflection
- Technicians visible in employee mobile app
- Assigned to jobs visible in customer's booking history

---

## 5. JOB MANAGEMENT

### Job List Screen
- Search by job ID or service type
- Sort, bulk select/delete
- **Edit button:** Only for `pending` status jobs
- **Status colors:** completed=success, in-progress=warning, pending=info, cancelled=error

### Job Detail Screen (3 modes: New/Edit/View)

#### Create Mode
- **Fields:** Customer ID, Service Type, Amount, Scheduled Date (date picker, defaults today), Technician ID (optional), Address (optional), Notes (optional)
- **Button:** "Create Job"
- **Behavior:** `POST /api/jobs` with `{ customerId, serviceType, amount, scheduledDate, technicianId, notes, address, status: 'pending' }`

#### Edit Mode
- Same fields, pre-populated
- **Update:** `adminDatasource.updateJob()`

#### View Mode
- **Sections:** Job info (ID, service type, status badge, customer ID link, technician ID link, amount, scheduled dates)
- **Status Buttons:** pending → assigned → in-progress → completed → cancelled
- **Status Change:** `adminDatasource.updateJob()` + sets `completedDate` on completion
- **Generate Invoice:** Opens `InvoiceGeneratorModal`
- **Service Location:** Customer name, phone, address, coordinates, Google Maps link
- **Job Timeline:** Visual timeline with status markers

### Invoice Generator Modal
- **Calculations:** `taxAmount = amount × 0.18` (18% GST), `subtotal = amount - taxAmount`
- **Invoice Number:** `INV-{job.id.substring(0,8).toUpperCase()}`
- **Content:** Company info, bill to (customer ID), line item, subtotal, tax, total
- **Button:** "Download PDF" → Opens print dialog in new window

### Firestore Storage
- **Collection:** `jobs`
- **Fields:** `{ customerId, serviceType, amount, scheduledDate, technicianId, status, notes, address, completedDate, createdAt }`

### Customer Reflection
- Jobs appear in customer's booking list
- Status changes trigger notifications

---

## 6. PAYMENT MANAGEMENT

### Payments Screen
- **Stats Cards:** Total Amount, Paid (green), Pending (amber) — amounts in paise/100
- **Filter Buttons:** All, Pending, Partial, Completed (with counts)
- **Search:** By transaction ID or customer name
- **Sort:** All columns clickable
- **Bulk Actions:** Select all, per-row checkbox, bulk delete

### Row Actions
- View Customer → `/customers/{customerId}`
- Request Payment (if not completed) → `POST /api/payments/:id/request` with `{ amount: remainingAmount }`
- Delete → `DELETE /api/payments/:id`

### Firestore Storage
- **Collection:** `payments`
- **Fields:** `{ customerId, customerName, jobId, amount, paidAmount, remainingAmount, status, paymentMethod, transactionId, createdAt }`

### Customer Reflection
- Payment requests trigger notifications to customer
- Customer sees payment status in booking history

---

## 7. CATALOG MANAGEMENT

### 9 Tabs

#### Tab 1: PRODUCTS
- **Toolbar:** Category dropdown + new category input, Group dropdown + new group input, Search
- **Table:** Checkbox, Product (name + ID), Category, Price, Status, Actions (Edit/Delete)
- **Modal Form:** Name, Category (dropdown + new input), Group (dropdown + new input), Unit, Price, Status
- **CRUD:** `POST /api/catalog/products`, `PATCH /api/catalog/products/:id`, `DELETE /api/catalog/products/:id`
- **Bulk Delete:** Deletes all selected products

#### Tab 2: PACKAGES
- **Table:** Name, Price, Status, Actions
- **Form:** Name, Description (textarea), Final Price, Status
- **CRUD:** `POST /api/catalog/packages`, `PATCH /api/catalog/packages/:id`, `DELETE /api/catalog/packages/:id`

#### Tab 3: ADD-ONS
- **Table:** Name, Category, Price, Status, Actions
- **Form:** Name, Category, Price
- **CRUD:** `POST /api/catalog/addons`, `PATCH /api/catalog/addons/:id`, `DELETE /api/catalog/addons/:id`

#### Tab 4: TAXES
- **Table:** Name, Rate (%), Status, Actions
- **Form:** Tax Name, Rate
- **CRUD:** `POST /api/catalog/taxes`, `PATCH /api/catalog/taxes/:id`, `DELETE /api/catalog/taxes/:id`

#### Tab 5: SERVICES
- **Table:** Service Name, Category, Price, Status, Actions
- **Form:** Service Name, Description, Category, Base Price, Available toggle
- **CRUD:** `POST /api/catalog/services`, `PATCH /api/catalog/services/:id`, `DELETE /api/catalog/services/:id`

#### Tab 6: RECOMMENDATIONS
- **Table:** Name, Placement (checkout/cart/service), Status, Actions
- **Form:** Name, Placement, Display Priority
- **CRUD:** `POST /api/catalog/recommendations`, `PATCH /api/catalog/recommendations/:id`, `DELETE /api/catalog/recommendations/:id`

#### Tab 7: INVOICES
- **Table:** Template Name, Status, Actions
- **Form:** Name, Notes (textarea)
- **CRUD:** `POST /api/catalog/invoices`, `PATCH /api/catalog/invoices/:id`, `DELETE /api/catalog/invoices/:id`

#### Tab 8: UPGRADE
- **Read-only table:** ID, Name, Description, Price
- Data from `Services/Camera_System_Upgrade`

#### Tab 9: PRICING
- **Grid:** 4 sections (Installation, Maintenance, Repair, AMC)
- **Each shows:** Name, categories count, plans count, issues count
- **Button:** "Configure Tree" → navigates to `/catalog/builder/{serviceId}`

### Firestore Collections
| Tab | Collection |
|-----|------------|
| Products | `catalog_product` |
| Packages | `catalog_packages` |
| Add-ons | `catalog_addons` |
| Taxes | `catalog_taxes` |
| Services | `catalog_services` |
| Recommendations | `catalog_recommendations` |
| Invoices | `catalog_invoices` |
| Upgrade | `Services/Camera_System_Upgrade` |
| Pricing | `Services/Installation`, `Services/Maintenance`, `Services/Camera_Repair`, `Services/AMC` |

### Customer Reflection
- Products visible in customer product catalog
- Services/pricing visible in service booking flow
- Recommendations shown at checkout
- Upgrade bundles visible in upgrade flow

---

## 8. SERVICE TREE BUILDER (Core — Most Complex)

### Purpose
Recursive tree builder for configuring service packages (Installation, Maintenance, Camera Repair, AMC).

### Data Model
```
Category → Setup[] → ProductSlot[] → TreeNode[] (recursive)
```

### TreeNode Properties
| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Unique identifier |
| `isLeaf` | boolean | True = selectable product, False = branch with children |
| `isField` | boolean | True = dynamic field node |
| `fieldType` | string | 'string' / 'number' / 'boolean' / 'map' |
| `fieldValue` | any | Dynamic field value |
| `productId` | string | Reference to `catalog_product` |
| `productName` | string | Display name |
| `price` | number | Unit price |
| `category` | string | Product category |
| `defaultQty` | number | Default quantity |
| `minQty` | number | Minimum allowed quantity |
| `maxQty` | number | Maximum allowed quantity |
| `available` | boolean | Availability flag |
| `rigid` | boolean | If true, quantity cannot be changed |
| `children` | TreeNode[] | Nested branches |
| `renderType` | string | 'option' or 'list' |
| `selectionType` | string | 'single' or 'multi' |
| `collectiveValidation` | boolean | Validate sum of children collectively |
| `displayLabel` | string | Human-readable label override |
| `mandatory` | boolean | Whether selection is required |
| `dependsOn` | string | Product key this depends on |

### All Buttons & Actions

#### Category Level
| Button/Action | Behavior | API Call |
|---------------|----------|----------|
| Add Category | Creates new category in service doc | `POST /api/catalog/services-admin/config/:serviceId/category` |
| Delete Category | Removes category from service doc | `DELETE /api/catalog/services-admin/config/:serviceId/category/:key` |
| Rename Category | Inline rename | `POST /api/catalog/services-admin/config/:serviceId/category/:categoryKey/rename` |

#### Setup Level
| Button/Action | Behavior | API Call |
|---------------|----------|----------|
| Add Setup | Creates setup under category | `POST /api/catalog/services-admin/config/:serviceId/category/:cat/setup` |
| Delete Setup | Removes setup | `DELETE /api/catalog/services-admin/config/:serviceId/category/:cat/setup/:setup` |
| Rename Setup | Inline rename | `POST /api/catalog/services-admin/config/:serviceId/setup/:setup/rename` |
| Clone Setup | Deep-copies entire setup | `POST /api/catalog/services-admin/config/:serviceId/category/:cat/setup/clone` |

#### Product Level
| Button/Action | Behavior | API Call |
|---------------|----------|----------|
| Add Product | Opens product search modal (multi-select) | `POST /api/catalog/services-admin/config/:serviceId/category/:cat/setup/:setup/product` |
| Delete Product | Removes product slot | `DELETE .../product/:productKey` |
| Club Products | Groups selected slots under new name | `POST .../setup/:setup/club` |

#### Node Level (per product option)
| Button/Action | Behavior | API Call |
|---------------|----------|----------|
| Edit Quantities | Changes default/min/max qty | `PATCH .../node/quantities` |
| Edit Render Config | Sets renderType, selectionType, collectiveValidation, displayLabel, mandatory | `PATCH .../node/render-config` |
| Set Dependency | Sets dependsOn reference | `PATCH .../node/dependency` |
| Remove Dependency | Clears dependsOn | `PATCH .../node/dependency` with `null` |
| Add Branch | Creates nested branch under node | `POST .../branch` |
| Add Leaf Node | Adds product option under node | `POST .../node` |
| Delete Node | Removes node | `DELETE .../node` |
| Rename Node | Inline rename | `POST .../node/rename` |
| Clone Node | Deep-copies node | `POST .../node/clone` |
| Update Dynamic Field | Sets arbitrary field value | `PATCH .../node/dynamic-field` |
| Update Price | Changes price in master catalog | `PATCH /api/catalog/services-admin/product/:productId/price` |

#### Global Actions
| Button | Behavior |
|--------|----------|
| Save Changes | Batch-saves all pending edits to Firestore |
| Stats Bar | Shows: Categories count, Setups count, Products count, Clubs count, Total Value |

### Product Search Modal
- Multi-select search across all master products
- Shows: Name, ID, Category, Group, Price
- Search by name or ID
- Selected products added as new product slots

### Firestore Storage
- **Collection:** `Services`
- **Document:** Service ID (e.g., `Installation`, `Maintenance`, `Camera_Repair`, `AMC`)
- **Structure:** Deeply nested map (see Section 11)

### Customer Reflection
- Service configuration displayed in customer app's service booking flow
- Quantities, prices, render types directly control customer UI behavior

---

## 9. MOBILE PREVIEW / SDUI

### Live Preview
- **Two phone frames:**
  - Left: "Customer View" — what the app actually renders
  - Right: "Edit Preview" — merged SDUI + CMS, clickable to select for editing

### CMS Blocks Management
- **Block Types:** banner, promo, update, category_grid, featured
- **Add Modal:** Type, Display Order, Title, Subtitle, Image URL, CTA Label, CTA Route, Expires At, Visible toggle
- **Edit Modal:** Same fields
- **Actions per block:** Edit, Move up/down, Toggle visibility, Delete
- **CRUD:** `POST /api/home-cms`, `PATCH /api/home-cms/:id`, `DELETE /api/home-cms/:id`

### SDUI Layout Editor
- **Component List:** Left sidebar with up/down reorder
- **Component Types:** location_header, section_title, banner, promo_banner, info_card, service_grid, spacer, announcements_list, horizontal_recommendations/services/products
- **Component Editor Panel:** Edit text, colors, config per type
- **Announcements Editor:** Add/remove items with title, body, icon, color
- **Save:** `POST /api/catalog/sdui-admin/layouts/:id`
- **Reset:** `POST /api/catalog/sdui-admin/layouts/:id/reset`

### Firestore Storage
- **Collections:** `sdui_layouts`, `sdui_feature_flags`, `home_cms`

### Customer Reflection
- SDUI layout directly controls customer app's home screen
- CMS blocks appear as banners, promos, updates on home screen

---

## 10. SETTINGS — SERVICEABLE AREAS

### Serviceable Areas Screen
- **Table:** Code, Area Name, Coordinates, Radius (km), Est. Time, Status (toggle), Actions (Delete)
- **Add Modal:** Area Code (uppercase alphanumeric), Area Name, Latitude, Longitude, Coverage Radius (km), Est. Time to Service
- **Default Coordinates:** 25.5941, 85.1376 (Patna, India)
- **Toggle:** `PATCH /api/serviceable-areas/:areaCode` — toggles `active` status
- **Delete:** `DELETE /api/serviceable-areas/:areaCode`
- **Add:** `POST /api/serviceable-areas`

### Firestore Storage
- **Collection:** `serviceable_areas`
- **Fields:** `{ areaCode, areaName, latitude, longitude, radiusKm, estimatedTimeToService, active }`

### Customer Reflection
- Customer app checks GPS location against active serviceable areas
- Determines if service is available at user's location

---

## 11. FIRESTORE DATA MODEL REFERENCE

### Services Collection (Deeply Nested Map)

```
Services/{serviceId}
├── _meta
│   ├── title: string
│   ├── icon: string
│   ├── enabled: boolean
│   ├── createdAt: string
│   └── updatedAt: string
│
├── {Category Name}
│   ├── {Setup Name}
│   │   ├── {Product 1}
│   │   │   ├── {Product 1 Option 1}
│   │   │   │   ├── "Deafult q": number (default: 1)
│   │   │   │   ├── "min q": number (default: 0)
│   │   │   │   ├── "max q": number (default: 50)
│   │   │   │   ├── "Price": DocumentReference → catalog_product
│   │   │   │   ├── "{optionKey} ID": DocumentReference → catalog_product
│   │   │   │   ├── "available": boolean
│   │   │   │   ├── "rigid": boolean
│   │   │   │   ├── "renderType": "option" | "list"
│   │   │   │   ├── "selectionType": "single" | "multi"
│   │   │   │   ├── "collectiveValidation": boolean
│   │   │   │   ├── "displayLabel": string
│   │   │   │   ├── "mandatory": boolean
│   │   │   │   └── "dependsOn": string | null
│   │   │   │
│   │   │   └── {Product 1 Option 2} (same structure)
│   │   │
│   │   └── {Product 2} (same structure)
│   │
│   └── {Another Setup} (same structure)
│
└── {Another Category} (same structure)
```

### catalog_product Collection

```
catalog_product/{productId}
├── name: string
├── productName: string
├── category: string
├── group: string
├── unit: string
├── price: number
├── basePrice: number
├── status: "active" | "inactive"
├── isAvailable: boolean
├── pricingTiers: Array<{ minQuantity, unitPrice }>
├── variants: Array<{ variantId, name, options[], allowMultiple, required }>
├── stock: number
├── isFeatured: boolean
├── imageUrl: string
├── taxRate: number
├── createdAt: string
└── updatedAt: string
```

---

## 12. BLOCK DIAGRAMS

### 12.1 Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Admin Login │────▶│ Firebase Auth │────▶│  Backend API │────▶│  Firestore   │
│  (Email/Pass)│     │  signIn()     │     │  /auth/login │     │  admins col  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                           │                     │
                    ID Token obtained      JWT/Token stored
                           │                     │
                    ┌──────────────┐        ┌──────────────┐
                    │  Zustand     │◀───────│  localStorage │
                    │  Auth Store  │        │  (token+user) │
                    └──────────────┘        └──────────────┘
```

### 12.2 Service Tree Data Flow

```
┌─────────────────┐
│  Admin Dashboard │
│  (React Web App) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Service Tree    │────▶│  Backend API      │────▶│  Firestore       │
│  Builder UI      │     │  /services-admin  │     │  Services/{id}   │
│  (visual editor) │     │  (30+ endpoints)  │     │  (nested map)    │
└─────────────────┘     └──────────────────┘     └──────────────────┘
         │                                              │
         │ pending edits                                │
         ▼                                              │
┌─────────────────┐                                     │
│  Local State     │──── "Save Changes" ────────────────┘
│  (batch edits)   │
└─────────────────┘
```

### 12.3 Customer Reflection Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Admin Config    │────▶│  Backend API      │────▶│  Customer App    │
│  (Tree Builder)  │     │  /catalog-public  │     │  (Flutter)       │
└─────────────────┘     │  /pricing/*        │     └────────┬────────┘
                        └──────────────────┘              │
                                                          ▼
                                                ┌──────────────────┐
                                                │ Installation     │
                                                │ Customization    │
                                                │ Screen           │
                                                │                  │
                                                │ • QuantityStepper│
                                                │ • ClubbedProduct │
                                                │   Selector       │
                                                │ • ListProduct    │
                                                │   GroupWidget    │
                                                │ • Dependency     │
                                                │   Engine         │
                                                └──────────────────┘
```

### 12.4 Product Quantity Flow

```
┌─────────────────────────────────────────────────────────┐
│                    FIRESTORE                             │
│  Services/Installation → Category → Setup → Product     │
│                                                          │
│  "Deafult q": 4    ← Default quantity                   │
│  "min q": 1        ← Minimum allowed                    │
│  "max q": 8        ← Maximum allowed                    │
│  "dependsOn": null ← Dependency reference                │
│  "rigid": false    ← Can user edit?                     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND API                           │
│  GET /api/catalog-public/pricing/installation           │
│                                                          │
│  Extracts: defaultQty, minQty, maxQty, dependsOn        │
│  For clubbed: recursively extracts from all options     │
│  Slot-level "max q" overrides leaf-level if present     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 CUSTOMER APP (Flutter)                   │
│  InstallationFlowNotifier._buildItemsFromGroup()        │
│                                                          │
│  Creates InvoiceLineItem per product:                   │
│    quantity = defaultQty                                 │
│    minQty = from server                                 │
│    maxQty = from server                                 │
│    canEditQuantity = (dependsOn == null) &&             │
│                      (minQty != maxQty)                 │
│                                                          │
│  _applyDependencies() runs on every change:             │
│    Sum all source items → set dependent qty             │
│    Lock dependent (canEditQuantity = false)             │
└─────────────────────────────────────────────────────────┘
```

### 12.5 Render Type Decision Tree

```
                    ┌──────────────────┐
                    │ Is product       │
                    │ clubbed?         │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │ YES                      │ NO
                ▼                          ▼
        ┌──────────────┐          ┌──────────────┐
        │ Has LIST     │          │ renderType   │
        │ branches?    │          │ = 'list'?    │
        └──────┬───────┘          └──────┬───────┘
               │                          │
        ┌──────┴──────┐           ┌───────┴──────┐
        │ YES          │           │ YES           │
        ▼              │           ▼               │
  ┌──────────┐        │     ┌──────────┐         │
  │ Branch   │        │     │ Flat     │         │
  │ Selectors│        │     │ LIST     │         │
  │ + LIST   │        │     │ children │         │
  │ children │        │     └──────────┘         │
  └──────────┘        │                           │
                      │  ┌──────────────┐        │
                      │  │ selectionType│        │
                      │  │ = 'multi'?   │        │
                      │  └──────┬───────┘        │
                      │         │                 │
                      │  ┌──────┴──────┐         │
                      │  │ YES          │         │
                      │  ▼              │         │
                      │ ┌──────────┐   │         │
                      │ │ Checkbox │   │         │
                      │ │ selector │   │         │
                      │ └──────────┘   │         │
                      │                 │         │
                      │  ┌──────────────┐        │
                      │  │ Default:     │        │
                      │  │ Clubbed      │        │
                      │  │ Product      │        │
                      │  │ Selector     │        │
                      │  │ (drill-down) │        │
                      │  └──────────────┘        │
                      └──────────────────────────┘
```

### 12.6 Dependency Engine Flow

```
┌─────────────────────────────────────────────────────┐
│ User changes quantity of any product                 │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ _updateQuantity()                                   │
│   nextQty = isIncrement ? qty+1 : qty-1            │
│   safeQty = nextQty.clamp(minQty, maxQty)          │
│   item.quantity = safeQty                           │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ _applyDependencies()                                │
│                                                     │
│ FOR each entry in _dependencyMap:                   │
│   sourceKey = entry.key                             │
│   depKeys = entry.value (list of dependent items)   │
│                                                     │
│   sourceItems = items WHERE parentProductKey        │
│                 == sourceKey                        │
│   totalQty = SUM(sourceItems.quantity)              │
│                                                     │
│   FOR each depKey in depKeys:                       │
│     idx = items.indexWhere(key == depKey)           │
│     items[idx].quantity = totalQty                  │
│     items[idx].canEditQuantity = false              │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ State update → UI rebuild                          │
│   Dependent item shows locked quantity             │
│   Stepper buttons disabled (gray)                  │
└─────────────────────────────────────────────────────┘
```

---

## 13. MULTI-CASE BEHAVIOR ANALYSIS

### Case 1: Setup is LIST, Products are OPTION form

**Example:** Camera category with `renderType: "list"` on the Camera group, and individual cameras have `renderType: "option"`.

**Admin Configuration:**
```
Camera (renderType: "list", collectiveValidation: true)
├── 4MP Group (renderType: "option", selectionType: "multi")
│   ├── CP Plus 4MP Indoor Camera (defaultQty: 4, min: 1, max: 8)
│   └── CP Plus 4MP Outdoor Camera (defaultQty: 4, min: 1, max: 8)
└── 2MP Group (renderType: "option")
    ├── CP Plus 2MP Indoor Camera (defaultQty: 4, min: 1, max: 8)
    └── CP Plus 2MP Outdoor Camera (defaultQty: 4, min: 1, max: 8)
```

**Firestore Storage:**
```
Services/Installation → Camera → Camera List → Camera
  renderType: "list"
  collectiveValidation: true
  ├── 4MP (renderType: "option", selectionType: "multi")
  │   ├── CP Plus 4MP Indoor: { Deafult q: 4, min q: 1, max q: 8 }
  │   └── CP Plus 4MP Outdoor: { Deafult q: 4, min q: 1, max q: 8 }
  └── 2MP (renderType: "option")
      ├── CP Plus 2MP Indoor: { Deafult q: 4, min q: 1, max q: 8 }
      └── CP Plus 2MP Outdoor: { Deafult q: 4, min q: 1, max q: 8 }
```

**Admin Display:**
- Tree builder shows Camera as a branch with child branches (4MP, 2MP)
- Each child has product options with editable quantities
- Render config panel shows: renderType=list, collectiveValidation=true

**Customer App Behavior:**
- `ListProductGroupWidget` renders Camera as a grouped block
- Branch selectors (ChoiceChips) let user switch between 4MP and 2MP
- Under selected branch, each camera has individual `[-] qty [+]` stepper
- Total quantity validated collectively against group max (e.g., 16)
- Total pill shows "X / 16" with color coding

### Case 2: Both Setup and Products are OPTION form

**Example:** Storage options with `renderType: "option"` at both levels.

**Admin Configuration:**
```
Hard Disk (renderType: "option", selectionType: "single")
├── 1TB HDD (defaultQty: 1, min: 1, max: 1)
├── 2TB HDD (defaultQty: 1, min: 1, max: 2)
└── 3TB HDD (defaultQty: 1, min: 1, max: 2)
```

**Firestore Storage:**
```
Services/Installation → Camera → Hard Disk
  renderType: "option"
  ├── Option 2002: { Deafult q: 1, min q: 0, max q: 1, Price: PROD037 }
  ├── Option 9784: { Deafult q: 1, min q: 0, max q: 1, Price: PROD038 }
  └── Option 7804: { Deafult q: 1, min q: 0, max q: 1, Price: YhAuRWepFDg6Z1PTjMdv }
```

**Admin Display:**
- Tree builder shows Hard Disk as a product slot with multiple options
- Each option has its own quantity settings
- Render config shows: renderType=option, selectionType=single

**Customer App Behavior:**
- `ClubbedProductSelector` bottom sheet appears
- User drills down to see available options
- Single-select: user picks one option (radio buttons)
- Quantity stepper shows for the selected option
- "Change" button in invoice table to switch options

### Case 3: Dependency — Camera → Cable

**Example:** Cable depends on Camera quantity.

**Admin Configuration:**
```
Camera: { defaultQty: 8, min: 0, max: 16 }
Cable: { defaultQty: 8, min: -2, max: 50, dependsOn: "Camera" }
```

**Firestore Storage:**
```
Camera: { Deafult q: 8, min q: 0, max q: 16 }
Cable: { Deafult q: 8, min q: -2, max q: 50, dependsOn: "Camera" }
```

**Customer App Behavior:**
1. Camera quantity = 8 → Cable auto-set to 8
2. User increases Camera to 12 → Cable auto-updates to 12
3. Cable stepper is LOCKED (canEditQuantity = false)
4. If Camera = 0 and Cable minQty = -2: Cable = -2 (clamped, but user sees 0)
5. As Camera increases from 0→5: Cable goes from -2→5

### Case 4: Max Quantity — Common vs Different

**Example:**
```
Camera 1: max q = 16
Camera 2: max q = 16
Camera 3: max q = 14
Camera 4: max q = 14
```

**Current Behavior:**
- Each product has individual max
- Upper limit per product is its own max

**Desired Behavior (Task 2):**
- Group-level upper limit = MAX(16, 16, 14, 14) = 16
- If all max are same (e.g., all 16): use 16
- If different: use the maximum value (16)

### Case 5: Negative Minimum Quantity

**Example:**
```
Cable: { min q: -2, default q: 0 }
```

**Customer App Behavior:**
- Minimum allowed = 0 (hard floor)
- If admin sets min = -2, the quantity can go to 0 but not below
- The -2 offset is used by dependency engine:
  - Camera = 0 → Cable = -2 (but displayed as 0)
  - Camera = 5 → Cable = 5 (from -2, rises to 5)

---

## 14. KNOWN ISSUES & FIXES REQUIRED

### Issue 1: Default Quantity Not Reflecting in Customer UI
- **Problem:** Customer app always starts items at quantity 0 for LIST-mode children, ignoring `defaultQty`
- **Location:** `installation_flow_provider.dart:278-293` — LIST children hardcoded to `quantity: 0`
- **Fix:** Use `leaf.defaultQty` instead of hardcoded `0`

### Issue 2: Minimum Quantity Not Enforced for Non-Dependent Items
- **Problem:** `minQty` is set but customer app doesn't prevent going below it for some items
- **Location:** `installation_flow_provider.dart:533-542` — `clamp()` uses `item.minQty` but `minQty` defaults to 0
- **Fix:** Ensure `minQty` from server is properly propagated

### Issue 3: Max Quantity Upper Limit Logic
- **Problem:** When all products in a group have the same max, it works. When they differ, the upper limit should be the MAX of all max values
- **Location:** Customer app uses individual `maxQty` per item, not group-level max
- **Fix:** Calculate group-level max as `max(all child maxQty values)`

### Issue 4: Dependency Engine — Negative Minimum Case
- **Problem:** When dependent item has negative minQty (e.g., -2), the auto-selection should start from that offset
- **Location:** `_applyDependencies()` uses sum of source quantities directly
- **Fix:** Apply offset: `dependentQty = max(sourceTotal, dependentMinQty)` where dependentMinQty is clamped to 0 for display

### Issue 5: List Children Starting at 0
- **Problem:** LIST-mode children always start at quantity 0 regardless of `defaultQty`
- **Location:** `installation_flow_provider.dart` LIST child creation
- **Fix:** Initialize with `leaf.defaultQty` when building items

### Issue 6: Branch/Sub-Branch Names Overwritten by Product Names in LIST Mode
- **Problem:** In LIST mode, hierarchy labels (branch names, sub-branch names) are replaced by Firestore slot keys (e.g., "4MP Option 4133") instead of showing the configured name or actual product name
- **Root Cause:** `ClubbedOption.label` getter fell back to `optionKey` (Firestore slot key) for leaf nodes, instead of `productName` (catalog product name)
- **Location:** `pricing_contracts.dart:272` — `ClubbedOption.label` getter
- **Fix:** Updated `label` getter to fall back to `productName` for leaf nodes: `if (isLeaf && productName.isNotEmpty) return productName;`
- **Impact:** LIST mode now shows correct product names. OPTION mode unaffected (already uses `productName` directly in `ClubbedProductSelector`)
- **Status:** ✅ Fixed and deployed

---

## APPENDIX: ALL API ENDPOINTS

### Auth
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | None | Admin login |

### Dashboard
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/admin/metrics` | Token | Dashboard metrics |

### Customers
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/customers?page=N` | Token | List customers |
| POST | `/api/customers` | Token | Create customer |
| PATCH | `/api/customers/:id` | Token | Update customer |
| DELETE | `/api/customers/:id` | Token | Delete customer |

### Technicians
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/technicians?page=N` | Token | List technicians |
| POST | `/api/technicians` | Token | Create technician |
| PATCH | `/api/technicians/:id` | Token | Update technician |
| DELETE | `/api/technicians/:id` | Token | Delete technician |
| POST | `/api/technicians/:id/password` | Token | Reset password |

### Jobs
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/jobs?page=N` | Token | List jobs |
| GET | `/api/jobs/:id` | Token | Get job detail |
| POST | `/api/jobs` | Token | Create job |
| PATCH | `/api/jobs/:id` | Token | Update job |
| DELETE | `/api/jobs/:id` | Token | Delete job |

### Payments
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/payments` | Token | List payments |
| DELETE | `/api/payments/:id` | Token | Delete payment |
| POST | `/api/payments/:id/request` | Token | Request payment |

### Catalog Products
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/products` | None | List products |
| GET | `/api/catalog/products/:id` | None | Get product |
| POST | `/api/catalog/products` | Admin | Create product |
| PATCH | `/api/catalog/products/:id` | Admin | Update product |
| DELETE | `/api/catalog/products/:id` | Admin | Delete product |

### Catalog Packages
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/packages` | Token | List packages |
| POST | `/api/catalog/packages` | Admin | Create package |
| PATCH | `/api/catalog/packages/:id` | Admin | Update package |
| DELETE | `/api/catalog/packages/:id` | Admin | Delete package |

### Catalog Add-ons
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/addons` | Token | List addons |
| POST | `/api/catalog/addons` | Admin | Create addon |
| PATCH | `/api/catalog/addons/:id` | Admin | Update addon |
| DELETE | `/api/catalog/addons/:id` | Admin | Delete addon |

### Catalog Taxes
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/taxes` | Token | List taxes |
| POST | `/api/catalog/taxes` | Admin | Create tax |
| PATCH | `/api/catalog/taxes/:id` | Admin | Update tax |
| DELETE | `/api/catalog/taxes/:id` | Admin | Delete tax |

### Catalog Services
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/services` | None | List services |
| POST | `/api/catalog/services` | Admin | Create service |
| PATCH | `/api/catalog/services/:id` | Admin | Update service |
| DELETE | `/api/catalog/services/:id` | Admin | Delete service |

### Recommendation_Addons Service Mapping (NEW)
| Feature | Description |
|---------|-------------|
| Purpose | Categories in `Recommendation_Addons` can be mapped to specific services |
| Mechanism | Each category has a `_serviceMapping` field (array of service IDs) |
| Admin UI | Click ✏️ on any category → Service Mapping checkboxes → select from existing services |
| Backend | `GET /api/catalog-public/services/:serviceId/pricing?serviceType=X` filters categories by `_serviceMapping` |
| Customer Effect | After booking a service, customer sees only recommendations whose category maps to that service |
| Storage | `Services/Recommendation_Addons/{categoryKey}/_serviceMapping` → e.g., `["installation", "amc"]` |

**Admin setup instructions:**
1. Go to `Catalog → Services → Service Builder`
2. Select the `Recommendation_Addons` service (or navigate to `/catalog/builder/Recommendation_Addons`)
3. Create categories matching your recommendation contexts (e.g., "Recommendation after Installation", "Recommendation after AMC")
4. Click the ✏️ icon on a category to open the Edit Category modal
5. In the "Service Mapping" section, check the service(s) this category applies to
6. Click "Save Mapping"
7. Each category can map to one or more services (or none = shows in all contexts)
8. Add setups and products under each category as before

**Important:** The service type IDs used for mapping match the `displayMap` in `catalogService.ts`:
- `installation` → Installation service
- `maintenance` → Maintenance service  
- `amc` → AMC Plans
- `repair` → Camera Repair
- `upgrade` → System Upgrade
- `accessories` → Accessories

For dynamically created services, their safe ID (lowercase, underscores) is used.

### Catalog Recommendations
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/recommendations` | None | List recommendations |
| POST | `/api/catalog/recommendations` | Admin | Create recommendation |
| PATCH | `/api/catalog/recommendations/:id` | Admin | Update recommendation |
| DELETE | `/api/catalog/recommendations/:id` | Admin | Delete recommendation |

### Catalog Invoices
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/invoices` | Token | List invoice templates |
| POST | `/api/catalog/invoices` | Admin | Create template |
| PATCH | `/api/catalog/invoices/:id` | Admin | Update template |
| DELETE | `/api/catalog/invoices/:id` | Admin | Delete template |

### Service Admin (Tree Builder)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/services-admin/list` | Admin | List all services |
| POST | `/api/catalog/services-admin/create` | Admin | Create service |
| GET | `/api/catalog/services-admin/config/:id` | Admin | Get full tree |
| DELETE | `/api/catalog/services-admin/config/:id` | Admin | Delete service |
| POST | `.../category` | Admin | Add category |
| DELETE | `.../category/:key` | Admin | Delete category |
| POST | `.../category/:cat/setup` | Admin | Add setup |
| DELETE | `.../category/:cat/setup/:setup` | Admin | Delete setup |
| POST | `.../category/:cat/setup/:setup/product` | Admin | Add product |
| DELETE | `.../product/:key` | Admin | Remove product |
| PATCH | `.../node/quantities` | Admin | Update quantities |
| PATCH | `.../node/render-config` | Admin | Update render config |
| PATCH | `.../node/dependency` | Admin | Set dependency |
| POST | `.../branch` | Admin | Create branch |
| POST | `.../node` | Admin | Add leaf node |
| DELETE | `.../node` | Admin | Delete node |
| POST | `.../node/rename` | Admin | Rename node |
| POST | `.../node/clone` | Admin | Clone node |
| POST | `.../club` | Admin | Club products |
| POST | `.../setup/clone` | Admin | Clone setup |
| PATCH | `.../node/dynamic-field` | Admin | Set dynamic field |
| PATCH | `/api/catalog/services-admin/product/:id/price` | Admin | Update price |
| GET | `/api/catalog/services-admin/products` | Admin | Search products |

### SDUI Admin
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog/sdui-admin/layouts` | Admin | List layouts |
| GET | `/api/catalog/sdui-admin/layouts/:id` | Admin | Get layout |
| POST | `/api/catalog/sdui-admin/layouts/:id` | Admin | Save layout |
| POST | `/api/catalog/sdui-admin/layouts/:id/reset` | Admin | Reset layout |
| GET | `/api/catalog/sdui-admin/feature-flags` | Admin | List flags |
| POST | `/api/catalog/sdui-admin/feature-flags/:key` | Admin | Set flag |

### Home CMS
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/home-cms` | None | List visible blocks |
| GET | `/api/home-cms/admin` | Admin | List all blocks |
| POST | `/api/home-cms` | Admin | Create block |
| PATCH | `/api/home-cms/:id` | Admin | Update block |
| DELETE | `/api/home-cms/:id` | Admin | Delete block |

### Serviceable Areas
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/serviceable-areas` | None | List areas |
| POST | `/api/serviceable-areas` | Admin | Create area |
| PATCH | `/api/serviceable-areas/:code` | Admin | Update area |
| DELETE | `/api/serviceable-areas/:code` | Admin | Delete area |

### Public Catalog
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/catalog-public/services` | None | List services |
| GET | `/api/catalog-public/pricing/installation` | None | Installation pricing |
| GET | `/api/catalog-public/pricing/maintenance` | None | Maintenance pricing |
| GET | `/api/catalog-public/pricing/repair` | None | Repair pricing |
| GET | `/api/catalog-public/pricing/amc` | None | AMC config |
| GET | `/api/catalog-public/upgrade` | None | Upgrade bundles |
| GET | `/api/catalog-public/accessories` | None | Accessories |
| GET | `/api/catalog-public/products` | None | All products |
| GET | `/api/catalog-public/recommendations` | None | Recommendations |
| GET | `/api/catalog-public/services/:serviceId/pricing?serviceType=X` | None | Dynamic service pricing filtered by service type |

### SDUI Public
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/sdui/layout` | None | Get screen layout |
| GET | `/api/sdui/screens` | None | List screens |

---

**END OF AUDIT**
