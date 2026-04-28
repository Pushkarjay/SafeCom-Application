# SafeCom Development Roadmap - What to Build Next

**Last Updated**: April 28, 2026  
**Overall Platform Completion**: ~40%

---

## Quick Summary by App

| App | Screens | Features | Completion |
|-----|---------|----------|-----------|
| **Admin Dashboard** | 5/14 | Basic CRUD lists | 35-40% |
| **Mobile Customer** | 15/28 | Service booking flow | 50-55% |
| **Mobile Employee** | 6/20 | Job assignment | 30% |

---

## Phase 1: Core Foundation (Weeks 1-2)
**Goal**: Make each app self-contained and functional

### Admin Dashboard
**Priority**: HIGH - Enables business operations

```
MUST BUILD:
☐ CustomerDetailsScreen - View/edit individual customer
  Location: features/customers/customer_detail_screen.tsx
  Displays: Full customer info, order history, status
  Actions: Edit customer info, view all orders, manage status

☐ TechnicianDetailsScreen - View/edit technician
  Location: features/technicians/technician_detail_screen.tsx
  Displays: Tech info, rating, availability, assigned jobs
  Actions: Edit info, view performance, assign/unassign jobs

☐ JobDetailsScreen - Full job information
  Location: features/jobs/job_detail_screen.tsx
  Displays: Job details, customer, technician, timeline
  Actions: Update status, reassign technician, add notes

☐ Logout functionality
  Location: useAuthStore
  Features: Clear auth state, redirect to login

☐ Error boundary component
  Location: widgets/common/ErrorBoundary.tsx
  Shows: Fallback UI on errors
```

### Mobile Customer App
**Priority**: HIGH - Core user journey

```
MUST BUILD:
☐ Authentication screens (Login/Signup)
  Location: features/auth/
  Auth methods: Phone OTP or Email password
  Integrate with backend auth service

☐ ProfileScreen - User account management
  Location: features/profile/profile_screen.dart
  Displays: Name, email, phone, addresses
  Actions: Edit profile, manage addresses, manage payment methods

☐ OrderHistoryScreen - Past bookings
  Location: features/home/ (new tab/section)
  Displays: List of completed orders with status
  Actions: View details, reorder, rate service
```

### Mobile Employee App
**Priority**: HIGH - Enable job workflow

```
MUST BUILD:
☐ ProfileScreen (Full implementation)
  Location: features/auth/profile_screen.dart
  Displays: Name, rating, earnings, availability
  Actions: Edit profile, toggle availability

☐ Complete work submission flow
  Location: features/jobs/
  Features: Camera for before/after photos
  Features: Work notes, amount collected
  Features: Customer signature or OTP verification
```

---

## Phase 2: Enhanced User Experience (Weeks 3-4)
**Goal**: Add critical user-facing features

### Admin Dashboard
```
SHOULD BUILD:
☐ Add/Edit Customer Modal
  Forms: Name, email, phone, address
  Validation: Email format, phone format
  Integration: POST/PUT to backend

☐ Add/Edit Technician Modal
  Forms: Name, email, location, skills, availability
  Validation: All required fields
  
☐ Create Job Screen
  Forms: Select customer, service type, technician, date, amount
  Logic: Assign to technician, send notification

☐ Search and Filter
  Features: Search customers by name/email/phone
  Features: Filter jobs by status, date range, technician
  Features: Filter technicians by location, rating

☐ Simple Analytics Dashboard
  Charts: Jobs completed over time, revenue trend
  Metrics: Average response time, technician ratings
```

### Mobile Customer App
```
SHOULD BUILD:
☐ OrderTrackingScreen
  Displays: Current job location (if GPS available)
  Shows: Assigned technician info
  Shows: Estimated arrival time
  Features: Call/chat technician

☐ PaymentMethodsScreen
  Manage: Add credit card, debit card, UPI, wallet
  Features: Set default payment method

☐ RatingReviewScreen
  Shows: After service completion
  Allows: 5-star rating, text review, photo upload
  Location: After BookingConfirmationScreen (for completed jobs)

☐ NotificationsScreen
  Types: Order updates, promotions, support messages
  Features: Mark as read, delete notifications

☐ SupportChatScreen
  Features: Chat with support team
  Features: FAQ section, ticket creation
```

