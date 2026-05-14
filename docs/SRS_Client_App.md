# Software Requirements Specification (SRS)
## Project: SafeCom Service Platform (Client-Facing Mobile App)

### 1. Introduction

#### 1.1 Purpose
This document defines the requirements for the client-facing mobile application of the SafeCom Service Platform. The app enables users to book CCTV and surveillance-related services (e.g., IP camera installation, maintenance, AMC) with real-time pricing, customization, and scheduling.

#### 1.2 Scope
The client app will:
- Allow users to discover and book services.
- Provide dynamic pricing and customization.
- Enable scheduling and payments.
- Offer a seamless, Porter-like user experience.

Future components (employee app, admin panel, backend) are out of scope for this document but will integrate with this system.

#### 1.3 Definitions
- **NVR:** Network Video Recorder
- **AMC:** Annual Maintenance Contract
- **Dynamic Invoice:** Real-time price calculation based on user selections.

### 2. Overall Description

#### 2.1 Product Perspective
This application is the client-facing component of a larger service ecosystem, which includes:
- **Client Mobile App (Flutter)**: The current scope.
- **Worker/Employee App**: For service personnel.
- **Admin Panel (Web + Mobile)**: For platform management.
- **Backend System**: The central server handling logic and data.

#### 2.2 Product Functions
- Location-based service discovery.
- Browsing through service categories.
- Custom configuration of services (e.g., camera setup).
- Real-time price calculation and invoice generation.
- Service booking and scheduling.
- Integration with a payment gateway for advance and final payments.
- Order tracking and history (future phase).

#### 2.3 User Classes
- **End Users (Customers)**: Non-technical users who want a fast and transparent way to book services.

#### 2.4 Assumptions
- Users have a stable internet connection and GPS enabled on their devices.
- All pricing, service categories, and business logic are controlled and served by the backend/admin panel.
- A third-party payment gateway will be integrated for transactions.

### 3. Functional Requirements

#### 3.1 Authentication (Optional Initially)
- Users can browse services and customize options without creating an account.
- Account creation/login (e.g., via OTP-based mobile authentication) will be required to confirm a booking.

#### 3.2 Location Handling
- The app must request location permission upon first launch (“Allow while using the app” is sufficient).
- The user's current location will be displayed prominently on the home screen.
- An option to manually change the location must be available.

#### 3.3 Home Screen
- **UI Components:**
    - **Top Bar:** Displays the current location with an option to edit.
    - **Service Grid:** A grid of available service categories. Initially:
        - Installation
        - Maintenance
        - AMC Plans
        - Camera Repair
        - System Upgrade
        - Accessories
    - **Promotional Banners:** For offers and announcements.
- **Logic:** Service categories must be dynamically configurable from the backend.

#### 3.4 Service Flow (Installation Example)

##### Step 1: Service Selection
- User selects a primary category (e.g., `Installation`).
- The app displays sub-categories (e.g., `IP Camera`, `DVR Camera`, `Wi-Fi Camera`).

##### Step 2: Package Selection
- After selecting a sub-category, the user is presented with default packages:
    - 4 Cameras
    - 8 Cameras
    - 16 Cameras
    - 32 Cameras
- Each package will display a base price to give the user an initial estimate.

#### 3.5 Customization Screen (Core Feature)
This screen allows the user to build their order dynamically.
- **Layout:**
    - **Top:** The selected location is displayed.
    - **Tabs:** Tabs corresponding to the selected package (e.g., 4, 8, 16, 32 Cameras).
    - **Dynamic Invoice Table:** A table with columns: `Product`, `Price`, `Quantity`, `Amount`.
- **Invoice Items:**
    - NVR Setup Box (quantity auto-selected based on camera channels).
    - IP Cameras (with options for 2MP / 5MP).
    - IP Cable.
    - Hard Disk (with options for 1TB / 2TB / 3TB).
    - Connectors.
    - Wiring.
    - Installation Charges (auto-calculated based on the number of cameras).
- **Features:**
    - `+ / -` buttons to adjust the quantity of each item.
    - The price for each item and the total amount update in real-time as selections change.

#### 3.6 Business Logic
- The quantity for `Installation Charges` is automatically tied to the number of cameras selected.
- Default item selections (e.g., 1TB hard drive for an 8-camera setup) are controlled by the admin panel.
- The system will be flexible, allowing users to override default quantities without strict validation initially.

#### 3.7 Recommendations / Add-ons
- The app will suggest optional or mandatory add-on items, such as:
    - Junction Box
    - Power Supply
- These recommendations will be configured from the backend.

#### 3.8 Price Breakdown Screen
- After customization, a final screen will display:
    - A detailed, itemized invoice.
    - The total calculated cost.
    - A "Proceed" or "Schedule" button.

