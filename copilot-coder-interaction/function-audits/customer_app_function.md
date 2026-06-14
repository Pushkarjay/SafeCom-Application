# CUSTOMER APP — COMPLETE FUNCTION AUDIT

**Date:** 2026-06-14
**Scope:** Every screen, provider, service, model, API call, and data flow in the mobile customer application

---

## TABLE OF CONTENTS

1. [Authentication & Profile](#1-authentication--profile)
2. [Home Screen (SDUI)](#2-home-screen-sdui)
3. [Service Discovery & Selection](#3-service-discovery--selection)
4. [Invoice & Estimate Customization](#4-invoice--estimate-customization)
5. [Booking & Payment Flow](#5-booking--payment-flow)
6. [Profile & Order History](#6-profile--order-history)
7. [Location Services](#7-location-services)
8. [Shopping Cart](#8-shopping-cart)
9. [Routing & Navigation](#9-routing--navigation)
10. [SDUI Rendering Engine](#10-sdui-rendering-engine)
11. [Data Layer: Repositories & Providers](#11-data-layer-repositories--providers)
12. [Firestore Data Model Reference](#12-firestore-data-model-reference)
13. [Block Diagrams](#13-block-diagrams)
14. [Multi-Case Behavior Analysis](#14-multi-case-behavior-analysis)
15. [Known Issues & Fixes Required](#15-known-issues--fixes-required)

---

## 1. AUTHENTICATION & PROFILE

### Login Screen (`screens/login_screen.dart`)
- **Options:** Google sign-in button, Phone OTP button, "Continue as Guest" link
- **Google Sign-in:**
  1. Launches `google_sign_in` package → Firebase credential → `signInWithCredential`
  2. Firebase UID obtained → checks if user exists via `GET /api/users/by-email` or `by-phone`
  3. If new user → navigates to `PhoneCollectionScreen` to capture name/email/phone
  4. If existing → loads profile, sets auth state, navigates to home
- **Phone OTP:**
  1. Phone input with country code picker → Firebase PhoneAuthProvider
  2. Auto OTP detection (Resend button after 30s)
  3. On verification → links with backend via `POST /api/users/link`
- **Guest Mode:**
  1. Sets `isGuest = true` in auth state
  2. Allows browsing services catalog
  3. Blocks booking/payment screens (redirects to login on attempt)

### Phone Collection Screen (`screens/phone_collection_screen.dart`)
- **Fields:** Name, Email, Phone (with country code)
- **Validation:** Phone uniqueness check via `GET /api/users/by-phone/:phone`
- **Behavior:**
  1. Collects user details after Google sign-in
  2. Duplicate phone check before submission
  3. Calls `POST /api/users/link` with `{ firebaseUid, name, email, phone, role: "customer" }`
  4. On success → creates/updates Firestore `users` document → navigates to home

### Auth Provider (`providers/auth_provider.dart`)
- **State:** `AuthState { token, customer, isGuest, isLoading, error }`
- **Functions:**
  - `signInWithGoogle()` — Full Google auth flow
  - `signInWithPhone(phone)` — Initiate phone OTP
  - `verifyOtp(smsCode)` — Verify and complete phone auth
  - `signOut()` — Firebase sign-out +SharedPreferences clear
  - `updateProfile(customer)` — PATCH to backend + local state update
  - `checkAuthState()` — Rehydrate from SharedPreferences on app start
- **Persistence:** Token stored in SharedPreferences, Firebase Auth state listener active

### Auth Service (`services/auth_service.dart`)
- `signInWithGoogle()` → `GoogleSignIn → FirebaseAuth`
- `signInWithPhone(phone)` → `FirebaseAuth.verifyPhoneNumber`
- `verifyOtp(verificationId, smsCode)` → `PhoneAuthProvider.credential`
- `linkUserToBackend(firebaseUid, data)` → `POST /api/users/link`
- `getUserByEmail(email)` → `GET /api/users/by-email/:email`
- `getUserByPhone(phone)` → `GET /api/users/by-phone/:phone`

### Customer Model (`models/customer_model.dart`)
```dart
Customer {
  id, name, email, phone, profileImage, address,
  registeredDate, totalOrders, totalSpent, status
}
```

### Firestore Storage
- **Collection:** `users`
- **Fields:** `{ firebaseUid, email, name, phone, role: "customer", googleLinked, createdAt, updatedAt }`
- **Customer-specific:** `customers` collection with extended profile

### Admin Reflection
- Admin can view customer list and details in `/customers` screen
- Admin can create/edit customers from dashboard
- Customer totalOrders/totalSpent updated when bookings complete

---

## 2. HOME SCREEN (SDUI)

### Screen (`home_screen.dart`)
- **Loading:** Shimmer placeholder skeleton while SDUI layout loads
- **Primary:** Renders `SduiRenderer` with layout from backend
- **Fallback:** `FallbackHomeContent` if SDUI fetch fails or returns empty

### Fallback Home Content (`fallback_home_content.dart`)
- Static service grid (6 services: Installation, Maintenance, AMC, Repair, Upgrades, Accessories)
- Promo banner section
- "All Products" entry point
- Used when SDUI fails or network is unavailable

### Home Providers (`providers/home_providers.dart`)
- `HomeServiceItem { icon, label, route }` — service grid items
- `HomeRecommendationItem { title, description, image, action }` — recommendation cards
- `HomeProductItem { id, name, price, image }` — popular products

### Widgets
- `service_grid.dart` — 3-column grid of service category icons
- `promo_banner.dart` — Horizontal banner carousel with auto-scroll
- `location_header.dart` — Displays current city/area with change button
- `horizontal_scroll_list.dart` — Generic horizontal scrolling list for recommendations/products

### SDUI Integration
- `GET /api/sdui/layout?screen=home&lat=...&lng=...`
- Returns JSON layout → parsed by `SduiRenderer` → rendered as widgets
- Layout sections: banner carousel, service grid, recommendation cards, product rows

### Firestore Storage
- `sdui_layouts` collection: layout configurations by screen name and region
- `home_cms` collection: banner/promo content managed via admin CMS

### Admin Reflection
- Admin can edit SDUI layout via `/mobile-preview` screen
- CMS blocks (banners, promos) managed from admin dashboard
- Feature flags control visibility of home sections

---

## 3. SERVICE DISCOVERY & SELECTION

### 3.1 Service Type Screen (`service_type_screen.dart`)
- **Purpose:** Lists installation service categories from `InstallationPricingContract`
- **UI:** Card-based grid with service name, description, icon
- **Data:** `GET /api/catalog-public/pricing/installation`
- **Navigation:** Tapping a category → `PackageSelectionScreen`

### 3.2 Package Selection Screen (`package_selection_screen.dart`)
- **Purpose:** Shows groups within a selected category
- **Data:** Same API response, filtered by selected category
- **UI:** Package cards with estimated pricing range
- **Navigation:** Tapping a package → `DynamicServiceScreen`

### 3.3 Dynamic Service Screen (`dynamic_service_screen.dart`)
- **Purpose:** Core customization screen for ANY service type
- **Flow:** Category → Group → Product customization
- **Features:**
  - Variant selectors (renderType: "option" or "list")
  - Branch selectors for grouped products
  - Clubbed product options with quantity steppers
  - Invoice table with real-time totals
  - Dependency engine (e.g., Cable depends on Camera qty)
- **Data:** Fetches service config via `GET /api/catalog-public/pricing/installation/:categoryId`

### 3.4 Products Discovery Screen (`products_discovery_screen.dart`)
- **Purpose:** "All Products" catalog with search
- **Features:**
  - Search bar with debounced input
  - Category filter chips
  - Product grid view
- **Data:** `GET /api/catalog-public/products`
- **Cart:** Add-to-cart button per product, cart bottom sheet accessible

### 3.5 Maintenance Type Screen (`maintenance_type_screen.dart`)
- **Options:** Preventive, Fault Diagnosis, Performance Tuning
- **Data:** `GET /api/catalog-public/pricing/maintenance`

### 3.6 Maintenance Package Screen (`maintenance_package_screen.dart`)
- **Options:** Basic (1 visit), Standard (2 visits), Comprehensive (4 visits)
- **Features:** Frequency, inclusions, price per visit

### 3.7 AMC Plan Screen (`amc_plan_screen.dart`)
- **Purpose:** Annual Maintenance Contract selection
- **Features:** Plan details, feature list, annual price
- **Data:** `GET /api/catalog-public/pricing/amc`

### 3.8 Repair Issue Screen (`repair_issue_screen.dart`)
- **Purpose:** Issue type selection (e.g., Camera Not Working)
- **Data:** `GET /api/catalog-public/pricing/repair`
- **Pricing:** Visit fee + diagnostic fee displayed

### 3.9 System Upgrade Screen (`system_upgrade_screen.dart`)
- **Purpose:** Upgrade bundle listing
- **Data:** `GET /api/catalog-public/upgrade`
- **Features:** Bundle description, included items, price

### 3.10 Accessories Screen (`accessories_screen.dart`)
- **Purpose:** Accessory items with quantity selectors
- **Data:** `GET /api/catalog-public/accessories`

### Flow Providers
- `installation_flow_provider.dart` — Category/group/items state, variant selections, quantities
- `maintenance_flow_provider.dart` — Type/package/item templates/quantities
- `repair_flow_provider.dart` — Issue selection, items, quantities
- `product_selection_provider.dart` — Variant selections for complex products
- `dynamic_service_provider.dart` — Generic multi-service flow: config fetch, selections, variants, branches, list groups, quantities, dependency resolution

### Key Models
- `InstallationPricingContract`, `InstallationCategory`, `InstallationGroup`
- `MappedProduct`, `ClubbedOption`, `ProductVariant`
- `MasterProduct`, `MaintenancePricingContract`, `RepairPricingContract`
- `AmcPricingContract`, `UpgradeBundle`, `AccessoryItem`

### Firestore Storage
- `Services` collection: nested tree structure (Service → Category → Setup → Product → Options)
- `catalog_product` collection: master product catalog
- `pricing_contracts` collection: service-specific pricing configurations

### Admin Reflection
- Service tree built via `/catalog/builder/:serviceId` (drag-and-drop tree editor)
- Products managed via `/catalog/products` CRUD
- Pricing configured per product node in service tree
- Render types (option/list) and dependency rules set by admin

---

## 4. INVOICE & ESTIMATE CUSTOMIZATION

### Installation Customization Screen (`installation_customization_screen.dart`)
- **Purpose:** Live invoice builder for installation services
- **Components:**
  - Variant selectors (chip-based for option mode)
  - Branch selectors (ChoiceChips for list mode)
  - List product groups with quantity steppers
  - `InvoiceTable` with real-time totals
- **Behavior:**
  - Quantity changes → immediate invoice recalculation
  - "Proceed" button → navigates to scheduling

### Maintenance Customization Screen (`maintenance_customization_screen.dart`)
- **Purpose:** Quantity-stepped maintenance invoice
- **Features:** Package items list with quantity adjustment, total preview

### Repair Estimate Screen (`repair_estimate_screen.dart`)
- **Purpose:** Repair estimate with fees
- **Features:** Visit fee + diagnostic fee (fixed), editable parts/items

### Upgrade Estimate Screen (`upgrade_estimate_screen.dart`)
- **Purpose:** Upgrade bundle estimate
- **Features:** Bundle items, install/migration quantities

### Accessories Estimate Screen (`accessories_estimate_screen.dart`)
- **Purpose:** Accessories quantity adjustment
- **Features:** Per-item quantity steppers, total preview

### Invoice Table Widget (`widgets/invoice_table.dart`)
- **Columns:** Product, Price, Quantity, Amount
- **Features:** Quantity stepper per row, running total at bottom
- **Reused across:** All 5 customization screens

### Key Models
- `InvoiceLineItem { productId, name, unitPrice, quantity, total, variant }`
- `InvoiceTableRowData { label, price, quantity, amount, onChange, min, max }`
- `AccessoryEstimateEntry { accessory, quantity, total }`

### Admin Reflection
- Invoice templates managed via `/api/catalog/invoices` (admin CRUD)
- Tax rates (GST 18%) configured in catalog
- Minimum/maximum quantities per product configured in service tree

---

## 5. BOOKING & PAYMENT FLOW

### Scheduling Screen (`scheduling_screen.dart`)
- **Auth Guard:** Redirects to login if unauthenticated
- **Date Picker:** 6-day range starting from tomorrow
- **Time Slot Selection:** Available slots from backend
- **Location Display:** Selected address with change option
- **Booking Summary:** Service name, items, estimated total

### Recommendation Screen (`recommendation_screen.dart`)
- **Purpose:** Cross-sell/upsell at checkout — shows service-specific recommended add-ons
- **Modes:**
  1. **Tree Mode** (new, preferred): When `serviceType` parameter is provided. Fetches from `Recommendation_Addons` service tree filtered by service type.
  2. **Legacy Mode** (fallback): When no `serviceType`, fetches from `catalog_recommendations` collection (old behavior)
- **Tree Mode Features:**
  - **Data:** `GET /api/catalog-public/services/recommendations/pricing?serviceType=X`
  - Category chips row (horizontal scroll) — shows each category mapped to the current service
  - Setup/Groups filter chips below categories
  - Product cards with selection checkboxes and quantity controls
  - Clubbed product groups with nested option selection
  - "Continue with Selection" / "Skip & Continue" buttons
  - Supports all rendering features: clubbed options, branches, nested trees
- **Entry Points:**
  - After scheduling a service → push to `/recommendation` with `extra: serviceTypeId`
  - `ActiveOrderSummary.serviceTypeId` set by each service flow (installation, amc, repair, etc.)
  - From home screen SDUI (legacy, no serviceType)
- **Service Type IDs used for recommendation filtering:**
  - `installation`, `maintenance`, `amc`, `repair`, `upgrade`, `accessories`
  - Dynamic services use their safe ID
- **Admin Setup:** Admin maps categories in `Recommendation_Addons` builder to service types using ✏️ edit → Service Mapping checkboxes

### Payment Screen (`payment_screen.dart`)
- **Integration:** Razorpay checkout
- **Flow:**
  1. `POST /api/payments/razorpay/create-order` → receives `orderId`
  2. Opens Razorpay checkout with `orderId`, amount, customer info
  3. On success: `POST /api/payments/razorpay/verify` with `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
  4. On verification: `POST /api/bookings` creates the booking record
  5. Navigates to confirmation screen
- **Error Handling:** Payment failure → retry option, booking not created

### Booking Confirmation Screen (`booking_confirmation_screen.dart`)
- **Purpose:** Post-payment success view
- **Content:** Order summary, schedule date/time, payment breakdown
- **Actions:** "View My Bookings" → navigates to order history

### Booking List Screen (`screens/booking_list_screen.dart`)
- **Purpose:** "My Bookings" tab
- **UI:** Status badges (Confirmed, In Progress, Completed, Cancelled)
- **Data:** `GET /api/bookings?customerId=...`

### Booking Flow Provider (`providers/booking_flow_provider.dart`)
- **State:** Selected date, time slot, address ID
- **Validation:** Ensures date is within 6-day range, slot is available

### Active Order Provider (`providers/active_order_provider.dart`)
- **State:** `ActiveOrderSummary { lineItems[], serviceName, packageLabel, estimatedTotal }`
- **Source:** Accumulated from service selection flow (installation/maintenance/repair/etc.)

### Razorpay Payment Service (`services/razorpay_payment_service.dart`)
- `createOrder(amount, currency)` → `POST /api/payments/razorpay/create-order`
- `verifyPayment(orderId, paymentId, signature)` → `POST /api/payments/razorpay/verify`

### Key Models
- `ActiveOrderSummary { lineItems, serviceName, packageLabel, estimatedTotal }`
- `ActiveOrderLineItem { name, quantity, unitPrice, total }`
- `BookingFlowState { selectedDate, selectedTimeSlot, addressId }`
- `RazorpayCheckoutOrder { orderId, amount, currency }`
- `RazorpayVerificationResult { success, bookingId, message }`

### Firestore Storage
- `bookings` collection: booking record with customerId, items, total, status, schedule
- `payments` collection: payment transaction records
- `Invoices` collection: generated canonical invoices with GST

### Admin Reflection
- Jobs created from bookings visible in admin `/jobs` screen
- Payment records visible in `/payments` screen
- Booking status changes reflected in admin dashboard metrics

---

## 6. PROFILE & ORDER HISTORY

### Profile Screen (`screens/profile_screen.dart`)
- **Sections:**
  - Avatar, name, email display
  - Edit profile (name, email, phone)
  - Saved addresses list
  - Order history link
  - Logout button
- **Edit Profile:** Opens inline edit fields → `PATCH /api/customers/:id`

### Order History Screen (`screens/order_history_screen.dart`)
- **UI:** List of bookings with status, service type, amount, date
- **Empty State:** "No orders yet" with call-to-action to browse services
- **Data:** `GET /api/bookings?customerId=...`
- **Navigation:** Tap → `BookingDetailScreen`

### Booking Detail Screen (`screens/booking_detail_screen.dart`)
- **Content:** Full booking details, invoice breakdown, schedule info
- **Actions:** Cancel booking (if status allows), contact support

### Address List Screen (`screens/address_list_screen.dart`)
- **UI:** Saved addresses with radio selection for default
- **Actions:** Add, edit, delete address
- **Data:** `GET /api/customers/:customerId/addresses`

### Address Form Screen (`screens/address_form_screen.dart`)
- **Fields:** Label (Home/Work/Other), Address line, City, State, Pincode, Geo-location
- **Location Picker:** Opens `LocationPickerScreen` for map selection
- **CRUD:** `POST/PATCH/DELETE /api/customers/:customerId/addresses`

### Booking Provider (`providers/booking_provider.dart`)
- `bookingsProvider` — AsyncNotifier fetching bookings for authenticated user
- `BookingModel { id, serviceType, status, amount, scheduledDate, createdAt, items[] }`

### Address Provider (`providers/address_provider.dart`)
- CRUD operations on saved addresses
- Default address selection

### Firestore Storage
- `customers/:customerId/addresses` subcollection
- `bookings` collection (customerId indexed)

### Admin Reflection
- Customer addresses visible in admin customer detail
- Booking history visible to admin support team
- Profile changes sync to admin customer view

---

## 7. LOCATION SERVICES

### Location Picker Screen (`location_picker_screen.dart`)
- **Integration:** Google Maps widget
- **Features:** Search places, drag pin, reverse geocoding
- **Output:** Selected lat/lng + formatted address

### Location Permission Screen (`location_permission_screen.dart`)
- **Purpose:** Request GPS permission on first launch
- **UI:** Illustration + explanation + "Allow" button
- **Fallback:** Manual location entry if permission denied

### Location Provider (`providers/location_provider.dart`)
- **State:** `LocationState { lat, lng, address, isLoading, error }`
- **Functions:**
  - `fetchCurrentLocation()` — GPS coordinates via `LocationService`
  - `reverseGeocode(lat, lng)` — Address from coordinates
  - `checkServiceability(lat, lng)` — `GET /api/serviceability?lat=&lng=`
  - `setManualLocation(address, lat, lng)` — User picks from map
  - `saveLocationPreference()` — Persist to SharedPreferences
- **Auto-fetch:** On app start (from splash screen)

### Key Models
- `LocationState { lat, lng, address, areaName, isServiceable }`

### Firestore Storage
- `serviceable_areas` collection: polygon/map data for serviceability checks
- Customer saved addresses stored in `customers/:id/addresses`

### Admin Reflection
- Serviceable areas managed via `/settings/serviceable-areas` in admin
- Location-specific SDUI layouts can be configured

---

## 8. SHOPPING CART

### Cart Screen (`screens/cart_screen.dart`)
- **Access:** Bottom sheet from Products Discovery screen
- **UI:** Product list with quantity controls, line totals, grand total
- **Actions:**
  - Quantity increment/decrement per item
  - Remove item (swipe or button)
  - "Proceed to Checkout" button

### Cart Provider (`data/providers/cart_provider.dart`)
- **State:** `CartState { items[], totalAmount }`
- **Functions:**
  - `addItem(product, quantity)` — Add with variant selection
  - `updateQuantity(productId, quantity)` — Change quantity
  - `removeItem(productId)` — Remove from cart
  - `clearCart()` — Reset after checkout
- **Persistence:** Cart persisted in local state (not persisted across app restarts currently)

### Key Models
- `CartItem { product, quantity, variant, unitPrice, total }`

### Firestore Storage
- Cart is client-side only (not stored in Firestore)

### Admin Reflection
- Product catalog managed via admin `/catalog/products`
- Prices updated by admin reflected in customer cart

---

## 9. ROUTING & NAVIGATION

### Router Configuration (`routes/app_router.dart`)
- **Package:** GoRouter v14.8.1 + Riverpod (`Provider<GoRouter>`)
- **Initial Location:** `/` (splash screen)
- **Auth Guard:** Global redirect with 3-layer protection
- **Wiring:** `MaterialApp.router(routerConfig: router)` in `main.dart`

### Route Constants (`core/constants/app_routes.dart`)
```dart
class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const phoneAuth = '/phone-auth';
  static const phoneCollection = '/phone-collection';
  static const locationPermission = '/location-permission';
  static const locationPicker = '/location-picker';
  static const home = '/home';
  static const profile = '/profile';
  static const about = '/about';
  static const orderHistory = '/order-history';
  static const bookingDetail = '/booking-detail';
  static const productsDiscovery = '/products-discovery';
  static const serviceTypes = '/service-types';
  static const servicePlaceholder = '/service';
  static const packageSelection = '/package-selection';
  static const installationCustomization = '/installation-customization';
  static const maintenanceTypes = '/maintenance-types';
  static const maintenancePackageSelection = '/maintenance-package-selection';
  static const maintenanceCustomization = '/maintenance-customization';
  static const amcPlans = '/amc-plans';
  static const repairIssues = '/repair-issues';
  static const repairEstimate = '/repair-estimate';
  static const systemUpgrade = '/system-upgrade';
  static const upgradeEstimate = '/upgrade-estimate';
  static const accessories = '/accessories';
  static const accessoriesEstimate = '/accessories-estimate';
  static const scheduling = '/scheduling';
  static const recommendation = '/recommendation';
  static const payment = '/payment';
  static const confirmation = '/confirmation';
}
```

### Complete Route Table (31 routes)

| # | Path | Screen | Auth | Notes |
|---|------|--------|------|-------|
| 1 | `/` | `SplashScreen` | No | Auto-navigates to `/home` after 2s |
| 2 | `/login` | `LoginScreen` | No | Redirects authenticated users away |
| 3 | `/phone-auth` | `PhoneAuthScreen` | No | Phone OTP verification |
| 4 | `/phone-collection` | `PhoneCollectionScreen` | No (but auth) | Phone input with `?continue=` param |
| 5 | `/location-permission` | `LocationPermissionScreen` | No | Location permission request |
| 6 | `/location-picker` | `LocationPickerScreen` | No | Map location picker |
| 7 | `/home` | `HomeScreen` | No | Main screen SDUI + bottom nav |
| 8 | `/profile` | `ProfileScreen` | **YES** | Profile management |
| 9 | `/about` | `AboutScreen` | No | App info screen |
| 10 | `/order-history` | `OrderHistoryScreen` | **YES** | Past bookings list |
| 11 | `/booking-detail` | `BookingDetailScreen` | **YES** | Uses `state.extra` for `BookingModel` |
| 12 | `/products-discovery` | `ProductsDiscoveryScreen` | No | Browse/search products |
| 13 | `/service-types` | `ServiceTypeScreen` | No | Installation service types |
| 14 | `/service/:serviceId` | `DynamicServiceScreen` | No | Param + extras: title, icon |
| 15 | `/package-selection` | `PackageSelectionScreen` | No | Camera packages |
| 16 | `/installation-customization` | `InstallationCustomizationScreen` | No | Customize installation |
| 17 | `/maintenance-types` | `MaintenanceTypeScreen` | No | Maintenance type picker |
| 18 | `/maintenance-package-selection` | `MaintenancePackageScreen` | No | Package selector |
| 19 | `/maintenance-customization` | `MaintenanceCustomizationScreen` | No | Customize maintenance |
| 20 | `/amc-plans` | `AmcPlanScreen` | No | AMC plan selection |
| 21 | `/repair-issues` | `RepairIssueScreen` | No | Issue selection |
| 22 | `/repair-estimate` | `RepairEstimateScreen` | No | Repair cost estimate |
| 23 | `/system-upgrade` | `SystemUpgradeScreen` | No | Upgrade bundles |
| 24 | `/upgrade-estimate` | `UpgradeEstimateScreen` | No | Uses `state.extra` for `UpgradeBundle` |
| 25 | `/accessories` | `AccessoriesScreen` | No | Accessories catalog |
| 26 | `/accessories-estimate` | `AccessoriesEstimateScreen` | No | Uses `state.extra` for entries |
| 27 | `/scheduling` | `SchedulingScreen` | No | Date/time slot picker |
| 28 | `/recommendation` | `RecommendationScreen` | No | Cross-sell/upsell (accepts `serviceType` via extra) |
| 28a | `/recommendation/:serviceType` | `RecommendationScreen` | No | Service-specific recommendations from tree |
| 29 | `/payment` | `PaymentScreen` | **YES** | Razorpay checkout |
| 30 | `/confirmation` | `BookingConfirmationScreen` | **YES** | Post-payment confirmation |

### Auth Guard — 3-Layer Protection

**Layer 1 — Authentication Required:**
```dart
const authRequiredRoutes = { payment, confirmation, profile, orderHistory, bookingDetail };
if (!authState.isAuthenticated && requiresAuth) return '/login';
```
Only 5 routes require auth. All browsing (services, estimates, scheduling) is public.

**Layer 2 — Login Redirect:**
```dart
if (authState.isAuthenticated && (path == '/login' || path == '/phone-auth')) return '/home';
```
Authenticated users can't see login screens.

**Layer 3 — Phone Collection Guard:**
```dart
if (authState.isAuthenticated && noPhone && authRoute) return '/phone-collection?continue=/original-path';
```
After login, if user has no phone, redirect to phone collection then back to original route.

### Navigation Methods Used

| Method | Count | Usage |
|--------|-------|-------|
| `context.push(route)` | ~40 | Forward navigation (keeps back stack) |
| `context.go(route)` | ~15 | Destination navigation (replaces stack — login, splash) |
| `context.pop()` | ~4 | Back navigation |
| `GoRouter.of(context).go()` | 3 | Outside build context (payment, login) |
| `Navigator.pop(context)` | 2 | In scheduling screen after auth gate |

### Bottom Navigation (`widgets/customer_bottom_navigation.dart`)
- **NOT** using GoRouter `ShellRoute` — manually embedded per screen
- **3 Tabs:** Home (`/home`), Bookings (`/order-history`), Profile (`/profile`)
- **State:** `navigationIndexProvider` (Riverpod `StateProvider<int>`)
- **Screens that embed it:** HomeScreen (0), BookingListScreen (1), CartScreen (1), ProfileScreen (2), OrderHistoryScreen (1)
- **Issue:** No `StatefulShellRoute` — switching tabs replaces the stack, losing scroll position

### Deep Linking — NOT Configured
- No Android intent filters for deep links
- No `app_links`, `uni_links`, or `firebase_dynamic_links` packages
- No iOS deep link configuration
- No GoRouter `initialLocation` override for deep links
- SDUI has a `deeplink` action type but it's treated same as `navigate`

### Route Transitions
- **GoRouter:** No custom transitions defined (uses defaults)
- **Theme:** `FadeUpwardsPageTransitionsBuilder` (Android), `CupertinoPageTransitionsBuilder` (iOS)
- **Splash:** Custom animation controller (fade + slide + scale, 1500ms)
- **Login:** Fade-in + slide-up (1000ms)
- **Profile:** Fade-in (600ms)

### Navigation Flow Diagram
```
Splash (/) --2s--> Home (/home)
                      |
          +-----------+-----------+
          |           |           |
      Login       Browse All   Service Grid
     (/login)    (/products-   (push to
          |       discovery)   various)
     +----+---+
     |        |
Phone Auth  Google Sign-in
(/phone-auth) --> Phone Collection
                    (/phone-collection)
                       |
                       v
                    Home --> Scheduling --> Payment --> Confirmation

Service Flows (all public):
  Home -> Installation -> /service-types -> /package-selection -> /installation-customization -> /scheduling
  Home -> Maintenance -> /maintenance-types -> /maintenance-package-selection -> /maintenance-customization -> /scheduling
  Home -> AMC -> /amc-plans -> /scheduling
  Home -> Repair -> /repair-issues -> /repair-estimate -> /scheduling
  Home -> Upgrade -> /system-upgrade -> /upgrade-estimate -> /scheduling
  Home -> Accessories -> /accessories -> /accessories-estimate -> /scheduling

  Scheduling -> (auth check) -> Payment -> Confirmation
```

### Known Routing Issues

| Issue | Details |
|-------|---------|
| Dead CartScreen | `cart_screen.dart` exists but never imported/routed |
| No ShellRoute | Bottom nav manually duplicated across screens |
| No StatefulShellRoute | Tab switch loses state/scroll position |
| No deep linking | Zero push notification or QR navigation support |
| No 404/error route | No `errorBuilder` — unknown routes show blank screen |
| Duplicate booking list | `BookingListScreen` and `OrderHistoryScreen` similar |
| Mixed pop methods | `Navigator.pop()` with GoRouter can cause issues |
| No guest cart preservation | Guest browsing context lost on login |

---

## 10. SDUI RENDERING ENGINE

### SDUI Renderer (`core/sdui/sdui_renderer.dart`)
- **Purpose:** Server-Driven UI — renders widget trees from backend JSON
- **Flow:**
  1. `GET /api/sdui/layout?screen=home` returns JSON layout
  2. `SduiProvider` parses JSON into `SduiLayout` model
  3. `SduiRenderer` maps components to Flutter widgets via `SduiComponentRegistry`
  4. Each `SduiComponent` has: `type, data, children[], actions[], visibility`

### SDUI Components
| Component Type | Flutter Widget | Data Source |
|---------------|----------------|-------------|
| `banner_carousel` | HorizontalPageView | CMS banners |
| `service_grid` | GridView (3 cols) | Service catalog |
| `recommendation_row` | ListView horizontal | Recommendations API |
| `product_row` | ListView horizontal | Catalog products |
| `text_block` | Text/RichText | Static content |
| `image_block` | CachedNetworkImage | Image URL |
| `action_button` | ElevatedButton | Action config |

### SDUI Provider (`core/sdui/sdui_provider.dart`)
- `SduiLayout { id, screen, version, sections[] }`
- `SduiSection { id, type, components[], styles }`

### SDUI Contracts (`backend_server/src/contracts/sdui_contracts.ts`)
- `SduiComponent { type, data, children, actions, visibility, styles }`
- `SduiLayout { screen, version, sections }`
- `SduiAction { type, payload, navigation }`
- `SduiVisibility { roles[], locations[], featureFlags[] }`

### Firestore Storage
- `sdui_layouts` collection: layout JSON per screen
- `home_cms` collection: banner/promo content referenced by SDUI

### Admin Reflection
- SDUI layouts managed via `/mobile-preview` admin screen
- CMS blocks managed via `/catalog/cms` admin interface
- Feature flags toggle SDUI component visibility

---

## 11. DATA LAYER: REPOSITORIES & PROVIDERS

### API Service (`data/datasources/api_service.dart`)
- **HTTP Client:** Dio-based
- **Base URL:** From `ApiConfig` (configured per environment)
- **Interceptors:**
  - Firebase auth token injection (Bearer token)
  - Error handling with retry logic
  - Request/response logging (debug mode)
- **Methods:** `get`, `post`, `patch`, `delete`

### Pricing API Data Source (`data/datasources/pricing_api_datasource.dart`)
- `getInstallationPricing()` → `GET /api/catalog-public/pricing/installation`
- `getMaintenancePricing()` → `GET /api/catalog-public/pricing/maintenance`
- `getRepairPricing()` → `GET /api/catalog-public/pricing/repair`
- `getAmcPricing()` → `GET /api/catalog-public/pricing/amc`
- `getUpgradeBundles()` → `GET /api/catalog-public/upgrade`
- `getAccessories()` → `GET /api/catalog-public/accessories`

### Service Catalog Data Source (`data/datasources/service_catalog_api_datasource.dart`)
- `getProducts()` → `GET /api/catalog-public/products`
- `getProductById(id)` → `GET /api/catalog-public/products/:id`
- `getServices()` → `GET /api/catalog-public/services`
- `getRecommendations(placement)` → `GET /api/catalog-public/recommendations`

### Pricing Repository (`data/repositories/pricing_repository.dart`)
- Caches pricing contracts locally
- Fallback to cache if network fails

### Service Catalog Repository (`data/repositories/service_catalog_repository.dart`)
- Product listing with pagination support
- Search/filter by category

### Data Providers (`data/providers/data_providers.dart`)
- Riverpod providers for all data repositories
- AsyncNotifier patterns for loading/error/data states

### Cart Provider (`data/providers/cart_provider.dart`)
- In-memory cart state
- Add/remove/update/clear operations

### Key Models (`data/models/pricing_contracts.dart`)
- All pricing contract interfaces
- `ServiceCatalogItem { id, name, type, price, image }`

---

## 12. FIRESTORE DATA MODEL REFERENCE

### Collections Accessed by Customer App

| Collection | Read | Write | Purpose |
|-----------|------|-------|---------|
| `users` | Firebase UID | Auth flow | User registry |
| `customers` | Customer ID | Profile update | Customer profile |
| `Services` | Public (anon) | — | Service tree config |
| `catalog_product` | Public (anon) | — | Product catalog |
| `sdui_layouts` | Public (anon) | — | SDUI layouts |
| `home_cms` | Public (anon) | — | Banners/promos |
| `bookings` | Customer ID | Create | Booking records |
| `payments` | Customer ID | Create | Payment records |
| `serviceable_areas` | Public (anon) | — | Serviceability zones |

### Key Document Structures

**`users` document:**
```
{
  firebaseUid: string,
  email: string,
  name: string,
  phone: string,
  role: "customer",
  googleLinked: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**`customers` document:**
```
{
  uid: string (Firebase),
  name: string,
  phone: string,
  email: string,
  profileImage: string (URL),
  defaultLocationId: string,
  savedLocations: array,
  status: "active" | "inactive",
  createdAt: Timestamp
}
```

**`bookings` document:**
```
{
  customerId: string,
  items: array<{ productId, name, quantity, unitPrice, total }>,
  serviceType: string,
  status: "confirmed" | "in_progress" | "completed" | "cancelled",
  total: number,
  paidAmount: number,
  scheduledDate: Timestamp,
  timeSlot: string,
  addressId: string,
  createdAt: Timestamp
}
```

---

## 13. BLOCK DIAGRAMS

### Authentication Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Login      │────>│ Firebase    │────>│ POST /api   │
│  Screen     │     │ Auth SDK    │     │ /users/link │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │ Firestore   │
                                        │ users (doc) │
                                        └─────────────┘
```

### Service Selection → Booking Flow
```
Service Type Selection
        │
        ▼
Package Selection
        │
        ▼
Dynamic Service Customization ─── Invoice Table (real-time)
        │
        ▼
Scheduling (Date + Time)
        │
        ▼
Recommendations (cross-sell)
        │
        ▼
Razorpay Payment ─── POST /create-order ─── POST /verify
        │
        ▼
Booking Confirmation ─── POST /api/bookings
        │
        ▼
My Bookings (Order History)
```

### SDUI Rendering Pipeline
```
Admin CMS/SDUI Editor
        │
        ▼
Firestore (sdui_layouts, home_cms)
        │
        ▼
GET /api/sdui/layout?screen=home
        │
        ▼
SduiProvider (parse JSON)
        │
        ▼
SduiRenderer (component → widget map)
        │
        ▼
Flutter Widget Tree (rendered on screen)
```

### Location → Serviceability → SDUI Flow
```
GPS / Manual Location
        │
        ▼
Reverse Geocode (lat/lng → address)
        │
        ▼
GET /api/serviceability?lat=&lng=
        │
        ▼
Serviceable? ──Yes──→ GET /api/sdui/layout?screen=home&location=
        │                    │
        No                   ▼
        │              Personalized Home
        ▼
"Not Available in Your Area"
```

---

## 14. MULTI-CASE BEHAVIOR ANALYSIS

### Case 1: Guest User Tries to Book
1. User browses services and selects items
2. Taps "Proceed to Checkout" on invoice screen
3. Auth guard checks: `isGuest == true`
4. Redirects to login screen with message: "Please sign in to continue"
5. After successful login → returns to checkout flow (cart preserved)

### Case 2: Payment Timeout / Failure
1. Razorpay checkout opened
2. User closes without completing / payment fails
3. `onPaymentError` callback fires
4. Booking NOT created (no POST to /api/bookings)
5. User sees error dialog with "Try Again" and "Cancel" options
6. "Try Again" → reopens Razorpay checkout
7. "Cancel" → returns to invoice screen (items preserved)

### Case 3: Service Not Available in Area
1. User opens app → splash screen → location fetch
2. Serviceability check returns false
3. App shows "We're not yet in your area" banner on home screen
4. Service catalog still accessible (browsing allowed)
5. Checkout flow blocked (scheduling screen shows "Not serviceable")

### Case 4: Network Offline
1. Home screen → SDUI fails → falls back to `FallbackHomeContent`
2. Service catalog → cached pricing contracts used if available
3. Booking/payment → network error → retry dialog
4. Cart → local only, functional offline
5. "Retry" button on error states

### Case 5: Phone Already Registered (Duplicate)
1. User signs in with Google (new Firebase account)
2. PhoneCollectionScreen shows existing phone
3. `GET /api/users/by-phone/:phone` returns existing user
4. Warning: "This phone is already linked to another account"
5. Option to merge accounts (backend handles `mergeFirestoreUserAccounts`)
6. On merge: both Firebase UIDs point to same Firestore user document

---

## 15. KNOWN ISSUES & FIXES REQUIRED

### Issue 1: Cart Not Persisted Across Restarts
- **Problem:** Cart state is in-memory only; clearing app from memory loses cart contents
- **Location:** `data/providers/cart_provider.dart`
- **Fix:** Serialize cart to SharedPreferences or local storage on each mutation

### Issue 2: Guest Cart Lost on Login
- **Problem:** Guest user adds items to cart, logs in, cart is empty
- **Location:** Auth flow transition (guest → authenticated)
- **Fix:** Persist cart before auth transition, restore after successful login

### Issue 3: SDUI Layout Caching Missing
- **Problem:** SDUI layout fetched on every home screen visit (no caching)
- **Location:** `home_screen.dart` — always calls API
- **Fix:** Cache SDUI layout with configurable TTL, refresh on pull-to-refresh

### Issue 4: Date Range Hardcoded to 6 Days
- **Problem:** Scheduling screen shows only 6 days from tomorrow
- **Location:** `scheduling_screen.dart`
- **Fix:** Make date range configurable via admin setting or backend response

### Issue 5: No Loading State Between Payment and Confirmation
- **Problem:** After payment success, there's a gap while booking is created (no spinner)
- **Location:** `payment_screen.dart` — booking creation after verification
- **Fix:** Show loading overlay during `POST /api/bookings` call

### Issue 6: Address Not Pre-selected on Scheduling
- **Problem:** Scheduling screen doesn't auto-select the default address
- **Location:** `scheduling_screen.dart` — address section
- **Fix:** Fetch and pre-select default address from user profile on screen init

### Issue 7: Empty Cart Models/Providers Directories
- **Problem:** `mobile_customer/lib/features/cart/models/` and `providers/` are empty
- **Location:** Feature directory structure
- **Fix:** Either remove empty directories or implement cart models/providers and move cart logic there

### Issue 8: No Push Notification for Booking Confirmation
- **Problem:** After booking, there's no push notification to confirm
- **Location:** Booking flow — no FCM integration for customer
- **Fix:** Integrate Firebase Cloud Messaging, send notification on booking creation

---

## APPENDIX: ALL API ENDPOINTS

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/users/link` | Firebase | Link Firebase user |
| GET | `/api/users/by-email/:email` | None | Check email |
| GET | `/api/users/by-phone/:phone` | None | Check phone |
| GET | `/api/users/me` | Firebase | Get current user |
| GET | `/api/users/:id` | Firebase | Get user by ID |

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
| GET | `/api/catalog-public/services/:serviceId/pricing?serviceType=X` | None | Dynamic service pricing (filtered by service type) |

### SDUI
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/sdui/layout` | None | Get screen layout |
| GET | `/api/sdui/screens` | None | List screens |

### Bookings
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/bookings` | Firebase | List user bookings |
| POST | `/api/bookings` | Firebase | Create booking |
| GET | `/api/bookings/:id` | Firebase | Get booking detail |

### Payments
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payments/razorpay/create-order` | Firebase | Create Razorpay order |
| POST | `/api/payments/razorpay/verify` | Firebase | Verify payment |

### Customers
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/customers/:id` | Firebase | Get profile |
| PATCH | `/api/customers/:id` | Firebase | Update profile |
| GET | `/api/customers/:customerId/addresses` | Firebase | List addresses |
| POST | `/api/customers/:customerId/addresses` | Firebase | Add address |
| PATCH | `/api/customers/:customerId/addresses/:id` | Firebase | Update address |
| DELETE | `/api/customers/:customerId/addresses/:id` | Firebase | Delete address |

### Serviceability
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/serviceability` | None | Check serviceability |

---

**END OF AUDIT**
