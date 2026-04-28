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
