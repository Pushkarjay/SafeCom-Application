# SafeCom Technical Documentation Update
## Session: 2026-05-08

---

## 1. Changes Made in Current Session

### 1.1 Database Cleanup
- **Deleted Collections**: `Bookings`, `users`
- **Remaining Collections**: `admins`, `customers`, `employees`, `catalog_product`, `Services`, `sdui_layouts`, `Invoices`
- **Status**: Database now properly mapped to active backend code

### 1.2 Admin Dashboard Updates
- **Sidebar Simplification**: Removed Packages, Add-ons, Taxes, Invoices from CATALOG section
- **Logo Integration**: Added actual SafeCom logo from Firebase Storage to sidebar header
- **CSS Optimization**: Reduced font sizes and spacing for better visibility
- **Route Cleanup**: Removed invalid tab routes

### 1.3 Backend API Enhancements
- **Category-Level Product Operations**:
  - Added `POST /config/:serviceId/category/:categoryKey/product` - Add product directly to category
  - Added `DELETE /config/:serviceId/category/:categoryKey/product/:productKey` - Delete from category
  - Added `POST /config/:serviceId/category/:categoryKey/node` - Add node at category level
  - Added `DELETE /config/:serviceId/category/:categoryKey/node` - Delete node from category
  - Added `PATCH /config/:serviceId/category/:categoryKey/node/quantities` - Update quantities
  - Added `PATCH /config/:serviceId/category/:categoryKey/node/dynamic-field` - Update dynamic fields
