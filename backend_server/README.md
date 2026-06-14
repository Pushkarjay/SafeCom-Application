# SafeCom Backend Server

TypeScript + Express backend API server for the SafeCom CCTV service platform.

## Scope
- API layer for customer mobile, employee mobile, and admin web apps
- Dynamic pricing and invoice engine with GST support
- Booking, scheduling, and payment orchestration (Razorpay)
- Authentication, authorization (Firebase Auth + JWT), and audit logging
- Server-driven UI (SDUI) layout delivery
- Service catalog management with recursive tree structure

## Architecture

```
src/
├── routes/              # Express route handlers (17 route files)
│   ├── auth.ts          # Authentication
│   ├── jobs.ts          # Job lifecycle
│   ├── bookings.ts      # Booking management + job sync
│   ├── payments.ts      # Razorpay integration
│   ├── catalog.ts       # Product catalog
│   ├── sdui.ts          # Server-driven UI layouts
│   ├── serviceability.ts # Location coverage validation
│   └── ...
├── middleware/           # Firebase auth, JWT, error handling
├── services/            # Firestore, notification, catalog, user, payment services
├── contracts/           # Canonical contract types (booking, invoice, job)
└── types.ts             # Shared TypeScript types
```

## Deployment

| Region | URL | Purpose |
|--------|-----|---------|
| us-central1 | https://safecom-backend-177425757120.us-central1.run.app | Admin Dashboard + general API |
| asia-south1 | https://safecom-backend-177425757120.asia-south1.run.app | Mobile Customer/Employee API |

## Local Development

```bash
cd backend_server
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required variables:
- `PORT` - Server port (default: 5000)
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase service account
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - Payment gateway
- `RAZORPAY_WEBHOOK_SECRET` - Webhook verification

## API Endpoints

### Public
- `GET /health` — Health check
- `POST /api/auth/login` — Admin login
- `GET /api/catalog-public/*` — Service catalog
- `GET /api/sdui/*` — UI layouts
- `GET /api/serviceability/*` — Location validation

### Protected (Firebase Auth Required)
- `GET/POST /api/dashboard/*` — Analytics & metrics
- `GET/POST/PATCH /api/customers/*` — Customer management
- `GET/POST/PATCH /api/jobs/*` — Job lifecycle
- `GET/POST/PATCH /api/bookings/*` — Booking management
- `GET/POST /api/employees/*` — Employee operations
- `GET/POST /api/payments/*` — Payment processing
- `GET/POST/PATCH/DELETE /api/catalog/*` — Catalog management (admin)
- `GET/POST/PATCH/DELETE /api/config/:serviceId/**` — Dynamic service configuration

### Create admin users securely
Use the admin creation script with `ADMIN_USERS_JSON`:

```powershell
$env:ADMIN_USERS_JSON = '[{"email":"Pushkar_admin@safecom.com","password":"<secure-password>","displayName":"Pushkar Admin"},{"email":"Shakti_admin@safecom.com","password":"<secure-password>","displayName":"Shakti Admin"}]'
npm run create-admin-user
```