### Mobile Employee App
```
SHOULD BUILD:
☐ JobMapScreen
  Shows: Current job location on map
  Navigation: Turn-by-turn directions to customer location
  Features: Call customer, share ETA

☐ PhotoDocumentationScreen
  Capture: Before/after photos of installation
  Features: Add captions/labels to photos
  Upload: Send photos with job completion

☐ CustomerSignatureScreen
  Signature: Collect customer signature via finger painting
  Alternative: OTP verification if no signature
  Save: Store signature with completion

☐ AttendanceScreen
  Features: Clock in/out
  Displays: Daily attendance record
  Tracks: Hours worked

☐ EarningsScreen
  Shows: Daily/weekly/monthly earnings
  Breakdown: By job type
  Features: Payment history, withdrawal requests
```

---

## Phase 3: Advanced Features (Weeks 5-6)
**Goal**: Differentiate platform and increase engagement

### Admin Dashboard
```
NICE TO BUILD:
☐ Reports Module
  Reports: Daily/weekly revenue, technician performance
  Export: PDF, CSV export functionality
  Filters: Date range, technician, customer

☐ BulkActionsScreen
  Features: Bulk assign jobs to technicians
  Features: Bulk status updates
  
☐ AuditLogScreen
  Shows: All admin actions, timestamps, changes
  Features: Filter by admin, date, action type

☐ SettingsScreen
  Admin profile: Name, email, password
  System settings: Company info, notification preferences
```

### Mobile Customer App
```
NICE TO BUILD:
☐ ReferralScreen
  Features: Generate referral code
  Shows: Referrals and rewards
  Share: Social sharing

☐ WalletScreen
  Balance: Current wallet balance
  History: Transaction history
  Features: Add money, use for payments

☐ SubscriptionPlansScreen
  Shows: AMC subscription options
  Features: Subscribe, manage subscription

☐ ServiceHistoryFiltersScreen
  Filter: By date, service type, technician, status
  Search: By order ID or service name
```

### Mobile Employee App
```
NICE TO BUILD:
☐ PerformanceScreen
  Shows: Rating, completion rate, response time
  Benchmarks: vs average technician
  Trends: Week-over-week performance

☐ ScheduleScreen
  Shows: Upcoming jobs calendar view
  Features: View workload, swap jobs with colleagues
  
☐ ExpenseTrackingScreen
  Log: Parts/materials expenses
  Reimburse: Request reimbursement
  History: Expense reports
```

---

## Phase 4: Platform Integration (Weeks 7-8)
**Goal**: Connect all three apps with backend

### Backend Requirements
```
MUST IMPLEMENT (if not done):
☐ Real-time job status updates via WebSocket or polling
☐ Push notifications (Firebase Cloud Messaging or OneSignal)
☐ Photo upload API (S3 or similar)
☐ Payment processing API integration
☐ Location tracking API for map features
☐ Chat/messaging system (Socket.io or similar)
☐ Rating system with persistence
☐ Order/job history queries with filtering
```

### Admin Dashboard Integration
```
☐ Real-time job status updates in JobsScreen
☐ Real-time technician availability in TechniciansScreen
☐ Push notifications from admin actions to mobile apps
```

### Mobile Customer App Integration
```
☐ Real-time order tracking with GPS
☐ Live chat with technician
☐ Push notifications for job updates
☐ Payment processing on PaymentScreen
```

### Mobile Employee App Integration
```
☐ Real-time job assignments
☐ GPS location updates to admin/customer
☐ Push notifications for new jobs
☐ Payment processing for earnings
```

