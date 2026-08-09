# Collections Schema (Updated: 2026-08-09 — audit verified)

## CURRENT ACTIVE COLLECTIONS

### admins
{
  uid, email, name, role, status, createdAt
}

### customers
{
  uid, name, phone (persisted — optional email), profileImage, defaultLocationId, savedLocations[] (with lat/lng from map picker), status, createdAt
}

### users (NEW)
{
  uid, role, linked customer/employee/admin id — used for cross-role lookup: /me, /by-phone/:phone, /by-email/:email
}

### employees
{
  uid, name, phone, email, role, department, status, createdAt
}

### catalog_product (Master Products)
{
  id, sku, name, category, group, brand, price, unit, status, stockEnabled, visible, images[], tags[], createdAt, updatedAt
}

### Services (Service Configurations - Nested Tree Structure)
{
  id, name, key, description, icon, status, createdAt
  └── [Dynamic nested structure]
      └── Category
          └── Setup
              └── Product → Options / Branches / Clubbed products
                  ├── price ref, defaultQty, minQty, maxQty, available, rigid
                  └── dependency engine (auto-mapped quantities)
}

### catalog_maintenance_plans (NEW)
{
  id, name, description, frequency (monthly/quarterly/half_yearly/yearly), price, status, createdAt, updatedAt
}

### jobs
{
  jobId, bookingId, customerId, serviceType, status, assignedTo{employeeId,name,phone}, location{address,city,pincode}, items[], subtotal, tax, discount, total, paymentStatus, invoice (incl. customTextBox — customer message), scheduledDate, completedAt?, completionNotes?, createdAt, updatedAt
}

### bookings
{
  bookingId, customerId, orderId, serviceId, variantId?, locationId, items[], subtotal, tax, discount, total, amountPaid, totalAmount, status, paymentStatus, scheduledDate, createdAt
}

### sdui_layouts
{
  id, name, layoutType, config (JSON), status
}

### sdui_feature_flags (NEW)
{
  key, enabled, config
}

### serviceable_areas (NEW)
{
  areaCode, name, city, status — shared by admin CRUD, /serviceability/check, and SDUI (hideWhenServiceable)
}

### home_cms (NEW)
{
  promo banners, sections — public read, admin write via homeCms.ts
}

### booking_counters (NEW)
{
  sequential booking-id counters
}

### Invoices
{
  id, bookingId, customerId, items[], subtotal, tax, discount, total, status, paymentStatus, createdAt
}

---

## LEGACY/DELETED COLLECTIONS

- ❌ customer_user / Customer_User - Deleted (use customers)
- ❌ sample_customer - Deleted (not used)
- ❌ admin_user / Admin_User - Deleted (use admins)
- ❌ employee_user / Employee_User - Deleted (use employees)
- ❌ PService - Deleted (replaced by Services tree)
- ❌ Catalog_Product (legacy) - Deleted (use catalog_product)
- ❌ Banners - Deleted (use home_cms / SDUI)
- ❌ Bookings (legacy) - Deleted (use bookings)
- ❌ Configurations - Deleted (not used)
- ❌ Locations - Deleted (not used)
- ❌ Offers - Deleted (not used)
- ❌ Orders - Deleted (use bookings/jobs)

> ⚠️ `firestore.rules` still references many legacy names above — it should be
> reconciled with this collection set (the backend uses the admin SDK and
> bypasses rules).

---

## DATA FLOW

1. **Master Products**: Stored in `catalog_product` - single source of truth
2. **Services**: Reference products from catalog_product via document references; dynamic tree built by servicesAdmin/installationAdmin
3. **Bookings**: Created by customers (with amountPaid/totalAmount + optional custom message) → backend creates a `job`
4. **Jobs**: Created from bookings, assigned to employees; carry invoice incl. customTextBox
5. **Payments**: Linked to bookings/jobs; Razorpay order → verify (signature required)
6. **Serviceability**: `serviceable_areas` drives /serviceability/check + SDUI banners
7. **CMS**: `home_cms` + `sdui_layouts` + `sdui_feature_flags` drive the customer home screen

## Nested Service Architecture

Services use a tree structure:
- Service (root)
  - Category (e.g., "shakti", "4 Camera Setup")
    - Products (directly under category, no setup needed)
    - Setup (e.g., "General", custom setups)
      - Product → Options (infinite nesting supported)

## API Endpoints Reference

### Service Configuration
- GET /catalog/services-admin/list
- POST /catalog/services-admin/create
- GET /catalog/services-admin/config/:serviceId
- POST /catalog/services-admin/config/:serviceId/category
- DELETE /catalog/services-admin/config/:serviceId/category/:key
- POST /catalog/services-admin/config/:serviceId/category/:categoryKey/setup
- DELETE /catalog/services-admin/config/:serviceId/category/:categoryKey/setup/:key
- POST /catalog/services-admin/config/:serviceId/category/:categoryKey/product (category-level)
- POST /catalog/services-admin/config/:serviceId/category/:categoryKey/setup/:setupKey/product (setup-level)
- DELETE /catalog/services-admin/config/:serviceId/category/:categoryKey/product/:key (category-level)
- DELETE /catalog/services-admin/config/:serviceId/category/:categoryKey/setup/:setupKey/product/:key (setup-level)
- POST /catalog/services-admin/config/:serviceId/category/:categoryKey/node (category-level nesting)
- POST /catalog/services-admin/config/:serviceId/category/:categoryKey/setup/:setupKey/node (setup-level nesting)