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
- URL: https://safecom-backend-177425757120.us-central1.run.app (old)
- URL: https://safecom-backend-central-177425757120.us-central1.run.app/api (us-central1, deployed 2026-06-05)
- URL: https://safecom-backend-south-177425757120.asia-south1.run.app/api (asia-south1, deployed 2026-06-05)
- Region: us-central1 + asia-south1
- Platform: Cloud Run (managed)

## 2026-06-05 (This Session)

### CRUD & Security Fixes
1. **Auth middleware overhaul**:
   - Mount-level `verifyFirebaseIdToken` → `authenticateToken` in `app.ts` (JWT vs Firebase ID token)
   - `verifyFirebaseIdToken` now accepts JWT as fallback before Firebase ID token
   - `authenticateToken` now sets `req.firebaseUid` + `req.firebaseClaims` for backward compat
   - All mutation routes in `catalog.ts`, `customers.ts`, `technicians.ts`, `payments.ts` have `authenticateToken, requireRole(['admin'])`

2. **Firestore dot-notation fixes**:
   - Rename bug: `hasDots` check now includes `categoryKey`/`setupKey` from URL path
   - Setup creation: was incorrectly executing rename logic — now creates fresh empty setup
   - Club endpoint: single transaction (read → mutate → `transaction.set`) prevents parent detachment
   - Clone endpoint: always uses `setNested + set({ merge: true })` to preserve literal dots in keys
   - Added `setNested`/`deleteNested` helpers to `installationAdmin.ts`
   - `safeKey` regex changed from `/[.:/#?&=%+]+/g` to `/[\/#?&=%+]+/g` preserving decimals and colons

3. **Missing product routes added** (4 new endpoints in `servicesAdmin.ts`):
   - `POST /config/:serviceId/category/:categoryKey/product`
   - `POST /config/:serviceId/category/:categoryKey/setup/:setupKey/product`
   - `DELETE /config/:serviceId/category/:categoryKey/product/:productKey`
   - `DELETE /config/:serviceId/category/:categoryKey/setup/:setupKey/product/:productKey`

### Verification
- End-to-end CRUD tested against live Firestore (`safecom-database-nosql`)
- Literal keys with dots (`"2.0 MP Test"`) and colons (`"IP Camera: Samples"`) preserved correctly
- Spurious corrupted keys from earlier rename bug cleaned up
- Builds pass: `tsc` (backend) + `vite build` (frontend)

### Frontend
- ProductSearchModal: multi-select checkboxes + "Select All" + bulk "Add Selected (N)" button
- SafeKey applied in service_tree_builder_screen
- PROD_API_BASE_URL updated to correct Cloud Run service name (`safecom-backend-central`)

### Deployment
- Backend deployed to Cloud Run us-central1: `safecom-backend-central-177425757120.us-central1.run.app`
- Backend deployed to Cloud Run asia-south1: `safecom-backend-south-177425757120.asia-south1.run.app`
- Admin frontend deployed to Firebase: `safecom-application-01.web.app`
