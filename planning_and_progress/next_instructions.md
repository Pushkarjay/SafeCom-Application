# Next Instructions

## Current Priority
**Map + Data Integrity First** — eliminate hardcoded behavior and establish dynamic, synced flow across customer, employee, admin, and database.

## Immediate Steps
1. Customer app: fix map stack end-to-end.
   - Prompt permission correctly.
   - Use Patna, Bihar as fallback default.
   - Ensure map tiles render in change-location flow.
   - Enable search, geolocation, and pin-drop.
   - Add backend serviceability check and out-of-service UI message.
2. Backend: define canonical booking + invoice contracts.
   - Full line-item invoice payload with product IDs, quantity, unit price, and totals.
   - Booking status lifecycle and assignment-ready events.
3. Employee app: connect job feed to real bookings.
   - Pending/completed lists from backend.
   - Map navigation handoff to Google Maps pin.
   - Full invoice visibility in job details.
4. Admin panel: replace remaining mock cards/metrics/buttons with backend-backed actions.
   - System status checks (server/database/payment gateway).
   - Remove unnecessary add customer flow; keep technician/job operations.
5. Database cleanup and restructuring.
   - Remove duplicate/irrelevant catalog-pricing collections.
   - Introduce master product collection.
   - Convert service structures to mapping/reference model.

## Validation
- No static banner/announcement content unless sourced from backend collection.
- New or updated product in admin is reflected in customer and invoice flows.
- Booking created in customer appears in employee and admin without manual sync.
- Invoice lines match across customer, employee, and admin surfaces.
- No map mock screen remains in customer or employee map interactions.

## Scope Reminder
- CCTV-only service universe remains active.
- Admin panel is the operational control-plane; direct DB edits should not be required for routine changes.
- Seed data is allowed; hardcoded business values in UI are not.