- **Fixes**: Resolved double-slash (//) issue when setupKey is empty

### 1.4 Frontend Endpoint Updates
- Updated `serviceAddProduct` - Routes to category endpoint when setupKey is empty
- Updated `serviceDeleteProduct` - Routes to category endpoint when setupKey is empty
- Updated `serviceAddNode`, `serviceDeleteNode`, `serviceUpdateQuantities`, `serviceUpdateDynamicField` - All support category-level operations

### 1.5 Firebase Storage
- Logo uploaded to: `gs://safecom-application-01.firebasestorage.app/logos/safecom_logo_v1_1.jpeg`
- Public URL: `https://firebasestorage.googleapis.com/v0/b/safecom-application-01.appspot.com/o/logos%2Fsafecom_logo_v1_1.jpeg?alt=media`

---

## 2. Architecture Overview

### 2.1 Project Structure
```
SafeCom-Application/
├── mobile_customer/          # Customer Flutter App
├── mobile_employee/          # Employee Flutter App  
├── Admin/
│   ├── web_app/admin-dashboard/  # Admin Web Dashboard
│   └── mobile_app/            # Admin Mobile App
├── backend_server/           # Express.js Backend API
├── docs/                    # SRS Documentation
├── planning_and_progress/   # Project Planning & Tracking
├── database-architecture/   # DB Schema & ERD
└── release-apks/            # Built Mobile APKs
```

### 2.2 Technology Stack
| Component | Technology |
|-----------|------------|
| Frontend (Web) | React 18 + TypeScript + Vite + Zustand |
| Frontend (Mobile) | Flutter + Riverpod + GoRouter |
| Backend | Node.js + Express + TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting + Cloud Run |

### 2.3 Backend Deployment
- **Region**: us-central1
- **Service**: Cloud Run (managed)
- **URL**: `https://safecom-backend-177425757120.us-central1.run.app`
- **Admin Dashboard**: `https://safecom-application-01.web.app`

---

## 3. Nested Approach - Service Builders

### 3.1 Old Approach (Flat Structure)
```
Service (e.g., AMC)
├── Categories
└── Setups (fixed depth)
    └── Products
```

### 3.2 New Approach (Nested Tree Structure)
```
Service (e.g., AMC)
├── Category (e.g., "shakti")
│   ├── Setup (e.g., "4 Camera Setup")
│   │   ├── Product 1 → Option 1
│   │   └── Product 2 → Option 1
│   └── Nested nodes at any depth
├── Category (e.g., "8 Camera Setup")
│   └── Setup
└── Direct Products (no setup required)
```

### 3.3 Key Features
1. **Category-Level Products**: Products can be added directly to category without creating a setup
2. **Infinite Nesting**: Nodes can be nested at any depth within setups
3. **Dynamic Fields**: Support for custom fields per product/option
4. **Quantity Controls**: Default, min, max quantity per option

### 3.4 Supported Services
All service builders use the same nested architecture:
- Installation
- Maintenance
- Camera Repair (Repair)
- AMC Plans
- Accessories
- Upgrade
- Recommendations
- Services (generic)

---

## 4. Comparison: Old vs New Approach

### 4.1 Database Structure

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| Service Config | Flat JSON | Nested tree |
| Product Storage | Direct under service | Categorized with setups |
| Category Creation | Single level | Recursive tree |
| Setup Requirement | Always required | Optional (direct category) |

### 4.2 API Endpoints

| Feature | Old Endpoint | New Endpoint |
|---------|-------------|--------------|
| Add Product | `/setup/:setupKey/product` (required) | `/category/:categoryKey/product` (no setup needed) |
| Delete Product | `/setup/:setupKey/product/:key` | `/category/:categoryKey/product/:key` or setup endpoint |
| Add Node | `/setup/:setupKey/node` | `/category/:categoryKey/node` (no setup needed) |

### 4.3 Frontend UI

| Aspect | Old Behavior | New Behavior |
|--------|-------------|--------------|
| "+ Add Product" at category | Created "General" setup | Adds directly to category |
| Product Placement | Always under a setup | Flexible: category or setup |
| Tree Navigation | Single depth | Infinite nesting |

---

## 5. SDUI (Structured Dynamic User Interface) Approach

### 5.1 What is SDUI?
SDUI is a pattern where UI structure is driven by backend data rather than hardcoded components.

### 5.2 Implementation in SafeCom
- **sdui_layouts collection**: Stores dynamic UI configurations in Firestore
- **Service Tree Builder**: Admin creates service structures dynamically
- **Customer App**: Renders based on service configuration from backend

### 5.3 Benefits
1. **No Code Changes**: Add new services/categories without app updates
2. **Admin Control**: Business users can modify offerings
3. **Flexibility**: Products can be reorganized dynamically

---

## 6. Popup Visibility on Customer App

### 6.1 Current Implementation
- Service selection → Package selection → Products/Options
- Dynamic pricing based on selections
- Scheduling → Payment → Confirmation flow

### 6.2 Pricing Popup Flow
1. **Estimate Screen**: Shows itemized pricing before checkout
2. **Invoice Summary**: Real-time calculation of total
3. **Payment Gateway**: Razorpay integration for payments

### 6.3 Notification Popup
- Push notifications for booking status
- Job assignment notifications for employees
- Payment confirmation notifications

---

## 7. Dual Backend Architecture

### 7.1 Backend 1: us-central1 (Primary)
- **URL**: `https://safecom-backend-177425757120.us-central1.run.app`
- **Purpose**: Main API for all client applications
- **Services**: Auth, Catalog, Pricing, Jobs, Payments

### 7.2 Backend 2: Asia-South1 (Reference)
- **Status**: Not actively deployed
- **Purpose**: Could be used for regional deployments or testing

### 7.3 Traffic Management
- All production traffic routes through us-central1
- Single source of truth for data

---

## 8. Notification System

### 8.1 Current Implementation
- Firebase Cloud Messaging (FCM) for push notifications
- In-app notifications for real-time updates

### 8.2 Notification Types
1. **Booking Notifications**: Status updates (confirmed, completed, cancelled)
2. **Job Assignments**: New job assigned to technician
3. **Payment Notifications**: Payment success/failure
4. **Service Reminders**: Upcoming appointments

### 8.3 Future Enhancements
- Email notifications
- SMS notifications
- Custom notification templates

---

## 9. What's Working

### 9.1 Deployed Services
| Service | Status | URL |
|---------|--------|-----|
| Admin Dashboard | ✅ Active | https://safecom-application-01.web.app |
| Backend API | ✅ Active | https://safecom-backend-177425757120.us-central1.run.app |
| Firebase Auth | ✅ Active | Project: safecom-application-01 |
| Firestore | ✅ Active | Database: safecom-database-nosql |
| Firebase Storage | ✅ Active | logos/safecom_logo_v1_1.jpeg |

### 9.2 API Endpoints Working
- `/api/catalog/products` - Product listing
- `/api/catalog/services` - Service listing
- `/api/catalog/services-admin/*` - Service configuration CRUD
- `/api/bookings` - Booking creation
- `/api/serviceability/check` - Location validation
- `/api/auth/*` - Authentication
- `/api/customers`, `/api/technicians`, `/api/jobs`, `/api/payments` - CRUD operations

### 9.3 Mobile Apps
- Customer App: APK built, needs Play Store upload
- Employee App: APK built, needs Play Store upload

---

## 10. What's Pending / Needs Attention

### 10.1 High Priority
1. **Backend Node Endpoints Deployment** - Category-level node operations need to finish deploying
2. **Play Store Upload** - Customer and Employee APKs need to be uploaded
3. **Notification Integration** - Complete FCM setup for all apps

### 10.2 Medium Priority
1. **Email/SMS Notifications** - Not yet implemented
2. **Real-time Updates** - WebSocket for live job status
3. **Analytics Dashboard** - Revenue and performance metrics

### 10.3 Low Priority
1. **Multi-language Support** - Not in current scope
2. **Dark Mode** - Not implemented
3. **Offline Mode** - Not fully implemented

---

## 11. Checklist for Next Session

- [ ] Complete backend deployment with new node endpoints
- [ ] Test category-level product addition
- [ ] Upload APKs to Play Store
- [ ] Verify notification delivery
- [ ] Test full booking flow end-to-end
- [ ] Review and clean up unused code
- [ ] Commit all changes with proper messages

---

## 12. References

- **SRS Documents**: `docs/SRS_*.md`
- **Database Schema**: `database-architecture/COLLECTIONS.md`
- **Progress Logs**: `planning_and_progress/progress_log.md`
- **Backend Routes**: `backend_server/src/routes/`
- **Frontend Datasources**: `Admin/web_app/admin-dashboard/src/data/datasources/`

---

*Last Updated: 2026-05-08*
*Author: Claude Code Assistant*