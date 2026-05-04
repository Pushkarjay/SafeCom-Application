# Mobile Customer Progress

## 2026-04-22
- Flutter project initialized in mobile_customer.
- Domain-oriented lib folders are available: core, data, features, routes, widgets.

## Pending
- Dependency setup.
- Router and app shell.
- Feature screen scaffolding.

## Update 2026-04-22 (Phase 1 Base Completed)
- Added app bootstrap with Riverpod ProviderScope.
- Added GoRouter navigation flow: splash -> location-permission -> home.
- Implemented initial Porter-inspired screens and widgets:
	- Splash screen
	- Location permission screen
	- Home with location header, service grid, promo banner, announcements, bottom nav
- Added home providers for current location and service list.
- Project passes `flutter analyze` with zero issues.

## Update 2026-04-22 (Phase 2 and 3 Baseline Completed)
- Implemented Installation flow screens:
	- Service type selection (IP/DVR/Wi-Fi)
	- Package selection (4/8/16/32)
	- Customization invoice screen with Product/Price/Quantity/Amount table
- Added live invoice engine:
	- Quantity stepper controls
	- Camera resolution (2MP/5MP) pricing toggle
	- Hard disk size (1TB/2TB/3TB) pricing toggle
	- Auto-sync installation charge quantity with selected camera count
	- Real-time total amount calculation
- Implemented booking continuation flow:
	- Scheduling screen (date + slot)
	- Payment screen with booking amount (Rs 100)
	- Booking confirmation screen and return to home
- All routes are wired and analyzer passes.

## Update 2026-04-22 (CCTV Scope Alignment)
- Removed logistics-oriented home categories and switched to CCTV-only services.
- Added data layer for service catalog (model + mock datasource + repository).
- Home service grid is now repository-driven (async provider), making backend integration ready.
- Updated client SRS home categories and purpose to CCTV-focused scope.

## Update 2026-04-22 (Location and Service Flow Expansion)
- Added real location integration using geolocator + geocoding.
- Implemented centralized location provider and connected:
	- Location permission screen
	- Home location header refresh
	- Invoice screen location header refresh
- Added dedicated route for non-installation CCTV services via placeholder detail screens.
- Installation flow remains full path ready (selection -> package -> invoice -> scheduling -> payment -> confirmation).

## Update 2026-04-23 (Maintenance Module Implemented)
- Added full Maintenance journey:
	- Maintenance type selection
	- Maintenance package selection
	- Maintenance dynamic invoice customization with quantity controls
	- Scheduling -> payment -> confirmation reuse
- Introduced shared active order provider so booking/payment/confirmation work for multiple services (not installation-only).
- Home now routes Maintenance to real flow; other services continue via dedicated placeholders.

## Update 2026-04-23 (AMC Module Activated)
- Added AMC Plans module with Bronze/Silver/Gold plans.
- AMC selection now feeds shared booking stack (scheduling -> payment -> confirmation) using active order summary.
- Home AMC card now routes to AMC plan selection screen.

## Update 2026-04-23 (Mock API Contracts + Dio)
- Implemented structured mock API transport with Dio in data layer.
- Added contract-driven datasources/repositories for:
	- Service catalog
	- Installation pricing
	- Maintenance pricing
- Refactored installation and maintenance providers to load pricing from repository contracts instead of hardcoded tables.
- Added shared data providers module for transport, datasources, and repositories.

## Update 2026-04-23 (Placeholder Replacement Completed)
- Implemented Camera Repair flow as a real module:
	- Issue type selection
	- Dynamic repair estimate invoice with quantity controls
	- Shared scheduling/payment/confirmation integration
- Implemented System Upgrade module using contract-driven upgrade bundles.
- Implemented Accessories module with contract-driven catalog, quantity selection, and checkout handoff.
- Home routing now sends Repair/Upgrade/Accessories to real screens instead of generic placeholders.

## Update 2026-04-23 (Invoice UI Consistency)
- Added reusable shared invoice table widget.
- Refactored Installation, Maintenance, and Repair estimate screens to use the same invoice table component.
- Removed duplicated table header/row implementations from individual screens.

## Update 2026-04-23 (Upgrade and Accessories Estimate Stage Added)
- Added dedicated estimate screen for System Upgrade before scheduling.
- Added dedicated estimate screen for Accessories before scheduling with editable quantities.
- Wired new GoRouter routes with typed extras for both estimate screens.
- Set active order summary from estimate screens so checkout remains service-agnostic and consistent.
- Verified project health with `flutter analyze` (no issues).

## Update 2026-05-04 (Correction Baseline Captured)
- Captured critical bugs and enhancement directives for customer app.
- Marked map flow as top priority due to non-functional location/search/pin-drop behavior.
- Confirmed fallback location requirement: Patna, Bihar.
- Confirmed requirement to remove static offer/announcement display and load dynamic backend content.
- Confirmed global products discovery requirement (search/filter/sort) for all products.
- Confirmed profile redesign requirement for practical customer details and booking history visibility.
- Confirmed full invoice parity requirement with employee and admin surfaces.
- Confirmed responsive layout fixes required for gesture and 3-button navigation modes.
