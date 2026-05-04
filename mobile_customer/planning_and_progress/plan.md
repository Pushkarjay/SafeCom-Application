# Mobile Customer Plan

## Phase 1
- App bootstrap and navigation.
- Location permission and location header.
- Home screen service cards.

## Phase 2
- Installation service selection and package screen.
- Customization and dynamic invoice table.

## Phase 3
- Scheduling, booking amount payment, confirmation.
- Polishing and API integration.

## Phase 4
- Dynamic catalog and pricing fetch (packages, products, add-ons, taxes).
- Recommendation page backed by admin-configured data.
- Invoice rendering with GST/tax breakdown and line items.
- Booking draft + invoice persistence in Firestore.

## Phase 5
- Location picker/search with pin drop and saved locations.
- Auth guard for booking flow and session persistence.
- Payment gateway integration with loader and retry states.

## Phase 6 (2026-05-04 Change Request)
- Replace any remaining mock/static location flow with fully working map-based location selection.
- Ensure default location fallback is Patna, Bihar.
- Add backend serviceability check and out-of-service-area handling.
- Replace static banner/announcement blocks with backend-driven content.
- Implement "View All Products" screen with search/filter/sort, fully backend-driven.

## Phase 7 (2026-05-04 Change Request)
- Align booking with authenticated user profile and saved addresses.
- Improve profile UX to prioritize customer identity, contact, address, and booking history.
- Ensure invoice includes all selected products/add-ons with quantity and totals and matches employee/admin representations.
- Verify layouts in both gesture and 3-button navigation modes to prevent overlap issues.
