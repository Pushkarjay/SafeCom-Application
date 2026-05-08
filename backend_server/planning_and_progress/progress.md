# Backend Progress

## 2026-04-28
- Created a TypeScript Express backend scaffold.
- Added mock CCTV endpoints for auth, dashboard, customers, technicians, jobs, and payments.
- Added JWT login support for admin demo access.

## 2026-05-04
- Captured backend correction directive to remove UI-coupled mock assumptions and serve canonical data contracts.
- Confirmed master product + mapping/reference model for service modules.
- Confirmed need for booking-to-job sync and notification trigger paths.
- Confirmed map serviceability contract requirement for customer location validation.
- Confirmed canonical invoice payload must support all three clients consistently.

## 2026-05-08 (This Session)

### New Endpoints Added
1. **Category-Level Product Operations**:
   - `POST /catalog/services-admin/config/:serviceId/category/:categoryKey/product` - Add product directly to category (no setup required)
   - `DELETE /catalog/services-admin/config/:serviceId/category/:categoryKey/product/:productKey` - Delete from category

2. **Category-Level Node Operations** (for infinite nesting):
   - `POST /catalog/services-admin/config/:serviceId/category/:categoryKey/node` - Add node at category level
   - `DELETE /catalog/services-admin/config/:serviceId/category/:categoryKey/node` - Delete node from category (query: path)
   - `PATCH /catalog/services-admin/config/:serviceId/category/:categoryKey/node/quantities` - Update quantities at category level
   - `PATCH /catalog/services-admin/config/:serviceId/category/:categoryKey/node/dynamic-field` - Update dynamic fields at category level

### Bug Fixes
- Fixed double-slash (//) issue when setupKey is empty - now properly creates category-level entries
- Empty setupKey now correctly routes to category endpoints instead of causing 404

### Architecture
- All 8 service builders (Installation, Maintenance, Repair, AMC, Accessories, Upgrade, Recommendations, Services) use the same nested tree structure
- Products can be added at category level OR setup level
- Supports infinite nesting within setups

### Deployment
- URL: https://safecom-backend-177425757120.us-central1.run.app
- Region: us-central1
- Platform: Cloud Run (managed)
