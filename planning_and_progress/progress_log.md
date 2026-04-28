# Progress Log

## 2026-04-22
- Normalized repository structure to active snake_case component folders.
- Set up customer Flutter app in mobile_customer.
- Added SRS files for customer, employee, admin apps, and backend.
- Created planning_and_progress directories across components.
- Implemented customer app Phase 1 foundation (routing, splash, permission, home UI widgets).
- Added Riverpod and GoRouter dependencies.
- Verified code quality with `flutter analyze` (no issues).
- Implemented customer app Phase 2/3 journey for Installation:
	- Service type -> package -> dynamic invoice customization
	- Scheduling -> payment -> booking confirmation
- Added reusable quantity stepper and invoice state logic via Riverpod.
- Pivoted customer scope to CCTV-only categories and removed logistics categories from app surface.
- Added mock repository-backed service catalog for dynamic service configuration.
- Added real location permission/fetch plumbing with geolocator + geocoding.
- Added routed placeholder modules for Maintenance/AMC/Repair/Upgrade/Accessories to extend beyond installation journey.
- Implemented complete Maintenance flow and connected it to shared scheduling/payment/confirmation stack.
- Added active order summary provider to support multi-service checkout context.
- Implemented AMC plan selection module and connected it to shared booking checkout flow.
- Completed structured mock API contract layer using Dio transport.
- Switched service catalog and pricing flows to repository-driven contracts.
- Replaced placeholder modules with real flows for Camera Repair, System Upgrade, and Accessories.
- Added new mock contract endpoints and repository methods for repair/upgrade/accessories.
- Unified invoice UI across Installation, Maintenance, and Repair via shared invoice table component.
- Added estimate-stage parity for Upgrade and Accessories with new routed estimate screens before scheduling.
- Connected route extras and checkout summary handoff from estimate screens.
- Revalidated with `flutter analyze` (no issues).
- Set up Git workflow: committed SRS + project planning, then committed customer app implementation.

## 2026-04-28 (Employee App Implementation)
- Created mobile_employee Flutter project with same tech stack as customer app.
- Built authentication flow: splash (2s delay) -> login (phone + password) -> jobs home.
- Implemented complete jobs management system with mock API providing 4 sample technician assignments.
- Created tabbed jobs interface (Pending/Completed) with rich job cards showing all relevant info.
- Built job detail screen with comprehensive information and work completion workflow.
- Implemented work completion screen with submission confirmation and payment tracking.
- Added technician profile screen with performance statistics.
- Created reusable data layer: models, datasources, repositories, and Riverpod providers.
- Verified with `flutter analyze` (no issues) and tested on Chrome browser.
- Committed employee app to GitHub.
- Established consistent Git workflow with meaningful commit messages.

## Next Milestones
- Build Admin dashboard (web and mobile).
- Create Backend API server (Node.js/Express or similar).
- Integrate real authentication (Firebase or custom backend).
- Add location-based job assignment logic.
- Implement push notifications for job updates.
