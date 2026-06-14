# EMPLOYEE APP — COMPLETE FUNCTION AUDIT

**Date:** 2026-06-14
**Scope:** Every screen, provider, service, model, API call, and data flow in the mobile employee/technician application

---

## TABLE OF CONTENTS

1. [Authentication](#1-authentication)
2. [Job Management](#2-job-management)
3. [Job Detail & Workflow](#3-job-detail--workflow)
4. [Photo Capture & Gallery](#4-photo-capture--gallery)
5. [Map & Navigation](#5-map--navigation)
6. [Earnings Dashboard](#6-earnings-dashboard)
7. [Employee Profile](#7-employee-profile)
8. [Push Notifications (FCM)](#8-push-notifications-fcm)
9. [Data Layer](#9-data-layer)
10. [Firestore Data Model Reference](#10-firestore-data-model-reference)
11. [Block Diagrams](#11-block-diagrams)
12. [Multi-Case Behavior Analysis](#12-multi-case-behavior-analysis)
13. [Known Issues & Fixes Required](#13-known-issues--fixes-required)

---

## 1. AUTHENTICATION

### Login Screen (`login_screen.dart`)
- **Fields:** Email (text), Password (password with show/hide toggle)
- **Country Code:** Phone input with country code selector
- **Button:** "Sign In" (disabled while loading)
- **Behavior:**
  1. Calls `signInWithEmailAndPassword` (Firebase Auth SDK)
  2. On success → calls `linkUserToBackend()` with FCM device token
  3. Fetches employee profile via `GET /api/employees/:uid`
  4. Stores auth state in local provider
  5. Navigates to job home screen
- **Error Handling:** Firebase auth error codes mapped to user-friendly messages

### Splash Screen (`splash_screen.dart`)
- **Purpose:** Auth state check on app launch
- **Behavior:**
  1. Animated logo display (fade + scale)
  2. Checks Firebase Auth currentUser
  3. If authenticated → navigates to job home
  4. If not → navigates to login screen

### Auth Service (`services/auth_service.dart`)
- `signInWithEmail(email, password)` → Firebase Auth SDK
- `signUpWithEmail(email, password)` → Firebase Auth SDK (admin-only registration)
- `signOut()` → Firebase sign-out + clear local state
- `linkUserToBackend(firebaseUid, data)` → `POST /api/users/link` + `POST /api/employees/device-token`

### Firestore Storage
- `users` collection: `{ firebaseUid, email, name, role: "employee", ... }`
- `employees` collection: `{ uid, name, phone, email, role, department, status, deviceTokens[] }`

### Admin Reflection
- Employee accounts created/managed via admin `/technicians` screen
- Employee status (active/inactive) controlled by admin
- Employee device tokens stored for push notifications

---

## 2. JOB MANAGEMENT

### Jobs Home Screen (`jobs_home_screen.dart`)
- **Tabs:** 3-tab layout (Assigned / Unassigned / Inbox)
- **Pull-to-refresh:** Refreshes all job lists
- **Job Cards:** Each card shows:
  - Service type (icon + label)
  - Status badge (color-coded)
  - Amount
  - Customer location (address preview)
  - Scheduled date/time
  - Header icons: map toggle, earnings shortcut, profile, dark mode toggle

### Assigned Tab
- **Source:** `GET /api/jobs?employeeId=:id`
- **Filters:** Jobs assigned to current employee
- **Empty State:** "No assigned jobs" with illustration

### Unassigned Tab
- **Source:** `GET /api/jobs?unassigned=true`
- **Filters:** Jobs available for pickup
- **Actions:** Tap → view detail → "Accept Job" button
- **Empty State:** "No available jobs in your area"

### Inbox Tab
- **Source:** Server-sent notifications / job updates
- **Content:** Job assignment notifications, status updates, admin messages

### Key Models
- `AssignedJob { id, customerId, technicianId, serviceType, status, amount, scheduledDate, location, items[] }`
- `CanonicalInvoice { id, items[], subtotal, gst, total }`
- `InvoiceLineItem { productId, name, quantity, unitPrice, total }`

### Firestore Storage
- `jobs` collection: job/work order records indexed by employeeId and status

### Admin Reflection
- Jobs visible in admin `/jobs` screen with status filters
- Admin can assign jobs to technicians
- Job lifecycle tracked through status transitions

---

## 3. JOB DETAIL & WORKFLOW

### Job Detail Screen (`job_detail_screen.dart`)
- **Sections:**
  - **Service Info:** Service type, package, items breakdown
  - **Customer Info:** Name, phone (with call button), address
  - **Location:** Map preview with "Open in Maps" button
  - **Invoice Breakdown:** Itemized list with quantities and amounts
  - **Notes:** Admin notes / customer instructions
  - **Status Actions:** Dynamic action buttons based on current status

### Status Flow & Actions
| Current Status | Available Actions | Next Status |
|---------------|-------------------|-------------|
| `unassigned` | "Accept Job" | `assigned` |
| `assigned` | "Start Job" | `in_progress` |
| `in_progress` | "Complete Job" | `completed` |
| `completed` | (none — view only) | — |

### Accept Job
- **Endpoint:** `POST /api/jobs/:id/pickup`
- **Behavior:** Sets `technicianId` to current employee, updates status to `assigned`
- **Validation:** Checks job isn't already assigned

### Start Job
- **Endpoint:** `PATCH /api/jobs/:id`
- **Payload:** `{ status: "in_progress", startedAt: Timestamp }`
- **Behavior:** Records start time, updates status

### Complete Job
- **Endpoint:** `POST /api/jobs/:id/complete`
- **Payload:** `{ status: "completed", completedAt: Timestamp, photos[], notes, paymentCollected }`
- **Behavior:**
  1. Triggers `WorkCompletionScreen`
  2. Captures before/after photos
  3. Records payment collection (if customer pays on-site)
  4. Finalizes job, updates earnings

### Work Completion Screen (`work_completion_screen.dart`)
- **Purpose:** Post-completion confirmation
- **Content:** Job summary, completion time, earnings for this job
- **Actions:** "Back to Jobs" → returns to job home

### Job Data Sources
- `GET /api/jobs?employeeId=:id` — assigned jobs
- `GET /api/jobs?unassigned=true` — available jobs
- `GET /api/jobs/:id` — single job detail
- `POST /api/jobs/:id/pickup` — accept job
- `PATCH /api/jobs/:id` — update job status
- `POST /api/jobs/:id/complete` — complete with photos/notes

### Admin Reflection
- Job status transitions visible in real-time on admin dashboard
- Admin can reassign jobs if needed
- Completion notes and photos accessible from admin

---

## 4. PHOTO CAPTURE & GALLERY

### Photo Capture Screen (`photo_capture_screen.dart`)
- **Integration:** `image_picker` package
- **Features:**
  - Camera launch (front/back toggle)
  - Capture button
  - Preview + retake option
  - Label assignment ("Before" / "After")
- **Upload:** Automatic upload to backend after capture
- **Storage:** Firebase Storage or backend server

### Photo Gallery Screen (`photo_gallery_screen.dart`)
- **Tabs:** Before / After (tabbed view)
- **Grid:** Thumbnail grid of captured photos
- **Actions:**
  - Tap → full-screen preview
  - Camera button → capture new photo
  - Delete (if before finalizing)

### Photo Model
- `JobPhoto { id, jobId, type: "before"|"after", url, capturedAt }`

### Firestore Storage
- Photos stored in Firebase Storage: `jobs/:jobId/photos/:photoId`
- Metadata in `jobs/:jobId/photos` subcollection or `photos` collection

### Admin Reflection
- Before/after photos viewable in admin job detail
- Photo evidence for quality assurance
- Customer can see photos in their booking detail (future)

---

## 5. MAP & NAVIGATION

### Map Screen (`map_screen.dart`)
- **Integration:** Google Maps Flutter widget
- **Features:**
  - Shows all assigned jobs as markers on map
  - Single job detail view with location pin
  - Real-time location tracking (blue dot)
  - "Directions" button → opens Google Maps / URL launcher with route to customer
- **Map Types:** Normal / Satellite toggle

### Location Picker Screen (`location_picker_screen.dart`)
- **Purpose:** Manual location correction
- **Features:** Draggable pin, search, reverse geocode
- **Output:** Updated lat/lng for job location

### Employee Location Provider (`providers/employee_location_provider.dart`)
- **State:** Live GPS coordinates stream
- **Updates:** Position updates every 10 seconds while app is in foreground
- **Endpoint:** `POST /api/employees/location` (push to backend)
- **Persistence:** Only during active session

### Location Service (`core/services/location_service.dart`)
- `getCurrentPosition()` — GPS coordinates
- `startTracking()` — Background location updates
- `stopTracking()` — End location tracking
- `getAddressFromLatLng(lat, lng)` — Reverse geocode

### Admin Reflection
- Admin can see technician locations in real-time on dashboard map
- Estimated arrival time calculated from location data
- Job dispatch optimized based on technician proximity

---

## 6. EARNINGS DASHBOARD

### Earnings Screen (`earnings_screen.dart`)
- **Period Filter:** This Week / This Month / All Time
- **Stats Cards:**
  - Total Earnings (all completed jobs)
  - Paid Amount (already disbursed)
  - Pending Amount (awaiting disbursement)
- **Earnings List:** Chronological list with:
  - Customer name
  - Job amount
  - Date completed
  - Payment status (paid/pending)

### Earnings Data Source (`data/datasources/earnings_datasource.dart`)
- `GET /api/employees/:id/earnings?period=week|month|all`

### Key Models
- `EarningEntry { id, jobId, customerName, amount, status, date }`

### Firestore Storage
- `earnings` collection or `employees/:id/earnings` subcollection
- Aggregated in `employees/:id/stats` for quick display

### Admin Reflection
- Earnings data available in admin technician detail
- Admin can mark earnings as "paid" after disbursement
- Earnings reports exportable from admin dashboard

---

## 7. EMPLOYEE PROFILE

### Employee Profile Screen (`employee_profile_screen.dart`)
- **Sections:**
  - Avatar + Name + Role
  - Contact Info: Email, Phone (editable)
  - Location: Current city/area
  - Skills: List of service categories (e.g., Installation, Maintenance)
  - Rating: Star rating from completed jobs
  - Job Stats: Total jobs, completion rate
  - Join Date
- **Actions:** Edit profile, change password, logout

### Employee Profile Data Source (`data/datasources/employee_datasource.dart`)
- `GET /api/employees/:id` — full profile
- `PATCH /api/employees/:id` — update profile

### Key Models
- `EmployeeProfile { id, name, email, phone, photo, skills[], location, rating, totalJobs, completionRate, joinDate }`

### Firestore Storage
- `employees` collection: full employee record
- `employees/:id/stats` subcollection: aggregated stats

### Admin Reflection
- Employee profile viewable and editable from admin `/technicians` screen
- Admin can update skills, location, status
- Performance metrics visible (rating, completion rate)

---

## 8. PUSH NOTIFICATIONS (FCM)

### Notification Service (`core/services/notification_service.dart`)
- **Integration:** Firebase Cloud Messaging
- **Initialization:**
  1. Request notification permission
  2. Get FCM device token
  3. Register token: `POST /api/employees/device-token`
- **Handlers:**
  - `onMessage` — foreground notification display
  - `onMessageOpenedApp` — notification tap → navigate to relevant screen
  - `onTokenRefresh` — update token on backend

### Notification Types
| Type | Trigger | Action |
|------|---------|--------|
| New Job | Admin creates job | Navigate to job detail |
| Job Assigned | Admin assigns | Navigate to job detail |
| Schedule Changed | Admin reschedules | Navigate to job detail |
| Payment Received | Customer pays | Navigate to earnings |

### Admin Reflection
- Admin can send push notifications from dashboard
- Notifications sent when jobs are assigned or updated
- FCM tokens stored in `employees/:id/deviceTokens`

---

## 9. DATA LAYER

### API Service (`data/datasources/api_service.dart`)
- **HTTP Client:** Dio-based with Firebase auth interceptor
- **Base URL:** From `ApiConfig`
- **Interceptors:** Auth token injection, logging, error transformation

### Jobs Data Source (`data/datasources/jobs_datasource.dart`)
- `getAssignedJobs(employeeId)` → `GET /api/jobs?employeeId=`
- `getAvailableJobs()` → `GET /api/jobs?unassigned=true`
- `getJobDetail(jobId)` → `GET /api/jobs/:id`
- `pickupJob(jobId)` → `POST /api/jobs/:id/pickup`
- `startJob(jobId)` → `PATCH /api/jobs/:id`
- `completeJob(jobId, data)` → `POST /api/jobs/:id/complete`

### Employee Data Source (`data/datasources/employee_datasource.dart`)
- `getEmployeeProfile(employeeId)` → `GET /api/employees/:id`
- `updateEmployeeProfile(employeeId, data)` → `PATCH /api/employees/:id`

### Earnings Data Source (`data/datasources/earnings_datasource.dart`)
- `getEarnings(employeeId, period)` → `GET /api/employees/:id/earnings`

### Repositories
- `jobs_repository.dart` — Business logic for job operations
- `employee_repository.dart` — Profile management logic

### Providers (Riverpod)
- `assignedJobsProvider` — AsyncNotifier for assigned jobs list
- `availableJobsProvider` — AsyncNotifier for unassigned jobs
- `activeEmployeeIdProvider` — Current employee ID from auth
- `employeeProfileProvider` — Profile data
- `employeeEarningsProvider` — Earnings data with period filter
- `themeProvider` — Dark/Light theme toggle

### Config (`core/config/api_config.dart`)
- Backend URL
- API version
- Timeout settings

### Constants (`core/constants/app_routes.dart`)
- 14 route constants
- Route guards for auth

---

## 10. FIRESTORE DATA MODEL REFERENCE

### Collections Accessed by Employee App

| Collection | Read | Write | Purpose |
|-----------|------|-------|---------|
| `users` | Firebase UID | — | User registry |
| `employees` | Employee ID | Profile updates | Employee profile |
| `jobs` | Employee ID | Status updates | Job management |
| `photos` | Job ID | Create | Job photos |
| `earnings` | Employee ID | — | Earnings records |

### Key Document Structures

**`employees` document:**
```
{
  uid: string (Firebase),
  name: string,
  phone: string,
  email: string,
  photo: string (URL),
  role: "technician",
  department: string,
  skills: string[],
  location: GeoPoint,
  rating: number,
  totalJobs: number,
  completionRate: number,
  status: "active" | "inactive",
  deviceTokens: string[],
  createdAt: Timestamp
}
```

**`jobs` document:**
```
{
  jobId: string,
  customerId: string,
  technicianId: string,
  serviceType: string,
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "cancelled",
  items: array<{ productId, name, quantity, unitPrice, total }>,
  total: number,
  paidAmount: number,
  scheduledDate: Timestamp,
  timeSlot: string,
  address: GeoPoint,
  notes: string,
  startedAt: Timestamp,
  completedAt: Timestamp,
  photos: string[] (URLs),
  createdAt: Timestamp
}
```

---

## 11. BLOCK DIAGRAMS

### Job Lifecycle
```
Admin Creates Job (unassigned)
        │
        ▼
Available in Employee App
        │
  ┌─────┴─────┐
  │           │
Accept      Ignore
  │           │
  ▼           ▼
Assigned    Remains Unassigned
  │
  ▼
Start Job
  │
  ▼
In Progress ─── Capture Photos
  │
  ▼
Complete Job ─── Collect Payment
  │
  ▼
Completed ─── Earnings Updated
```

### Authentication Flow
```
Employee Login Screen
        │
        ▼
Firebase Auth (email + password)
        │
        ▼
Link User to Backend ─── POST /api/users/link
        │
        ▼
Register FCM Token ─── POST /api/employees/device-token
        │
        ▼
Fetch Profile ─── GET /api/employees/:id
        │
        ▼
Navigate to Jobs Home
```

### Payment Collection Flow
```
Job Detail → "Complete Job"
        │
        ▼
Work Completion Screen
        │
        ├── Collect Payment (cash/UPI)
        │         │
        │         ▼
        │   Record Amount
        │
        └── Capture Before/After Photos
              │
              ▼
        Submit Completion ─── POST /api/jobs/:id/complete
              │
              ▼
        Earnings Updated
```

---

## 12. MULTI-CASE BEHAVIOR ANALYSIS

### Case 1: Job Already Taken
1. Employee sees unassigned job, taps "Accept"
2. `POST /api/jobs/:id/pickup` returns 409 Conflict
3. Job was taken by another technician milliseconds before
4. Employee sees toast: "Job was just assigned to another technician"
5. Job removed from available list (refresh triggered)

### Case 2: No Internet During Job Completion
1. Employee completes job, captures photos offline
2. `POST /api/jobs/:id/complete` fails → queued locally
3. When internet restores → retry queue processes
4. Photos uploaded sequentially
5. Status updated on backend

### Case 3: Employee Location Tracking
1. Employee opens app → GPS tracking starts
2. Every 10 seconds: `POST /api/employees/location`
3. If employee closes app: tracking stops (no background service)
4. Admin dashboard shows last known location

### Case 4: Multiple Jobs at Same Time Slot
1. Employee has overlapping job schedules
2. Job cards show time conflict warning (red indicator)
3. Employee must complete first job before starting second
4. Admin notified of scheduling conflict

### Case 5: Payment on Delivery
1. Customer pays cash/UPI at site
2. Employee enters amount collected in completion screen
3. Backend records payment: `paidAmount += collected`
4. If partial: remaining amount tracked
5. Invoice updated with payment status

---

## 13. KNOWN ISSUES & FIXES REQUIRED

### Issue 1: No Offline Job Cache
- **Problem:** Job list requires network; no offline cache
- **Location:** `jobs_datasource.dart` — always fetches from API
- **Fix:** Cache job data in local SQLite (drift) or SharedPreferences

### Issue 2: Photo Upload Blocks Completion
- **Problem:** Photos must upload before job completion submits
- **Location:** `completeJob()` — upload then submit
- **Fix:** Make photo upload async, allow job completion without photos (upload later)

### Issue 3: No Background Location Tracking
- **Problem:** Location tracking stops when app is backgrounded
- **Location:** `employee_location_provider.dart`
- **Fix:** Implement background location service with wake lock

### Issue 4: Earnings Period Filter Not Saved
- **Problem:** Earnings filter resets to "This Week" on every visit
- **Location:** `earnings_screen.dart` — filter is local state only
- **Fix:** Persist selected period in SharedPreferences

### Issue 5: Notification Tap Doesn't Navigate
- **Problem:** Tapping FCM notification opens app but doesn't navigate to relevant screen
- **Location:** `notification_service.dart` — no deep link handling
- **Fix:** Parse notification payload for job ID, navigate to job detail

### Issue 6: Job Status Updates Not Real-Time
- **Problem:** Employee must pull-to-refresh to see status changes
- **Location:** `jobs_home_screen.dart` — no real-time listener
- **Fix:** Implement Firestore snapshot listener or WebSocket for live updates

---

## APPENDIX: ALL API ENDPOINTS

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/users/link` | Firebase | Link Firebase user |
| POST | `/api/employees/device-token` | Firebase | Register FCM token |

### Jobs
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/jobs?employeeId=` | Firebase | Assigned jobs |
| GET | `/api/jobs?unassigned=true` | Firebase | Available jobs |
| GET | `/api/jobs/:id` | Firebase | Job detail |
| POST | `/api/jobs/:id/pickup` | Firebase | Accept job |
| PATCH | `/api/jobs/:id` | Firebase | Update job |
| POST | `/api/jobs/:id/complete` | Firebase | Complete job |

### Employees
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/employees/:id` | Firebase | Get profile |
| PATCH | `/api/employees/:id` | Firebase | Update profile |
| GET | `/api/employees/:id/earnings` | Firebase | Get earnings |
| POST | `/api/employees/location` | Firebase | Update location |

---

**END OF AUDIT**
