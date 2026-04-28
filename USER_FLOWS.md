# SafeCom Application User Flows

## Admin Dashboard Flow

```
LoginScreen
    ↓
DashboardScreen (Main Hub)
├── → CustomersScreen (Table view + pagination)
│   └── ❌ CustomerDetailsScreen (Missing)
│
├── → TechniciansScreen (Table view + pagination)
│   └── ❌ TechnicianDetailsScreen (Missing)
│
├── → JobsScreen (Table view + pagination)
│   └── ❌ JobDetailsScreen (Missing)
│
└── Quick Actions (Not Implemented)
    ├── ❌ Add Customer Form
    ├── ❌ Add Technician Form
    ├── ❌ Create Job Form
    └── ❌ Reports/Analytics

❌ Missing: Logout, Profile, Settings
```

## Mobile Customer App Flow

```
SplashScreen (1.2s delay)
    ↓
LocationPermissionScreen (Request permission)
    ↓
HomeScreen (Service Selection Hub)
├── Installation Path:
│   ├── ServiceTypeScreen (IP Camera, DVR, Wi-Fi)
│   ├── PackageSelectionScreen
│   ├── InstallationCustomizationScreen
│   └── AccessoriesEstimateScreen
│
├── Maintenance Path:
│   ├── MaintenanceTypeScreen
│   ├── MaintenancePackageScreen
│   └── MaintenanceCustomizationScreen
│
├── Repair Path:
│   ├── RepairIssueScreen (Select issue type)
│   └── RepairEstimateScreen
│
├── Upgrade Path:
│   ├── SystemUpgradeScreen
│   └── UpgradeEstimateScreen
│
├── AMC Path:
│   └── AMCPlanScreen
│
└── Accessories:
    └── AccessoriesScreen

Common Booking Flow (After selecting service):
    ↓
SchedulingScreen (Select date + time)
    ↓
PaymentScreen (Review and confirm)
    ↓
BookingConfirmationScreen (Success)

❌ Missing:
├── Auth screens (Login/Signup)
├── ProfileScreen
├── Order history/tracking
├── Support/Chat
└── Rating/Review system
```

## Mobile Employee App Flow

```
LoginScreen (Phone + Password)
    ↓
JobsHomeScreen (Assigned Jobs List)
├── Empty State (when no jobs)
└── Job List (with status)
    ↓ (Select a job)
    ↓
JobDetailScreen
├── Display: Customer info, location, service type
├── Input: Notes, amount collected
└── Action: Mark as Complete
    ↓
WorkCompletionScreen (Success confirmation)

Navigation:
HomeScreen → ProfileScreen (via icon button)

❌ Missing:
├── Map/Real-time tracking
├── GPS navigation
├── Photo/Signature capture
├── Before/After documentation
├── Attendance/Clock in-out
├── Earnings dashboard
├── Performance metrics
└── Settings/Account management
```

## Cross-App Data Flow

```
Admin Dashboard
    ├── Manages customers → Mobile Customer App (Books services)
    ├── Manages technicians → Mobile Employee App (Receives jobs)
    └── Manages jobs → Both apps (Track status)

Mobile Customer App
    └── Creates bookings → Backend → Mobile Employee App (Job assignments)

Mobile Employee App
    └── Completes work → Backend → Mobile Customer App (Order status)
```

## Feature Implementation Status Matrix

| Feature | Admin | Customer | Employee |
|---------|-------|----------|----------|
| Authentication | ✅ | ❌ | ✅ |
| View List | ✅ | ✅ | ✅ |
| View Details | ❌ | ❌ | ✅ |
| Create/Edit | ❌ | ❌ | ❌ |
| Delete | ❌ | ❌ | ❌ |
| Real-time Tracking | ❌ | ❌ | ❌ |
| Chat/Communication | ❌ | ❌ | ❌ |
| Photo Upload | ❌ | ❌ | ❌ |
| Payment Processing | ❌ | ⚠️ | ❌ |
| Rating/Review | ❌ | ❌ | ❌ |
| Push Notifications | ❌ | ❌ | ❌ |
| Reporting/Analytics | ❌ | ❌ | ❌ |
| User Settings | ❌ | ❌ | ❌ |
| Logout | ❌ | ⚠️ | ❌ |

Legend: ✅ = Complete, ⚠️ = Partial, ❌ = Missing

