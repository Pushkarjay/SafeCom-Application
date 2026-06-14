# SafeCom Screens - Technical Implementation Details

## Admin Dashboard (React + TypeScript)

### Architecture
- **State Management**: Zustand (`@data/auth.store`, admin stores)
- **Data Layer**: Datasources pattern (`adminDatasource`)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Type Safety**: Full TypeScript with models

### Screen Details

#### 1. LoginScreen (`auth/login_screen.tsx`)
```
Dependencies: useAuthStore, useNavigate
State: email, password, error, isLoading
Features:
  - Form validation
  - Error display
  - Demo credentials hint
  - Loading state during login
Flow: Login → /dashboard
```

#### 2. DashboardScreen (`dashboard/dashboard_screen.tsx`)
```
Dependencies: adminDatasource
Fetches: getDashboardMetrics() → DashboardMetrics model
State: metrics, isLoading
Metrics Displayed:
  - totalCustomers (number)
  - activeTechnicians (number)
  - pendingJobs (number)
  - totalRevenue (formatted as Lakhs)
  - completionRate (%)
  - avgResponseTime (hours)
Quick Actions: Add Customer, Add Technician, Create Job, View Reports
Status: Action buttons not hooked to screens
```

#### 3. CustomersScreen (`customers/customers_screen.tsx`)
```
Dependencies: adminDatasource
Fetches: getCustomers(page) → Customer[]
Data Model (Customer):
  - id, name, email, phone
  - totalOrders (number)
  - totalSpent (currency)
  - status (string)
Features:
  - Paginated display (Previous, Page #, Next)
  - Actions: View, Edit (non-functional)
  - Add Customer button (non-functional)
Column Formatting:
  - Amount field uses locale formatting (₹)
```

#### 4. TechniciansScreen (`technicians/technicians_screen.tsx`)
```
Dependencies: adminDatasource
Fetches: getTechnicians(page) → Technician[]
Data Model (Technician):
  - id, name, email, location
  - totalJobs (number)
  - rating (float, displayed with ⭐)
  - status (string)
Features:
  - Paginated display
  - Actions: View, Assign (non-functional)
  - Add Technician button (non-functional)
  - Rating display with 1 decimal place
```

#### 5. JobsScreen (`jobs/jobs_screen.tsx`)
```
Dependencies: adminDatasource
Fetches: getJobs(null, page) → Job[]
Data Model (Job):
  - id, serviceType, amount (currency)
  - scheduledDate (ISO string)
  - status (enum: 'completed'|'in-progress'|'pending'|'cancelled')
  - technicianId (optional)
Features:
  - Paginated display
  - Color-coded status badges:
    * completed → success/green
    * in-progress → warning/yellow
    * pending → info/blue
    * cancelled → error/red
  - Actions: View, Assign (conditional on pending status)
  - Create Job button (non-functional)
```

---

## Mobile Customer App (Flutter + Dart)

### Architecture
- **State Management**: Riverpod (AsyncNotifier, StateNotifier)
- **Navigation**: GoRouter
- **Theming**: Material Design 3
- **Architecture**: Feature-based structure with providers and widgets

### Screen Details

#### 1. SplashScreen (`splash/splash_screen.dart`)
```
Duration: 1.2 seconds
Navigation: LocationPermissionScreen
Features:
  - Gradient background (Blue → Green)
  - Shield icon in circular container
  - App branding
Widget Type: StatefulWidget with Timer
```

#### 2. LocationPermissionScreen (`location/location_permission_screen.dart`)
```
Provider: locationProvider
Features:
  - Request location permission
  - Explains why location is needed
  - Permission request button
Widget Type: ConsumerWidget
Next: HomeScreen (after permission granted)
```

