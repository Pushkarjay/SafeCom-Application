# Backend Plan

- Core architecture and API conventions.
- Auth, catalog, pricing, booking modules.
- Payment orchestration and notification events.
- Observability and deployment baseline.

- Serviceability/location APIs (coverage rules, lookup, and validation).
- Booking lifecycle APIs (status updates, issue reporting, offline sync).
- Workforce assignment APIs (auto/manual assignment, reassignment).
- Audit logging for admin actions.
- System status endpoints (health, metrics, readiness).

- Firestore collections for catalog, pricing rules, packages, recommendations, taxes, invoices.
- API endpoints for catalog CRUD, pricing rules, invoice generation, booking drafts.
- Payment order creation and webhook verification endpoints.
- GST/tax breakdown in invoice calculation.
- CI/CD secret management and webhook configuration.