#### 3.9 Scheduling
- The user will select a preferred date and time slot for the service.

#### 3.10 Booking & Payment
- To confirm the booking, the user must make an advance payment (e.g., ₹100).
- The app will integrate with a payment gateway to handle this transaction.
- Upon successful payment, a booking confirmation screen is displayed.

### 4. Non-Functional Requirements

#### 4.1 Performance
- The app should load in under 3 seconds.
- Real-time price calculations must be instantaneous with no noticeable lag.

#### 4.2 Scalability
- The architecture must support the addition of new service types and complex pricing rules without major rework.
- It should be designed to handle a growing user base.

#### 4.3 Usability
- The user interface should be clean, modern, and intuitive, inspired by the Porter app.
- The booking process should require minimal steps.
- Pricing must be transparent at all stages.

#### 4.4 Security
- All communication with the backend API must be over HTTPS.
- Sensitive payment information must be handled exclusively by the integrated payment gateway.

#### 4.5 Reliability
- The app should handle network interruptions gracefully, with clear feedback to the user.
- Implement retry mechanisms for failed API calls where appropriate.

### 5. System Architecture (High-Level)
- **Frontend:** Flutter
- **State Management:** Riverpod (or Provider)
- **Navigation:** GoRouter
- **Backend:** To be decided (e.g., Node.js, Django)
- **Database:** To be decided (e.g., PostgreSQL, MongoDB)
- **APIs:** RESTful APIs

### 6. GitHub Reference
- Existing work can be reviewed for context but is not a strict guideline for the new implementation:
[https://github.com/Pushkarjay/SafeCom-App](https://github.com/Pushkarjay/SafeCom-App)

### 7. Addendum: 2026-05-04 Corrections and Enhancements

#### 7.1 UI Responsiveness and Navigation Modes
- All key screens must render correctly in both gesture mode and 3-button navigation mode.
- Overlaps and clipped controls are not acceptable in booking, map, profile, and invoice-related screens.
- Layouts must avoid fixed-height assumptions and respect safe areas.

#### 7.2 Location and Map Reliability (Top Priority)
- Remove any static/mock location behavior from customer flows.
- Request runtime location permission before map-dependent actions.
- Fallback default location must be Patna, Bihar when location is unavailable.
- Change-location flow must support:
    - Visible and interactive map
    - Search suggestions/results
    - Current location action
    - Pin drop and confirmation
- Out-of-service-area message must be shown when selected location is outside backend-defined coverage.

#### 7.3 Home Content Control
- Static promotional banner and announcements must be replaced with backend-driven configuration.
- Replace fixed first-offer banner with dynamic content block that can expose a "View All Products" discovery route.

#### 7.4 Product Discovery and Dynamic Catalog
- "View All Products" must aggregate all sellable items from backend and support search/filter/sort.
- Product attributes (resolution, storage, etc.) must not be hardcoded in UI.
- Product availability and pricing must come from backend data model.

#### 7.5 Booking and Invoice
- Booking must be linked to authenticated user profile and persisted in backend.
- Invoice must include complete line items, add-ons, quantities, and totals.
- Same invoice dataset must be consumable by employee and admin surfaces.

#### 7.6 Profile Experience
- Profile screen must prioritize operational user data:
    - Name
    - Phone number
    - Photo
    - Saved addresses
- Non-critical fields should not dominate primary profile layout.

#### 7.7 Nested Service Architecture (2026-05-09)
- **Clubbed Product Selection:** When configuring an installation, certain products (like cameras) may contain deeply nested "clubbed options". The customer app must preserve this hierarchical structure instead of flattening it.
- **Recursive Drill-down:** Customers must be presented with a recursive drill-down selection popup (`ClubbedProductSelector`) that allows them to navigate through sub-categories (branches) to select specific variant combinations (leaf nodes).
- **Interactive Invoices:** The dynamic invoice table must support interactive elements, rendering a "Change" button next to clubbed products to trigger the nested selection flow.
- **Dependency Engine (2026-05-14):** Products can be configured with `dependsOn` relationships, where one product's quantity is auto-mapped from another product's quantity. The customer app must:
  - Disable manual editing for dependent products (set `canEditQuantity = false`)
  - Auto-calculate and update dependent quantities when the source product's quantity changes
  - Support recursive dependency resolution (changes cascade to all dependents)
- **Admin-Controlled Dependencies:** The admin dashboard's Installation Builder provides a "🔗 Depends On" button on leaf products, allowing admins to link any product's quantity to another product in the same scope (setup/option group). The relationship is stored as an additive `dependsOn` field in Firestore without changing the existing schema.
