# Collections Schema (Updated: 2026-05-08)

## CURRENT ACTIVE COLLECTIONS

### admins
{
  uid, email, name, role, status, createdAt
}

### customers
{
  uid, name, phone, email, profileImage, defaultLocationId, savedLocations[], status, createdAt
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
      └── Category (e.g., "shakti")
          └── Setup (e.g., "4 Camera Setup")
              └── Product N → Option N
                  ├── Price (product reference)
                  ├── Deafult q
                  ├── min q
                  ├── max q
                  ├── available
                  └── rigid
}

### sdui_layouts
{
  id, name, layoutType, config (JSON), status
}

### Invoices
{
  id, bookingId, customerId, items[], subtotal, tax, discount, total, status, paymentStatus, createdAt
}

---

## LEGACY/DELETED COLLECTIONS

- ❌ customer_user - Deleted (use customers)
- ❌ sample_customer - Deleted (not used)
- ❌ admin_user - Deleted (use admins)
- ❌ employee_user - Deleted (use employees)
- ❌ Banners - Deleted (not used)
- ❌ Bookings - Deleted (use jobs instead)
- ❌ Configurations - Deleted (not used)
- ❌ Locations - Deleted (not used)
- ❌ Offers - Deleted (not used)
- ❌ Orders - Deleted (use jobs)

---

## DATA FLOW

1. **Master Products**: Stored in `catalog_product` - single source of truth
2. **Services**: Reference products from catalog_product via document references
3. **Jobs**: Created from bookings, assigned to employees
4. **Payments**: Linked to bookings/jobs

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