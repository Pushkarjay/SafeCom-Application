# Software Requirements Specification (SRS)
## Project: SafeCom Service Platform (Backend Server)

## 1. Introduction
### 1.1 Purpose
Define backend capabilities supporting customer, employee, and admin applications.

### 1.2 Scope
API gateway, auth, catalog, pricing, booking lifecycle, scheduling, notifications, payment orchestration, serviceability/location, audit logging, and observability.

## 2. Core Services
- Identity and access management
- Service catalog management
- Dynamic pricing and invoice computation
- Booking and scheduling engine
- Workforce assignment engine
- Payment and transaction service
- Notification service
- Reporting and analytics
- Serviceability and location validation
- Audit logging and compliance
- System health and metrics

## 3. Functional Requirements
### 3.1 API
- REST APIs with versioning and consistent error formats.
- Token-based authentication and role checks.
- Idempotent booking/payment endpoints and reconciliation-safe webhooks.

### 3.2 Pricing/Invoice Engine
- Compute itemized invoice based on selected package and modifiers.
- Support configurable rules from admin panel.

### 3.3 Booking Workflow
- Create draft booking.
- Reserve slot.
- Collect advance payment.
- Confirm booking and emit events.
- Status lifecycle updates with offline sync support.
- Issue reporting (parts shortage, reschedule, customer not available, technical issue).

### 3.4 Assignment
- Auto/manual assignment based on area, skill, and availability.
- Reassignment and escalation flows.

### 3.5 Observability
- Structured logs, traces, health endpoints, and metrics.

### 3.6 Serviceability & Location
- Coverage rules and serviceability checks for customer locations.
- Area mapping for workforce assignment.

### 3.7 Audit Logging
- Audit log entries for admin actions affecting catalog, pricing, bookings, refunds, and assignments.

## 4. Non-Functional Requirements
- Horizontal scalability.
- Fault tolerance and idempotent booking/payment APIs.
- Encryption in transit and at rest.

## 5. Suggested Stack (TBD)
- Node.js/NestJS or Django/FastAPI
- PostgreSQL + Redis (or Firestore if using a document-first model; finalize one source of truth)
- Queue/Event bus for async workflows

## 6. Addendum: 2026-05-04 Data Integrity and Sync Requirements

### 6.1 Data Source Rule
- UI-facing hardcoded business data must be removed in favor of backend-seeded or admin-managed datasets.

### 6.2 Database Restructure Direction
- Keep identity-centric collections/entities (customers, employees, admins, users).
- Remove duplicate/legacy pricing-catalog collections that conflict with target model.
- Introduce/maintain a master product model containing all sellable products.
- Service structures (installation/accessories/maintenance/repair/amc/upgrade/recommendations) should use mapping/reference entities that point to master products.

### 6.3 Booking to Job Sync
- Booking creation must publish assignment-ready payloads.
- Employee and admin job boards consume canonical backend job/booking representations.

### 6.4 Canonical Invoice Contract
- Invoice payload must include:
	- Booking reference
	- Service/module reference
	- Itemized product lines
	- Quantity and pricing breakdown
	- Totals and payment status fields
- Same contract must be reused by customer, employee, and admin clients.

### 6.5 Location and Serviceability
- Coverage/serviceability checks must be API-driven for selected coordinates.
- Support explicit out-of-service responses for customer map/location flow.

### 6.6 Admin-Driven Configuration
- Admin CRUD should update mappings, constraints, recommendation ordering, and service module structures.
- System should avoid schema sprawl from uncontrolled collection creation where possible; prefer controlled service configuration entities.

### 6.7 Phase 3g Data Cleanup (2026-05-04)
- Remove legacy catalog endpoints and mock-data fallbacks from production routes.
- Normalize recommendation records to canonical placement + service targeting fields.
- Enforce Firestore-only reads/writes for jobs, payments, customers, technicians, and catalog entities.
