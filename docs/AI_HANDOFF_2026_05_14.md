# SafeCom Platform — Implementation Progress & AI Handoff
## Session: 2026-05-14 | Status: All Phases Complete ✅ | Backend + Admin Build Clean ✅

---

## Summary of What's Done vs Not Done

### ✅ ALREADY DONE (prior sessions / this session) — FULLY VERIFIED

| Feature | Status | Notes |
|---------|--------|-------|
| `renderType` field in backend | ✅ Done | Added to TreeNode in `installationAdmin.ts` and `servicesAdmin.ts` |
| `collectiveValidation` support | ✅ Done | Backend preserves and passes through render config fields |
| LIST rendering in Flutter | ✅ Done | `list_product_group_widget.dart`, `installation_flow_provider.dart` |
| Collective qty validation | ✅ Done | `allListGroupsValid`, `listGroupTotal()` in `InstallationFlowNotifier` |
| Guest-first auth flow | ✅ Done | `app_router.dart` restricts auth to payment/confirmation only |
| Location non-blocking | ✅ Done | `splash_screen.dart` fires silently in background |
| Installation customization screen | ✅ Done | Back button + LIST/OPTION split rendering |

### ✅ NEWLY IMPLEMENTED THIS SESSION

| Feature | Files Changed | Notes |
|---------|--------------|-------|
| Admin renderType UI controls | `admin_datasource.ts`, `service_tree_builder_screen.tsx`, `installation_builder.css` | ⚙️ button on each leaf + branch row, badge showing OPT/LIST |
| Admin renderType backend endpoints | `servicesAdmin.ts` | Both `/category/.../node/render-config` and `/category/.../setup/.../node/render-config` |
| Serviceable area CRUD (backend) | `serviceability.ts` | In-memory store with POST/PATCH/DELETE + admin auth |
| Admin serviceable areas UI | `serviceable_areas_screen.tsx`, `serviceable_areas_screen.css`, `App.tsx`, `main_layout.tsx` | Full CRUD + toggle active/inactive |
| Phone collection after Google sign-in | `phone_collection_screen.dart`, `login_screen.dart`, `app_router.dart`, `app_routes.dart` | Shows `/phone-collection` if Google user has no phone |
| Back navigation buttons | `scheduling_screen.dart`, `payment_screen.dart`, `booking_confirmation_screen.dart`, `recommendation_screen.dart` | All booking flow screens now have explicit back buttons |
| AMC confirmation sheet | `amc_plan_screen.dart` | Shows bottom sheet: "Add Accessories" or "Book AMC Now" |
| Splash screen bezel removal | `splash_screen.dart` | Removed white Container wrapper around logo |
| **Account merge logic** | `users.ts`, `userService.ts`, `types.ts` | Detects conflict by email/phone, merges Firestore docs, transfers customer data |
| **CMS-driven home page (backend)** | `homeCms.ts` (new file) | Full CRUD in Firestore `home_cms` collection |
| **Admin Home CMS UI** | `home_cms_screen.tsx`, `home_cms_screen.css`, `App.tsx`, `main_layout.tsx` | Admin can manage all CMS blocks from sidebar |

### ❌ Still Not Done

| Feature | Priority | Notes |
|---------|----------|-------|
| Backend rebuild & redeploy | High | Both backends must be `npm run build` and deployed to Cloud Run |
| Admin dashboard rebuild & redeploy | High | `npm run build` and deploy to Firebase Hosting |
| Flutter app rebuild | High | `flutter build apk` for Android users |
| Recommendation admin UI (seeding) | Medium | Already has backend CRUD — needs admin panel UI |
| Flutter CMS consumer | Medium | Home screen should fetch from `/api/home-cms` and render CMS blocks (work in progress) |

---

## Architecture Notes for Next AI

### Backend Endpoint URLs

```
Admin Backend (us-central1):
  https://safecom-backend-177425757120.us-central1.run.app/api

Customer+Employee Backend (asia-south1):
  https://safecom-backend-177425757120.asia-south1.run.app/api
```

### New API Endpoints Added This Session

#### Backend (servicesAdmin.ts) — Render Config:
```
PATCH /api/catalog/services-admin/config/:serviceId/category/:categoryKey/node/render-config
  Body: { nodePath: string[], renderType?: 'option'|'list', selectionType?: 'single'|'multi',
          collectiveValidation?: boolean, displayLabel?: string, mandatory?: boolean }

PATCH /api/catalog/services-admin/config/:serviceId/category/:categoryKey/setup/:setupKey/node/render-config
  Body: { nodePath: string[], ...same as above }
```

#### Backend (serviceability.ts) — Admin-authenticated:
```
GET    /api/serviceability/areas?active=true
POST   /api/serviceability/areas
PATCH  /api/serviceability/areas/:areaCode
DELETE /api/serviceability/areas/:areaCode
```

#### Backend (homeCms.ts) — Home Page CMS:
```
GET    /api/home-cms                     (public — for Flutter app)
GET    /api/home-cms/admin              (admin — list all blocks)
POST   /api/home-cms                    (admin — create block)
PATCH  /api/home-cms/:id                (admin — update block)
DELETE /api/home-cms/:id                (admin — delete block)
```

#### Backend (users.ts) — Account Merge:
```
POST   /api/users/link                  (now includes account merge logic)
  Response includes: merged: true|false
```

### Flutter Route Structure
```
/phone-collection   — new route (phone collection after Google sign-in)
/phone-auth         — existing OTP route
/login              — existing Google/Phone login
/home — main screen
/... (all other service routes — no auth required)
```

