# Software Requirements Specification (SRS)
## Project: SafeCom Service Platform (Mobile Employee App)

## 1. Introduction
### 1.1 Purpose
Define functional and non-functional requirements for the employee-facing mobile app used by workers/technicians.

### 1.2 Scope
The app enables assigned workers to receive jobs, update status, track routes, view checklists, capture work proof, and close tasks.

## 2. User Roles
- Technician/Worker
- Team Lead (optional)

## 3. Functional Requirements
### 3.1 Authentication
- OTP login with role-based access.
- Session persistence and secure logout.

### 3.2 Job Assignment
- View today/upcoming jobs.
- Job detail screen with service type, location, customer, and scheduled slot.

### 3.3 Navigation & Check-in
- Open map navigation to customer location.
- Check-in and check-out at service site.

### 3.4 Work Execution
- View required items and installation checklist.
- Mark each checklist item complete.
- Upload photos/videos as proof.

### 3.5 Status Lifecycle
- Accepted -> En Route -> Arrived -> In Progress -> Completed -> Cancelled/Hold.

### 3.6 Issue Reporting
- Raise parts shortage, reschedule, customer not available, technical issue.

### 3.7 Earnings & History
- Daily/weekly summary.
- Completed jobs history with filters.

## 4. Non-Functional Requirements
- Fast load times and offline-tolerant status queue.
- Reliable sync when network returns.
- Secure media upload and API communication over HTTPS.

## 5. Integrations
- Backend APIs for jobs, status, media, and attendance.
- Push notifications for new/updated assignments.

## 6. Addendum: 2026-05-04 Corrections and Sync Requirements

### 6.1 Job Sync Contract
- Customer booking creation must automatically surface as a pending job in employee app.
- Employee app must not depend on hardcoded job lists in production flows.

### 6.2 Notification Requirement
- New booking/job assignment must trigger a push notification for eligible employees.
- Notification payload must include booking ID, service type, location summary, and slot details.

### 6.3 Navigation Requirement
- Job location action must deep-link to Google Maps with destination pin coordinates.
- Employee app should show map-related context before handoff where needed (address + landmark + coordinates).

### 6.4 Invoice Visibility Requirement
- Employee job detail must display full bill context:
	- All booked products
	- Add-ons/accessories
	- Quantities and totals
- Invoice data must be sourced from the same backend invoice payload used by customer/admin.
