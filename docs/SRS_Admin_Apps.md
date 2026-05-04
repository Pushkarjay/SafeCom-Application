# Software Requirements Specification (SRS)
## Project: SafeCom Service Platform (Admin Web + Mobile Apps)

## 1. Introduction
### 1.1 Purpose
Define requirements for admin interfaces used to configure services, pricing, teams, bookings, and operations.

### 1.2 Scope
Includes both web-first admin panel and lightweight admin mobile app for on-the-go monitoring.

## 2. Functional Requirements
### 2.1 Authentication & Access Control
- Secure login with role and permission matrix.
- Roles: Super Admin, Operations Manager, Finance, Support.

### 2.2 Service Catalog Management
- Create/update service categories, sub-services, and packages.
- Manage default package options (4/8/16/32 camera etc.).

### 2.3 Pricing Engine Configuration
- Configure products, unit rates, quantity defaults, and add-ons.
- Configure mandatory vs optional items.
- Configure booking advance amount and taxes.

### 2.4 Booking Operations
- View all bookings with filters and search.
- Assign/reassign employees.
- Reschedule, cancel, refund control.

### 2.5 Workforce Management
- Employee onboarding and verification.
- Availability windows and area mapping.

### 2.6 Payments & Finance
- View payment status, reconciliation, and booking advances.
- Export invoices/reports.

### 2.7 Notifications & Content
- Manage banners, announcements, and serviceability text.

## 3. Non-Functional Requirements
- Audit logs for all critical actions.
- High availability and secure access.
- Responsive web UI and compact mobile admin dashboard.

## 4. Integrations
- Backend APIs for catalog, pricing, booking, users, and reports.
- SMS/push/payment providers.

## 5. Addendum: 2026-05-04 Admin Control-Plane Redesign

### 5.1 Core Rule
- Admin panel is the primary control-plane; operational updates should be manageable from admin UI without direct database edits.

### 5.2 Accessories and Catalog Final Navigation
- Products (Master Product collection)
- Installation
- Accessories
- Maintenance
- Camera Repair
- AMC Plans
- Upgrade
- Recommendations
- Services (dynamic service definition)

### 5.3 Deprioritized/Removed Items (Current Scope)
- Taxes (deferred)
- Static invoice template editor in catalog area (moved to centralized invoice generator module)
- Redundant static package/add-on/texture style sections not tied to dynamic backend model

### 5.4 Product Master Principle
- All products are stored in one master product collection.
- Service modules do not duplicate products; they reference product IDs via mappings.

### 5.5 Installation Builder Requirements
- Admin can create/edit/delete categories and groups (e.g., IP camera -> 4/8/16/32 setup).
- Group/base price must be computed from mapped product lines, not manually typed fixed values.
- Admin can configure min/max quantity constraints per line item.
- Rule-based transitions are supported (example: quantity overflow from 4-camera setup can trigger shift to 8-camera setup).
- Admin view includes live breakdown table and invoice preview.

### 5.6 Recommendations and Priority Ordering
- Recommendation items are selected from master products.
- Admin controls ordering/priority for customer checkout recommendation display.
- Recommendations support placement targeting (checkout/cart/service/general) and optional service-type filters.

### 5.7 Dashboard and Operations Data
- Dashboard must reflect real backend state (service health, database connectivity, payment gateway status).
- KPI cards (revenue, completion, etc.) must be backend-backed and not hardcoded.
- Customer creation from admin is non-primary because customer accounts are app-originated.

### 5.8 Invoice Generator Module
- Provide centralized invoice generation/view in top-level admin operations.
- Invoice variants can include installation/service/delivery forms as needed.
- All invoices must align with canonical booking invoice payload.
