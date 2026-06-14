# SafeCom Employee Mobile App

Job management and field operations app for SafeCom service technicians.

## Tech Stack

- **Framework:** Flutter 3.x
- **State Management:** Riverpod
- **Navigation:** GoRouter
- **HTTP Client:** Dio
- **Backend:** Firebase Auth + Firestore + Cloud Run API (asia-south1)
- **Maps:** Google Maps deep-link navigation
- **Notifications:** Firebase Cloud Messaging (FCM)

## Features

- **Job Dashboard:** Pending/Completed tabs with rich job cards
- **Job Detail:** Comprehensive info with invoice breakdown, line items, totals
- **Work Completion:** Status updates with submission confirmation
- **Photo Capture:** On-site photo documentation with gallery
- **Map Navigation:** Google Maps deep-link for site navigation
- **Earnings Tracking:** Performance stats and payment tracking
- **Profile Management:** Technician profile with performance metrics
- **Notifications:** Push notifications for new bookings, status updates

## Architecture

```
lib/
├── core/          # Config, theme, services (notifications, etc.)
├── data/          # Models, datasources, repositories, providers
└── features/      # Auth, jobs, map, photos, earnings, profile
```

## Version

Current: **v1.1.1+10** (see pubspec.yaml)

## Build

```bash
flutter pub get
flutter run
flutter build apk --release
flutter build appbundle --release
```