#### 3. HomeScreen (`home/home_screen.dart`)
```
Providers:
  - locationProvider (current location)
  - homeServicesProvider (available services)
Features:
  - Location header with change option
  - Error message display
  - Service grid with routing logic:
    * Installation → ServiceTypeScreen
    * Maintenance → MaintenanceTypeScreen
    * AMC → AMCPlansScreen
    * Repair → RepairIssuesScreen
    * Upgrade → (needs checking)
  - Disabled service handling
Widget Type: ConsumerWidget
Service Fetching: homeServicesProvider (AsyncValue pattern)
```

#### 4. ServiceTypeScreen (`services/service_type_screen.dart`)
```
Hardcoded Types: IP Camera, DVR Camera, Wi-Fi Camera
Provider: installationFlowProvider.notifier
Actions:
  - selectServiceType(type)
  - Navigate to PackageSelectionScreen
Widget Type: ConsumerWidget
Navigation: GoRouter
```

#### 5. RepairIssueScreen (`services/repair_issue_screen.dart`)
```
Provider: repairFlowProvider
State: issues list, selectedIssue
Features:
  - Issue selection with highlight (blue border when selected)
  - Icon display for each issue
  - Navigate to repairEstimate on selection
Widget Type: ConsumerWidget
```

#### 6. SchedulingScreen (`booking/scheduling_screen.dart`)
```
Providers:
  - bookingFlowProvider (booking state)
  - activeOrderProvider (current order)
Data:
  - Date options: Next 6 days
  - Time slots: 5 options (8AM-10AM through 4PM-6PM)
Features:
  - Display active order (service name + package)
  - Date selection
  - Time slot selection
  - Navigation to PaymentScreen
Widget Type: ConsumerWidget
```

#### 7. PaymentScreen (`booking/payment_screen.dart`)
```
Providers:
  - activeOrderProvider
  - bookingFlowProvider
Displays:
  - Service name and package
  - Scheduled date and time
  - Total estimated amount (from order)
  - Booking amount (₹100 hardcoded)
  - Payment information note
Widget Type: ConsumerWidget
Features:
  - Summary tiles with amounts formatted as ₹
  - Next step: BookingConfirmationScreen
```

#### 8. BookingConfirmationScreen (`booking/booking_confirmation_screen.dart`)
```
Displays:
  - Success checkmark icon (green circle background)
  - "Booking Confirmed" headline
  - Success message
  - Booking details
Widget Type: ConsumerWidget
Features:
  - Celebration UI with icon and messaging
  - CTA buttons (implied): Book Another, View Order, Home
```

#### 9. AccessoriesEstimateScreen (`invoice/accessories_estimate_screen.dart`)
```
Input: List<AccessoryEstimateEntry>
Data Model:
  - id, name, price (double), quantity (int)
Features:
  - Quantity stepper for each item
  - Price display per item and total
  - Immutable entry updates (copyWith pattern)
Widget Type: ConsumerStatefulWidget
```

#### 10-16. Other Screens (Partial Implementation)
```
- installation_customization_screen.dart
- maintenance_customization_screen.dart
- repair_estimate_screen.dart
- upgrade_estimate_screen.dart
- maintenance_type_screen.dart
- amc_plan_screen.dart
- package_selection_screen.dart
- service_placeholder_screen.dart
- accessories_screen.dart

Status: File existence indicates implementation, but full details vary
```

---

## Mobile Employee App (Flutter + Dart)

### Architecture
- **State Management**: Riverpod (AsyncNotifier)
- **Navigation**: GoRouter
- **Architecture**: Feature-based with jobs management focus
- **Data Models**: job_models.dart (AssignedJob, WorkCompletion)

### Screen Details

#### 1. LoginScreen (`auth/login_screen.dart`)
```
Input Fields:
  - Phone number (TextInputController)
  - Password (TextInputController, obscured)
Features:
  - Phone number keyboard type
  - Form validation (implied)
  - Submit button
Widget Type: StatefulWidget
Navigation: JobsHomeScreen (on success)
```

