# Project Plan

This document outlines the development plan and progress for the SafeCom Service Platform.

## Sprints

### Sprint 1: Core UI and Customer App Foundation
- [ ] **Task 1:** Set up Flutter project for the customer app.
- [ ] **Task 2:** Implement the home screen UI.
- [ ] **Task 3:** Create the service selection flow.
- [ ] **Task 4:** Build the dynamic invoice customization screen.
- [ ] **Task 5:** Implement the scheduling screen.

### Sprint 2: Backend and Employee App
- [ ] **Task 1:** Design and implement the backend database schema.
- [ ] **Task 2:** Develop core backend APIs for services and booking.
- [ ] **Task 3:** Set up the Flutter project for the employee app.
- [ ] **Task 4:** Implement job list and details screens in the employee app.

### Sprint 3: Admin Panel and Integration
- [ ] **Task 1:** Set up the project for the admin web app.
- [ ] **Task 2:** Develop the admin dashboard for managing services and bookings.
- [ ] **Task 3:** Integrate the customer and employee apps with the backend.
- [ ] **Task 4:** Implement payment gateway integration.

### Sprint 4: Dynamic Catalog, Pricing, and Invoice Controls
- [ ] **Task 1:** Define Firestore collections for catalog, packages, add-ons, pricing rules, taxes, invoice templates, recommendations, and booking advance.
- [ ] **Task 2:** Build admin screens for product catalog CRUD, package templates, add-ons, price overrides, GST/tax settings, and recommendation sets.
- [ ] **Task 3:** Wire customer app to fetch catalog/pricing and render dynamic invoice and recommendations.
- [ ] **Task 4:** Persist booking drafts and invoices to the database.
- [ ] **Task 5:** Add audit logging for admin changes.

### Sprint 5: Location, Auth Guards, and Payments
- [ ] **Task 1:** Add location picker/search and map pin drop for customer and employee apps.
- [ ] **Task 2:** Fix location change flow and caching.
- [ ] **Task 3:** Add auth guards so booking requires login and sessions persist across launches.
- [ ] **Task 4:** Integrate payment gateway end-to-end (order creation, webhook verification, receipt capture).
- [ ] **Task 5:** Update backend CI/CD with secret management and webhook configs (no secrets in repo).
