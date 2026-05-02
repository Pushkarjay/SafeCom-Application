# Backend Server

This folder contains backend services for the SafeCom platform.

## Scope
- API layer for customer, employee, and admin apps
- Dynamic pricing and invoice engine
- Booking, scheduling, and payment orchestration
- Authentication, authorization, and audit logging

## Current Status
- TypeScript + Express scaffold created
- Mock CCTV API endpoints added for dashboard, customers, technicians, jobs, and payments
- JWT-based login endpoint added for admin access

## Local Development

```bash
cd backend_server
npm install
npm run dev
```

## Default Demo Login
- Email: admin@safecom.com
- Password: admin123

> Security note: Do not store real admin passwords in the repository. Use environment variables or Firebase Console to manage production admin credentials.

### Create admin users securely
Use the admin creation script with `ADMIN_USERS_JSON` to create real admin accounts without committing the secret passwords.

```powershell
$env:ADMIN_USERS_JSON = '[{"email":"Pushkar_admin@safecom.com","password":"<secure-password>","displayName":"Pushkar Admin"},{"email":"Shakti_admin@safecom.com","password":"<secure-password>","displayName":"Shakti Admin"}]'
npm run create-admin-user
```

Or set `ADMIN_USERS_JSON` in your local environment before running the script.
