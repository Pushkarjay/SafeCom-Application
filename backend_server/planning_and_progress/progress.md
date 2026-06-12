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

### Root Cause: Missing "Camera" Setup in "IP Camera: Samples"
**Finding**: The backend `GET /config/Installation` returns exactly what exists in Firestore — the **backend is correct**.

**Investigation** (`debug_firestore.ts` directly queried both databases):
- Backend reads from `Services/Installation` document in `safecom-database-nosql` (named DB)
- That document has only **3 entries** under `IP Camera: Samples`: "Test 4 Camera Setup", "Test 8 Camera Setup", "16 Camera Setup"
- There is no "Camera" entry at `Services/Installation` → `IP Camera: Samples` → `Camera`
- The `Configuration` collection is **empty** in the named DB
- Default database `(default)` returns 5 NOT_FOUND (doesn't exist or inaccessible)

**Conclusion**: The "Camera" entry visible in Firestore console screenshots was from a different document/database. The backend API correctly returns all data that exists in `Services/Installation` (`safecom-database-nosql`). No code change needed — the 3-setup count is accurate for the backend's data source. If the "Camera" setup should appear in the admin dashboard, it must be added to Firestore at `Services/Installation` → `IP Camera: Samples` → `Camera`.

### Removed Broken Firestore REST Fallback
- Removed `firestoreFetch`, `encodePath`, `firestoreNodeToTreeNode` methods and `FIRESTORE_BASE` constant from `admin_datasource.ts`
- Removed the 403-prone Firestore REST branch lookup try-catch block in `getServiceConfig`
- All data now served exclusively through the backend API

### Fixed: Empty Branch Not Visible in Frontend
**Problem**: Creating a branch via `+ Branch` creates `{ "BranchName": {} }` in Firestore. `extractTree({})` returns `[]`, so the product slot has `options: []` and `isClubbed: false`. Frontend's non-clubbed path does `slot.options[0]` → `undefined` → `return null`, making the branch invisible.

**Fix**: `servicesAdmin.ts:369` — changed `isClubbed: tree.length > 1` to `isClubbed: tree.length > 1 || tree.length === 0`. Empty branches now render as expandable clubbed headers showing "0 options", with `+ Option` and `+ Branch` buttons to add content.

**Deployed**: us-central1 backend rebuilt and deployed (Cloud Build, revision `safecom-backend-central-00004-gtn`).

### Deployment
- Backend deployed to Cloud Run us-central1: `safecom-backend-central-177425757120.us-central1.run.app`
- Backend deployed to Cloud Run asia-south1: `safecom-backend-south-177425757120.asia-south1.run.app`
- Admin frontend deployed to Firebase: `safecom-application-01.web.app`

## 2026-06-06 (This Session)

### Customer Mobile App: DVR Naming & Mismatch Display Fix

**Problem 1 — Naming**: Clubbed product leaves in the customer app showed the raw Firestore key (e.g., `"Product 14 Option 1"`) instead of the catalog product name (e.g., `"CP Plus 3+1 Co-Axial Cable - DVR Supported"`). The `ClubbedOption.label` getter at `pricing_contracts.dart:272` used `optionKey` as fallback when `displayLabel` was empty, skipping `productName`.

**Fix**: Changed `label` getter to prefer `displayLabel` → `productName` (catalog name) → `optionKey` (Firestore key). This fixes display names for all list/option leaves across DVR, CCTV Camera, Storage, and any clubbed product.

**Problem 2 — Mismatch Display (Branch Selector)**: Clubbed products with multiple LIST branches (e.g., `CCTV Camera` with `5.0 MP` and `2.4 MP` branches) used a **ChoiceChip branch selector** that only showed ONE branch at a time — unlike the admin dashboard which displays ALL branches simultaneously.

**Fix**: Replaced the single-branch selector with simultaneous display of all branches as separate `InvoiceListGroup` widgets. Each branch (e.g., `5.0 MP`, `2.4 MP`) now renders its own list group with its own items and collective validation, matching the admin dashboard behavior.

**Changed files**:
- `mobile_customer/lib/data/models/pricing_contracts.dart`:272 — `label` getter now uses `productName` before `optionKey`
- `mobile_customer/lib/features/services/providers/installation_flow_provider.dart` — removed `selectedBranch` state, removed `selectClubbedBranch` method, changed branch handling to iterate ALL branches (not just selected one)
- `mobile_customer/lib/features/invoice/installation_customization_screen.dart` — removed `_buildBranchSelectors` (`ChoiceChip` UI) and unused import