#### 2. JobsHomeScreen (`jobs/jobs_home_screen.dart`)
```
Provider: assignedJobsProvider (AsyncValue)
Features:
  - Displays list of assigned jobs (AssignedJob[])
  - Profile button in AppBar (navigates to ProfileScreen)
  - Empty state: "No jobs assigned" with icon
  - Loading state: CircularProgressIndicator
  - Error handling
Widget Type: ConsumerWidget
Job List Items: Likely tap to JobDetailScreen
```

#### 3. JobDetailScreen (`jobs/job_detail_screen.dart`)
```
Input: AssignedJob (passed as parameter)
Data Fields:
  - Job information (location, service type, customer info)
  - Notes input (TextEditingController)
  - Estimated amount (read-only, from job)
  - Collected amount (TextEditingController, from job)
Features:
  - Editable notes
  - Amount tracking
  - Work completion submission
Widget Type: StatefulWidget
Controllers: 3 TextEditingControllers (notes, amount, collected)
Next: WorkCompletionScreen (on submit)
```

#### 4. WorkCompletionScreen (`jobs/work_completion_screen.dart`)
```
Input: WorkCompletion model
Features:
  - Success message: "Work Submitted"
  - Verification message: "Your work completion has been submitted for verification"
  - Green checkmark icon
  - Success styling (green background, border)
Widget Type: StatelessWidget
```

#### 5. SplashScreen (`auth/splash_screen.dart`)
```
Status: File exists, likely similar to customer app
```

#### 6. ProfileScreen (`auth/profile_screen.dart`)
```
Status: File exists, implementation details unknown
Likely displays: Technician profile information
```

---

## Data Models Reference

### Admin Models (`@data/models/admin_models`)
```typescript
DashboardMetrics {
  totalCustomers: number
  activeTechnicians: number
  pendingJobs: number
  totalRevenue: number (in smallest unit)
  completionRate: number (%)
  avgResponseTime: number (hours)
}

Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number (currency)
  status: string
}

Technician {
  id: string
  name: string
  email: string
  location: string
  totalJobs: number
  rating: number (float)
  status: string
}

Job {
  id: string
  serviceType: string
  amount: number (currency)
  scheduledDate: string (ISO)
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  technicianId?: string
}
```

### Customer App Models
```dart
Service {
  id: string
  title: string
  enabled: boolean
  // ... other fields
}

DashboardMetrics (if used) {
  // Similar to admin
}

ActiveOrder {
  serviceName: string
  packageLabel: string
  estimatedTotal: double
}

RepairIssue {
  id: string
  // description, icon, etc
}

AccessoryEstimateEntry {
  id: string
  name: string
  price: double
  quantity: int
}
```

### Employee App Models (`data/models/job_models.dart`)
```dart
AssignedJob {
  id: string
  serviceType: string
  customerInfo: CustomerInfo
  location: Location
  status: JobStatus
  estimatedAmount: double
  // ... other fields
}

WorkCompletion {
  jobId: string
  status: string
  submittedAt: DateTime
  // ... other fields
}
```

---

## Providers/Store Reference

### Admin Dashboard
- `useAuthStore` (Zustand)
- `adminDatasource` (Service)

### Customer App
- `homeServicesProvider` (Riverpod)
- `locationProvider` (Riverpod)
- `bookingFlowProvider` (Riverpod StateNotifier)
- `activeOrderProvider` (Riverpod)
- `installationFlowProvider` (Riverpod)
- `repairFlowProvider` (Riverpod)

### Employee App
- `assignedJobsProvider` (Riverpod AsyncNotifier)
- (Other job providers implied)

---

## Common Patterns Observed

### React/Admin
- Page-level containers with data fetching
- Table rendering for lists with pagination
- CSS modules for styling
- Zustand for global state
- Simple loading/error states

### Flutter/Customer
- ConsumerWidget pattern (Riverpod)
- Feature-based organization
- Service flow with linear progression
- Inline navigation with GoRouter
- AsyncValue pattern for async data

### Flutter/Employee
- Mix of StatefulWidget and ConsumerWidget
- Form handling with TextEditingController
- Model passing via route parameters
- Simple state management with Riverpod

