# Employee App Integration Guide (2026-05-04)

## Current State
- Employee app successfully fetches jobs from `/api/jobs` endpoint
- Jobs are filtered client-side by technician ID
- Work completion is submitted via PATCH to `/api/jobs/:id`

## Changes Required for Canonical Contract Alignment

### 1. Update Job Response Mapping
The backend now returns `CanonicalJob` objects with nested invoice data.

**Update `mobile_employee/lib/data/datasources/jobs_datasource.dart`:**

```dart
// In getAssignedJobs method, update the JSON mapping to include invoice data:

return matchingJobs.map<AssignedJob>((json) {
  // Existing fields...
  final map = <String, dynamic>{
    // ... existing code ...
    'invoice_id': json['invoice']?['invoiceId'] ?? '',
    'invoice_line_items': json['invoice']?['lineItems'] ?? [],
    'invoice_total': (json['invoice']?['grandTotal'] as num?)?.toDouble() ?? 0.0,
  };
  return AssignedJob.fromJson(map);
}).toList();
```

### 2. Extend AssignedJob Model
Add invoice fields to track line items and full bill details.

**Update `mobile_employee/lib/data/models/job_models.dart`:**

```dart
class InvoiceLineItem {
  final String productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double lineTotal;

  InvoiceLineItem({...});
  
  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) { ... }
}

class AssignedJob {
  // ... existing fields ...
  final String? invoiceId;
  final List<InvoiceLineItem>? lineItems;
  final double invoiceTotal;

  // Update factory and toJson accordingly
}
```

### 3. Display Invoice in Job Details Screen
The job detail screen should show the full breakdown of products and quantities.

**Update `mobile_employee/lib/features/jobs/job_detail_screen.dart`:**

```dart
// Add a section displaying invoice line items:
if (job.lineItems != null && job.lineItems!.isNotEmpty) {
  SliverList(
    delegate: SliverChildBuilderDelegate(
      (context, index) {
        final item = job.lineItems![index];
        return ListTile(
          title: Text(item.productName),
          subtitle: Text('${item.quantity}x @ ₹${item.unitPrice}'),
          trailing: Text('₹${item.lineTotal}'),
        );
      },
      childCount: job.lineItems!.length,
    ),
  );
  
  // Total amount
  Container(
    padding: EdgeInsets.all(16),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text('Total Amount:', style: TextStyle(fontWeight: FontWeight.bold)),
        Text('₹${job.invoiceTotal}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    ),
  );
}
```

### 4. Add Google Maps Deep-Link Navigation
Update job detail screen to open Google Maps with booking pin.

**Update `mobile_employee/lib/features/jobs/job_detail_screen.dart`:**

```dart
// Add map navigation button
FilledButton.icon(
  onPressed: () {
    _openMapNavigation(job.latitude, job.longitude, job.location);
  },
  icon: Icon(Icons.map),
  label: Text('Navigate to Site'),
),

// Helper method
Future<void> _openMapNavigation(double latitude, double longitude, String address) async {
  final googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude';
  if (await canLaunchUrl(Uri.parse(googleMapsUrl))) {
    await launchUrl(Uri.parse(googleMapsUrl), mode: LaunchMode.externalAppOnly);
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Could not open Google Maps')),
    );
  }
}
```

**Add `url_launcher` dependency to `pubspec.yaml`:**
```yaml
dependencies:
  url_launcher: ^6.1.14
```

### 5. Setup Push Notification Receiver
Employee app should listen for new booking notifications.

**Create `mobile_employee/lib/core/services/notification_service.dart`:**

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // Request permission
    final settings = await _firebaseMessaging.requestPermission();
    if (settings.authorizationStatus != AuthorizationStatus.authorized) {
      return;
    }

    // Listen to foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (message.data['type'] == 'new_booking') {
        _handleNewBooking(message.data);
      }
    });

    // Listen to background/terminated messages
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (message.data['type'] == 'new_booking') {
        _handleNewBooking(message.data);
      }
    });
  }

  void _handleNewBooking(Map<String, dynamic> data) {
    // TODO: Trigger a local notification
    // TODO: Refresh jobs list
    // TODO: Show banner/badge that new booking is available
    print('New booking received: ${data['bookingId']}');
  }

  Future<String?> getDeviceToken() async {
    return await _firebaseMessaging.getToken();
  }
}
```

**Update `pubspec.yaml`:**
```yaml
dependencies:
  firebase_messaging: ^14.6.1
```

### 6. Auto-Refresh Jobs on New Booking
The jobs list should refresh when a new booking notification arrives.

**Update job providers in `mobile_employee/lib/features/jobs/providers/jobs_provider.dart`:**

```dart
// Add refresh trigger
final jobsRefreshTrigger = StateProvider<int>((ref) => 0);

final employeeJobsProvider = FutureProvider<List<AssignedJob>>((ref) async {
  // Watch refresh trigger
  ref.watch(jobsRefreshTrigger);
  
  final repository = ref.watch(jobsRepositoryProvider);
  final employeeId = ref.watch(currentEmployeeIdProvider);
  
  return repository.getAssignedJobs(employeeId);
});

// In notification service, trigger refresh:
ref.read(jobsRefreshTrigger.notifier).state++;
```

## Backend Endpoints Now Available

### Create Booking (triggers job creation and notification)
```
POST /api/bookings
Authorization: Bearer <token>

{
  "customerId": "CUST-123",
  "serviceType": "installation",
  "serviceConfig": { ... },
  "location": { "address": "...", "latitude": 25.59, "longitude": 85.13 },
  "scheduledDate": "2026-05-10",
  "scheduledTimeSlot": "09:00-10:00",
  "lineItems": [ ... ],
  "notes": "..."
}
```

### Get Jobs (now returns canonical format)
```
GET /api/jobs?technicianId=EMP-001
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "jobId": "JOB-...",
      "bookingId": "BOOK-...",
      "customer": { ... },
      "location": { ... },
      "serviceType": "installation",
      "invoice": {
        "invoiceId": "INV-...",
        "grandTotal": 15000,
        "lineItems": [ ... ]
      },
      ...
    }
  ]
}
```

### Check Serviceability
```
POST /api/serviceability/check

{
  "latitude": 25.5941,
  "longitude": 85.1376
}

Response:
{
  "success": true,
  "data": {
    "isServiceable": true,
    "message": "Service available in Patna City Core",
    "serviceArea": {
      "areaCode": "PATNA_CORE",
      "areaName": "Patna City Core",
      "estimatedTimeToService": "2-4 hours"
    }
  }
}
```

## Testing Checklist

- [ ] Employee app fetches jobs from `/api/jobs`
- [ ] Invoice line items display correctly in job detail
- [ ] Map navigation button opens Google Maps with correct coordinates
- [ ] New booking notification is received in foreground
- [ ] Jobs list auto-refreshes on notification
- [ ] Job status updates via PATCH `/api/jobs/:id` work correctly
- [ ] Work completion submission includes invoice reference

## Next Steps

1. Add Firebase Messaging setup to employee app
2. Extend job model to include invoice fields
3. Update job detail screen UI for invoice display
4. Wire map deep-link navigation
5. Test end-to-end: customer booking → employee notification → job visible
