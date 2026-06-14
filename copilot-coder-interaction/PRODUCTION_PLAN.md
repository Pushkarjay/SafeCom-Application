# SafeCom Production-Ready Implementation Plan

This document outlines the phased approach to transform the SafeCom application from a prototype with mock data to a production-ready application with a live backend, real authentication, and robust business logic.

## Phase 1: Backend & Data Foundation

**Goal:** Eliminate all hardcoded data from the mobile application. All service and pricing information will be fetched from a live Firestore database.

**Tasks:**
1.  **Data Modeling:** Define and document the Firestore data models for `service_catalogs`, `pricing_contracts`, and other related entities.
2.  **Database Seeding:** Create and run a script (`seed-firestore.ts`) to populate the Firestore database with the initial service catalog and pricing data. This ensures the backend has a source of truth.
3.  **Backend Service Layer:** Implement `FirestoreService` in the backend to handle all database interactions (reading service catalogs, fetching pricing, etc.).
4.  **API Endpoint Creation:** Create new, secure API endpoints on the backend server (e.g., `/api/services/catalog`, `/api/pricing/contracts`) that the mobile app will use to fetch data.
5.  **Mobile App Refactoring:**
    *   Remove all hardcoded mock data files and logic from the Flutter application.
    *   Create a `ApiService` or `DataRepository` in the Flutter app to communicate with the new backend endpoints.
    *   Update all providers (e.g., `homeServicesProvider`) and screens to fetch data from the new API service instead of using mock data.
    *   Implement local caching for the fetched data to support offline viewing.

**Status:** In Progress

**Completed:**
- ✅ Defined TypeScript interfaces for all data structures in `backend_server/src/types.ts`
- ✅ Updated `backend_server/scripts/seed-firestore.ts` to include service catalog and pricing data
- ✅ Created `backend_server/src/services/catalogService.ts` to fetch data from Firestore
- ✅ Created `backend_server/src/routes/catalogPublic.ts` with public API endpoints
- ✅ Updated `backend_server/src/app.ts` to register the new public catalog routes
- ✅ Created `mobile_customer/lib/data/datasources/api_service.dart` to replace `MockApiTransport`
- ✅ Updated `mobile_customer/lib/data/providers/data_providers.dart` to use `ApiService`
- ✅ Updated `mobile_customer/lib/data/datasources/service_catalog_api_datasource.dart`
- ✅ Updated `mobile_customer/lib/data/datasources/pricing_api_datasource.dart`
- ✅ Verified mobile app builds successfully (`flutter analyze` passed)

**Next Steps:**
- Run the seeding script to populate Firestore with data
- Test the API endpoints to ensure they return data correctly
- Refactor the Admin and Employee apps to use the new API endpoints

**Identified Mock Data in Other Apps:**
- `mobile_employee/lib/data/datasources/jobs_datasource.dart` - Uses fallback mock data for jobs
- `mobile_employee/lib/features/profile/employee_profile_screen.dart` - Uses mock employee data
- `mobile_employee/lib/features/earnings/earnings_screen.dart` - Uses mock earnings data
- `backend_server/src/data/mock-data.ts` - Contains all the seed data for the database

---

## Phase 2: Real Authentication & User Management

**Goal:** Implement a complete and secure Firebase Authentication flow.

**Tasks:**
1.  **Firebase Project Setup:** Verify Firebase project configuration, including enabling Firebase Authentication for Email/Password and Google Sign-In.
2.  **Authentication Service:** Refactor the `AuthService` in the Flutter app to use the Firebase Authentication SDK for all operations: `login`, `signup`, `continueWithGoogle`, `logout`, `resetPassword`.
3.  **Secure API Endpoints:** Secure all backend endpoints that deal with user-specific data. The backend will validate Firebase Auth ID tokens on incoming requests.
4.  **Profile Screen Logic:**
    *   Fix the "Sign in with email" and "Continue with Google" buttons on the guest profile screen to trigger the real Firebase auth flows.
    *   Ensure the profile screen correctly reflects the authenticated user's data from Firebase.
5.  **Order History:** Refactor the `OrderHistoryScreen` to be truly gated. It will only fetch and display orders for the currently logged-in user. For guest users, it will display a prompt to log in.

**Status:** Not Started

---

## Phase 3: Business Logic & UI/UX Refinement

**Goal:** Fix critical business logic flaws and improve the user experience based on feedback.

**Tasks:**
1.  **Location & Maps:**
    *   Investigate and fix the location search functionality. Ensure the geocoding API is correctly implemented and has the necessary API keys configured.
    *   Verify the map functionality on a real Android device to confirm the `google_maps_flutter` package is working as expected outside of Chrome.
2.  **Booking & Customization Logic:**
    *   Implement the logic for automatically upgrading camera packages (e.g., from an 8-camera to a 16-camera package if the user increases the quantity beyond the package limit).
    *   Enforce the maximum limit of 32 cameras.
3.  **Admin Dashboard Integration:** While a full admin dashboard is a larger project, we will ensure the data models created in Phase 1 are structured to be easily managed by a future admin interface.

**Status:** Not Started

---

## Phase 4: Testing, Validation & Deployment Prep

**Goal:** Ensure the application is stable, performant, and ready for deployment.

**Tasks:**
1.  **End-to-End Testing:** Perform thorough testing of all user flows: guest browsing, registration, login, booking, payment, and profile management.
2.  **Error Handling & Logging:** Implement comprehensive error handling and logging throughout the application to help diagnose issues in production.
3.  **Performance Optimization:** Analyze app performance, particularly data fetching and screen load times.
4.  **Production Handoff:** Update all documentation in the `handoff` directory with the new production-ready architecture, API details, and setup instructions.

**Status:** Not Started
