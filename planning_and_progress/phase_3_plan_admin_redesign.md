# Phase 3: Admin Dashboard Redesign (Estimated 4-5 hours)

## 🎯 Objectives

1. **Replace Mock Metrics with Real Backend Data**
   - Dashboard metrics from actual Firestore data
   - Server health, DB connection status
   - Payment gateway status checks

2. **Rebuild Service Catalog Control Plane**
   - Master product management (CRUD)
   - Installation service builder (configure service packages)
   - Accessories management interface
   - Maintenance plan builder
   - Recommendation ordering interface

3. **Database Restructuring Preparation**
   - Define Firestore collection schema
   - Prepare for data migration

---

## 📋 Detailed Tasks

### Task 3.1: Dashboard Metrics (Backend Connection)
**Current State:** Hardcoded mock metrics, fallback to fixed values
**Target State:** Real metrics from Firestore queries

**Changes Needed:**
1. Firestore Queries:
   - `customers` collection: count → totalCustomers
   - `employees` collection: filter by status='available' → activeTechnicians
   - `jobs` collection: filter by status='pending' → pendingJobs
   - `bookings` collection: sum invoices → totalRevenue
   - `jobs` collection: completion rate calculation
   - Response time average from completed jobs

2. Backend Endpoint: `GET /dashboard/metrics`
   - Return aggregated data structure
   - Cache for 5 minutes (frequent queries)
   - Include system status checks

3. Frontend Update:
   - Display loading states during fetch
   - Show error states with retry
   - Real-time refresh every 2 minutes

**Estimated Time:** 45 min

### Task 3.2: Master Product Management (Enhanced)
**Current State:** Basic CRUD for products, packages, add-ons
**Target State:** Full product lifecycle with:
- Product categorization (Cameras, Storage, Recording, etc.)
- Group management (Core, Installation, Recommendations)
- Variant management (e.g., "2MP", "1TB")
- Stock tracking (optional)
- Pricing tiers (base, bulk)

**Changes Needed:**
1. Update `CatalogProduct` model to include:
   - productId (unique, auto-generated)
   - category (from categories list)
   - group (from groups list)
   - variants: {variantKey: variantValue}[]
   - unitPrice
   - bulkPrice (for orders > 5)
   - stock (current inventory)

2. Create backend endpoints:
   - `GET /catalog/products` → List all
   - `POST /catalog/products` → Create (with validation)
   - `PATCH /catalog/products/:id` → Update
   - `DELETE /catalog/products/:id` → Delete with safety checks

3. Frontend enhancements:
   - Multi-select category/group filters
   - Variant editor UI (add/edit/remove)
   - Bulk import/export CSV
   - Search with autocomplete

**Estimated Time:** 60 min

### Task 3.3: Service Builder (Installation Packages)
**Current State:** Package CRUD exists but no visual builder
**Target State:** Drag-and-drop service composition interface

**Changes Needed:**
1. Create `ServiceBuilder` component:
   - Left panel: Available products by category
   - Center panel: Selected products for service
   - Right panel: Service configuration
   - Drag-drop product selection
   - Auto-calculate total price

2. Service Configuration:
   - Service name (e.g., "4-Camera Home Security")
   - Service type (installation/maintenance/amc)
   - Products included
   - Add-ons available
   - Base price + tax
   - Discount rules (e.g., "Buy 4+ cameras = 10% off")
   - Warranty period

3. Backend data structure:
   ```
   Service {
     serviceId: "SVC-2024-001"
     serviceName: "4-Camera Installation"
     serviceType: "installation"
     products: [{productId, quantity, price}]
     addons: [{addonId, optional}]
     basePrice: 25000
     tax: 4500
     finalPrice: 29500
     discountRules: [{minQty, discount}]
     warrantyMonths: 12
   }
   ```

4. Endpoints:
   - `GET /catalog/services` → List
   - `POST /catalog/services` → Create
   - `PATCH /catalog/services/:id` → Update
   - `DELETE /catalog/services/:id` → Delete

**Estimated Time:** 90 min

### Task 3.4: Accessories Management
**Current State:** Basic addon CRUD
**Target State:** Full accessories lifecycle with recommendations

**Changes Needed:**
1. Accessories types:
   - Installation materials (cables, brackets, etc.)
   - Upgrades (higher capacity, better specs)
   - Extended warranty
   - Support packages

2. Interfaces needed:
   - Accessories inventory management
   - Compatibility matrix (which products work with which accessories)
   - Pricing rules (fixed or percentage markup)
   - Upsell recommendations

3. Endpoints:
   - `GET /catalog/accessories` → List with filters
   - `POST /catalog/accessories` → Create
   - `PATCH /catalog/accessories/:id` → Update
   - `GET /catalog/accessories/:id/compatibility` → Compatible products

**Estimated Time:** 45 min

### Task 3.5: Maintenance Plan Builder
**Current State:** Does not exist
**Target State:** UI for creating maintenance contracts

**Changes Needed:**
1. Maintenance Plan schema:
   ```
   MaintenancePlan {
     planId: "MP-2024-001"
     planName: "Annual Maintenance"
     description: "Quarterly maintenance + 24/7 support"
     duration: "12 months"
     frequency: "quarterly"
     services: [{serviceId, coverage}]
     price: 5000
     renewal: true/false
   }
   ```

2. Builder interface:
   - Select services to include
   - Set frequency (quarterly, monthly, yearly)
   - Configure price tiers
   - Set renewal policy
   - Preview total annual cost

