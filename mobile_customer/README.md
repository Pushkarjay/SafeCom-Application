# SafeCom Customer Mobile App

Self-service booking and service management app for SafeCom CCTV customers.

## Tech Stack

- **Framework:** Flutter 3.x
- **State Management:** Riverpod
- **Navigation:** GoRouter
- **HTTP Client:** Dio
- **Backend:** Firebase Auth + Firestore + Cloud Run API
- **Payments:** Razorpay

## Features

- **Guest-First Auth:** Browse services without login; auth required at payment
- **Service Discovery:** Browse categories, setups, products with nested tree navigation
- **Dynamic Invoicing:** Real-time pricing with GST breakdown, quantity selectors
- **Booking Flow:** Schedule, pay (Razorpay), confirm — with phone collection
- **Order History:** View past bookings, invoices, payment status
- **Profile Management:** Edit profile, saved locations, preferences
- **SDUI:** Server-driven UI for dynamic home page content
- **Serviceability:** Location-based coverage validation

## Architecture

```
lib/
├── core/          # Config, theme, SDUI engine, constants, routes
├── data/          # Models, repositories, providers, API service
└── features/      # Auth, home, services, booking, invoice, location, profile
```

## Version

Current: **v1.3.6+15** (see pubspec.yaml)

## Build

```bash
flutter pub get
flutter run
flutter build apk --release
flutter build appbundle --release
```