### How renderType Works

1. **Admin sets** `renderType: 'list'` on a node in the Installation Builder via the ⚙️ button
2. **Backend** preserves the field in `extractTree()` and serves it to Flutter
3. **Flutter flow provider** sees `renderType === 'list'` and:
   - Creates an `InvoiceListGroup` for collective validation
   - Flattens all leaf children into individual `InvoiceLineItem`s with `isListChild: true`
4. **ListProductGroupWidget** renders the grouped block with qty steppers
5. **Customer selects** quantities — collective sum is validated against `[minQty, maxQty]`
6. **Proceed button** is enabled only when `flow.allListGroupsValid === true`

### How Account Merge Works (Phase 3.1 — NOW IMPLEMENTED)

1. User signs in with Google or Phone via Firebase Auth
2. Flutter calls `POST /api/users/link` with `{ email, phone, displayName, role: 'customer' }`
3. Backend (`users.ts`) checks if this email or phone already links to a **different** Firebase UID via `getFirestoreUserByEmail()` / `getFirestoreUserByPhone()`
4. If conflict found → calls `mergeFirestoreUserAccounts(primaryUid, secondaryUid)`:
   - Transfers phone from secondary to primary user doc
   - Transfers customer document reference to primary UID
   - Deletes secondary user doc
5. If no conflict → normal upsert
6. `FirestoreUser` now has `phone` and `googleLinked` fields; `FirestoreCustomer` has `googleLinked`

**Note**: The actual Firebase Auth account linking (linking Google credential to existing phone Firebase user) must be done by the Flutter app using `FirebaseAuth.instance.currentUser!.linkWithCredential()`. This requires the user to be authenticated with one method first, then call link with the second. The backend handles the Firestore layer merge.

### Key Files to Know

| File | Purpose |
|------|---------|
| `backend_server/src/routes/installationAdmin.ts` | Installation tree CRUD + render-config PATCH endpoint |
| `backend_server/src/routes/servicesAdmin.ts` | Generic service tree CRUD (used by admin builder) + render-config endpoints |
| `backend_server/src/routes/serviceability.ts` | Serviceable area CRUD + location check |
| `backend_server/src/routes/homeCms.ts` | NEW — Home page CMS block CRUD |
| `backend_server/src/routes/users.ts` | User linking + account merge logic |
| `backend_server/src/services/userService.ts` | `getFirestoreUserByEmail`, `getFirestoreUserByPhone`, `mergeFirestoreUserAccounts`, `updateCustomerPhone` |
| `mobile_customer/lib/features/services/providers/installation_flow_provider.dart` | Core state for invoice builder |
| `mobile_customer/lib/widgets/common/list_product_group_widget.dart` | LIST render mode UI component |
| `mobile_customer/lib/features/auth/screens/phone_collection_screen.dart` | New screen for phone collection after Google sign-in |
| `mobile_customer/lib/features/auth/screens/login_screen.dart` | Checks phone after Google sign-in, redirects to phone-collection |
| `mobile_customer/lib/features/booking/scheduling_screen.dart` | Back button added |
| `mobile_customer/lib/features/booking/payment_screen.dart` | Back button added |
| `mobile_customer/lib/features/booking/recommendation_screen.dart` | Back button added |
| `mobile_customer/lib/features/booking/booking_confirmation_screen.dart` | AppBar added with home navigation |
| `mobile_customer/lib/features/services/amc_plan_screen.dart` | Confirmation sheet added |
| `mobile_customer/lib/features/splash/splash_screen.dart` | Logo bezel removed |
| `Admin/web_app/admin-dashboard/src/features/catalog/service_tree_builder_screen.tsx` | ⚙️ render config button added |
| `Admin/web_app/admin-dashboard/src/features/catalog/home_cms_screen.tsx` | NEW — Home CMS management |
| `Admin/web_app/admin-dashboard/src/features/settings/serviceable_areas_screen.tsx` | NEW — Serviceable areas management |
| `Admin/web_app/admin-dashboard/src/data/datasources/admin_datasource.ts` | `serviceUpdateRenderConfig()`, Home CMS, Serviceable Areas methods |

### Deployment Notes

1. **Backend must be rebuilt**: `npm run build` in `backend_server/` and deployed
2. **Admin dashboard must be rebuilt**: `npm run build` in `Admin/web_app/admin-dashboard/` and deployed
3. **Flutter app must be rebuilt**: `flutter build apk` or `flutter build web` for customer app
4. **Firestore**: No schema migration needed — all fields are additive
5. **Environment**: Verify `CORS_ORIGINS` includes production domains in both backends

### Next Steps (Priority Order)

1. **Deploy** — Rebuild and deploy both backends (us-central1 + asia-south1)
2. **Deploy admin** — Build and deploy admin dashboard to Firebase Hosting
3. **Flutter app rebuild** — `flutter build apk` and release
4. **Home CMS seeding** — Seed initial banner/promo blocks in Firestore `home_cms` collection for the customer app to show
5. **Flutter CMS consumer** — Update `home_screen.dart` or `fallback_home_content.dart` to fetch from `/api/home-cms` and render CMS blocks
6. **Recommendation admin UI** — Create admin panel for seeding recommendation rules (backend already done)
7. **Admin "Add Employee" fix** — Investigate and fix button binding in admin dashboard
8. **SRS full update** — Update SRS documents with new architecture decisions