3. Endpoints:
   - `POST /catalog/maintenance-plans` → Create
   - `PATCH /catalog/maintenance-plans/:id` → Update
   - `DELETE /catalog/maintenance-plans/:id` → Delete

**Estimated Time:** 60 min

### Task 3.6: Recommendation Ordering
**Current State:** Exists but not functional
**Target State:** UI for ranking product recommendations

**Changes Needed:**
1. Recommendation engine config:
   - Base recommendations (shown to all)
   - Seasonal recommendations
   - Cross-sell recommendations (product pairs)
   - Upsell recommendations (higher capacity alternatives)

2. Interface:
   - List view of all recommendations
   - Drag-to-reorder priority
   - Enable/disable individual recommendations
   - Set recommendation type and conditions
   - A/B test variations (future)

3. Schema:
   ```
   Recommendation {
     recId: "REC-2024-001"
     name: "4MP Upgrade"
     type: "upsell"
     productIds: ["CAM-4MP-001"]
     priority: 1  (lower = higher priority)
     targetCustomer: "has-2MP-cameras"
     conversionRate: 0.15  (tracking)
   }
   ```

4. Endpoints:
   - `GET /catalog/recommendations` → List with priority order
   - `POST /catalog/recommendations` → Create
   - `PATCH /catalog/recommendations/:id` → Update priority
   - `DELETE /catalog/recommendations/:id` → Delete

**Estimated Time:** 45 min

### Task 3.7: Dashboard System Status Checks
**Current State:** Fixed metrics only
**Target State:** Real-time system health

**Changes Needed:**
1. Health checks to implement:
   - Firestore connection status
   - Firebase Auth status
   - Storage quota usage
   - API response times
   - Payment gateway connectivity (if available)

2. Display on dashboard:
   - Status indicators (green/yellow/red)
   - Last check timestamp
   - Retry button for failed checks

3. Endpoint:
   - `GET /system/health` → System status

**Estimated Time:** 30 min

---

## 📊 Current Frontend Status

### ✅ Already Implemented
- Dashboard UI scaffold
- Catalog tab interface with 9 tabs
- CRUD operations for products/packages/addons
- Search and filtering
- Basic styling

### ❌ Not Implemented / Needs Rebuild
- Dashboard metrics API connection
- Service builder (visual editor)
- Maintenance plan builder
- Recommendation priority manager
- System health display
- Real data loading instead of mocks

---

## 🔄 Backend Requirements

### New Endpoints Needed
```
GET    /dashboard/metrics           → DashboardMetrics
GET    /system/health               → SystemHealth

GET    /catalog/products            → Product[]
POST   /catalog/products            → Product
PATCH  /catalog/products/:id        → Product
DELETE /catalog/products/:id        → {success}

GET    /catalog/services            → Service[]
POST   /catalog/services            → Service
PATCH  /catalog/services/:id        → Service
DELETE /catalog/services/:id        → {success}

GET    /catalog/accessories         → Addon[]
GET    /catalog/accessories/:id/compatibility → Product[]

GET    /catalog/maintenance-plans   → MaintenancePlan[]
POST   /catalog/maintenance-plans   → MaintenancePlan
PATCH  /catalog/maintenance-plans/:id → MaintenancePlan

GET    /catalog/recommendations     → Recommendation[]
PATCH  /catalog/recommendations/:id → Recommendation
```

### Firestore Collections Needed
```
master_products/          → Core product catalog
services/                 → Service packages
maintenance_plans/        → Maintenance contracts
recommendations/          → Product recommendations
accessories/              → Add-ons and upgrades
catalogs/                 → Configuration sets
```

---

## 🚀 Implementation Order

**Phase 3a: Dashboard & Metrics (30 min)**
1. Create `/dashboard/metrics` endpoint
2. Connect admin dashboard to real metrics
3. Add system health checks

**Phase 3b: Product Management (60 min)**
1. Enhance product model and CRUD
2. Create product management interface
3. Test with seed data

**Phase 3c: Service Builder (90 min)**
1. Create service builder component
2. Implement drag-drop interface
3. Wire to backend

**Phase 3d: Accessories & Maintenance (105 min)**
1. Enhance accessories interface
2. Create maintenance plan builder
3. Implement recommendation reordering

---

## ⏱️ Time Breakdown

| Task | Estimated | Notes |
|------|-----------|-------|
| 3.1 Dashboard Metrics | 45 min | Backend + Frontend |
| 3.2 Product Management | 60 min | Enhanced CRUD |
| 3.3 Service Builder | 90 min | Most complex |
| 3.4 Accessories | 45 min | Inventory + compat |
| 3.5 Maintenance Plans | 60 min | New builder UI |
| 3.6 Recommendations | 45 min | Priority manager |
| 3.7 Health Checks | 30 min | System status |
| **Total** | **375 min** | **6.25 hours** |

---

## 🎯 Success Criteria

- [ ] Dashboard shows real metrics from Firestore
- [ ] System health checks visible on dashboard
- [ ] Product master CRUD fully functional
- [ ] Service builder allows drag-drop composition
- [ ] Accessories management complete
- [ ] Maintenance plan builder functional
- [ ] Recommendation ordering works
- [ ] No hardcoded mock data in production paths
- [ ] All new endpoints tested and documented
- [ ] Admin can create and manage complete service catalog

---

## 📝 Next Session Prep

- Ensure backend has all required endpoints
- Prepare Firestore schema for master_products, services, etc.
- Have seed data ready for testing
- Plan database migration strategy for existing data