---

## Recommended Build Sequence

### Week 1-2: Foundation
1. **Monday-Tuesday**: Admin Dashboard detail screens
2. **Wednesday-Thursday**: Customer app auth + profile
3. **Friday**: Employee app profile + work completion form

### Week 3-4: User Experience
1. **Monday-Tuesday**: Customer app order tracking + payments
2. **Wednesday-Thursday**: Employee app map + photos + signature
3. **Friday**: Admin search/filter + forms

### Week 5-6: Features
1. **Monday-Tuesday**: Customer app reviews + chat
2. **Wednesday-Thursday**: Employee app earnings + attendance
3. **Friday**: Admin reports + settings

### Week 7-8: Integration
1. **Monday-Wednesday**: Backend APIs + WebSocket setup
2. **Thursday-Friday**: Integration testing across all apps

---

## Critical Path Dependencies

```
ADMIN DASHBOARD:
  Login ✅
    ↓
  Dashboard ✅
    ├→ Customer Details (Priority 1)
    ├→ Technician Details (Priority 1)
    └→ Job Details (Priority 1)
    
CUSTOMER APP:
  Splash ✅
    ↓
  Location Permission ✅
    ↓
  Login (Priority 1)
    ↓
  Profile (Priority 1)
    ↓
  Home ✅
    ↓
  Service Selection ✅
    ↓
  Booking Flow ✅
    ├→ Order Tracking (Priority 2)
    ├→ Payment Methods (Priority 2)
    └→ Rating System (Priority 2)

EMPLOYEE APP:
  Login ✅
    ↓
  Profile (Priority 1)
    ↓
  Jobs List ✅
    ↓
  Job Details ✅
    ├→ Map/Navigation (Priority 2)
    ├→ Photos (Priority 2)
    └→ Signature (Priority 2)
    ↓
  Work Completion ✅
```

---

## Tech Debt / Improvements

```
ADMIN DASHBOARD:
☐ Add loading skeletons instead of generic loaders
☐ Implement proper error handling with user feedback
☐ Add form validation helpers
☐ Create reusable table component
☐ Add unit tests for components
☐ Implement proper TypeScript strict mode

CUSTOMER APP:
☐ Add proper error handling and retry logic
☐ Implement proper form validation
☐ Add analytics/tracking
☐ Optimize image loading
☐ Add offline support where possible
☐ Implement proper logging

EMPLOYEE APP:
☐ Add form validation
☐ Implement offline mode for jobs
☐ Add GPS/location tracking optimizations
☐ Improve error handling
☐ Add unit tests
```

---

## Success Metrics

### Admin Dashboard
- [ ] Can complete full customer/technician/job lifecycle
- [ ] No broken navigation links
- [ ] < 3 second page load times
- [ ] 0 unhandled errors

### Customer App
- [ ] Can authenticate and book a service end-to-end
- [ ] Can view order history and track orders
- [ ] Can complete booking and see confirmation
- [ ] Push notifications work for order updates

### Employee App
- [ ] Can login and view assigned jobs
- [ ] Can complete job with photos and signature
- [ ] Can track earnings
- [ ] Real-time job assignments working

---

## Questions for Product/Stakeholders

1. **Payment Processing**: Which payment gateway? (Razorpay, Stripe, etc.)
2. **Real-time Communication**: Chat required? Via SMS or in-app only?
3. **Map Integration**: Which mapping service? (Google Maps, Mapbox, etc.)
4. **Push Notifications**: Preferred service? (Firebase, OneSignal, etc.)
5. **Photo Storage**: S3, Azure Blob, or custom?
6. **Signature**: Digital signature or photo-based approval?
7. **Technician Assignment**: Auto-assignment algorithm or manual?
8. **Pricing Model**: Service-based or time-based charges?
9. **Cancellation Policy**: Customer can cancel before confirmation? Within X hours?
10. **Rating/Review**: Mandatory or optional after each job?

