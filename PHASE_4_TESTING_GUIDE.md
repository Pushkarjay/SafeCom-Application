# Phase 4: Admin User Setup & End-to-End Testing

## Overview
Phase 4 focuses on creating test users and performing comprehensive end-to-end testing to ensure all authentication and data flows work correctly across the entire application.

---

## Step 1: Create Admin User for Testing

### Prerequisites
- Firebase project configured (safecom-application-01)
- Backend server running or ready to run
- `service-account-key.json` in backend root directory

### Execute Admin User Creation

```bash
cd backend_server
npm run create-admin-user
```

### What This Does
1. Creates Firebase Auth user: `admin@safecom.com`
2. Creates user document in Firestore with role: `admin`
3. Creates admin profile document
4. Returns credentials for admin dashboard login

### Admin Credentials (Test)
```
Email:    admin@safecom.com
Password: admin123
```

---

## Step 2: Test Admin Dashboard

### Prerequisites
- Admin user created (Step 1)
- Backend running on http://localhost:3000
- Admin dashboard running on http://localhost:5173 (or configured URL)

### Test Flow

1. **Open Admin Dashboard**
   ```
   http://localhost:5173
   ```

2. **Login**
   - Email: `admin@safecom.local`
   - Password: `AdminTest@123`

3. **Verify Dashboard**
   - ✅ Dashboard loads without errors
   - ✅ Displays "Total Customers" metric
   - ✅ Displays "Active Technicians" metric
   - ✅ Displays "Pending Jobs" metric
   - ✅ Displays "Total Revenue" metric
   - ✅ Shows completion rate and response time

4. **Check Console**
   - No authentication errors
   - Firebase ID token successfully injected
   - API calls include Authorization header

### Expected Results
- Dashboard shows real-time metrics from Firestore
- All API calls include Firebase ID token
- Metrics update when data changes in Firestore

---

## Step 3: Test Customer Mobile App

### Setup

```bash
cd mobile_customer
flutter pub get
flutter run -d <device_id>
```

### Test Flow: User Signup

1. **App Launch**
   - ✅ Firebase initialization completes
   - ✅ Login screen displays

2. **Create New Account**
   - Click "Sign Up"
   - Enter test credentials:
     ```
     Email:       customer1@test.com
     Phone:       +91-9876543210
     Address:     123 Main St, City
     Password:    Customer@123
     ```

3. **Verify Signup**
   - ✅ Firebase user created
   - ✅ Backend receives user linking request
   - ✅ Firestore customer document created
   - ✅ App navigates to home screen

4. **Verify Data in Firestore**
   - Go to Firebase Console
   - Navigate to Firestore
   - Check `users/{uid}` - should exist with role: `customer`
   - Check `customers/{uid}` - should exist with customer data

### Test Flow: Browse Catalog

1. **Home Screen**
   - ✅ Shows "Browse Services" section
   - ✅ Catalog items load from Firestore

2. **Select Service**
   - Click on service item
   - ✅ Service details display
   - ✅ Pricing shows correctly

3. **Create Job**
   - Click "Book Service"
   - Verify job creation
   - ✅ Job document created in Firestore
   - ✅ Customer ID matches logged-in user

### Security Test: Data Isolation

1. **Create Multiple Customers**
   - Create customer2@test.com with different data
   - Create customer3@test.com

2. **Verify Data Isolation**
   - Login as customer1
   - ✅ See only customer1's jobs
   - ✅ Cannot access customer2's data
   - Login as customer2
   - ✅ See only customer2's jobs
   - ✅ Dashboard metrics show correct customer count

---

## Step 4: Test Employee Mobile App

### Setup

```bash
cd mobile_employee
flutter pub get
flutter run -d <device_id>
```

### Test Flow: Employee Signup

1. **App Launch**
   - ✅ Firebase initialization completes
   - ✅ Login screen displays

2. **Create New Account**
   - Click "Sign Up"
   - Enter test credentials:
     ```
     Email:       employee1@test.com
     Phone:       +91-9876543211
     Location:    Service Center 1
     Skills:      AC Repair, Installation
     Password:    Employee@123
     ```

3. **Verify Signup**
   - ✅ Firebase user created
   - ✅ Backend receives user linking request
   - ✅ Firestore employee document created
   - ✅ App navigates to jobs screen

### Test Flow: View Assigned Jobs

1. **Jobs Screen**
   - ✅ Shows "Assigned Jobs" section
   - ✅ Initially empty (no jobs assigned yet)

2. **Admin Assigns Job**
   - Go to admin dashboard
   - Create job and assign to employee1
   - Return to mobile app
   - ✅ Assigned job appears
   - ✅ Shows customer info
   - ✅ Shows job details

3. **Update Job Status**
   - Click on job
   - Change status from "assigned" to "in-progress"
   - ✅ Status updates in Firestore
   - ✅ Admin dashboard updates

### Security Test

1. **Create Multiple Employees**
   - Create employee2@test.com
   - Create employee3@test.com

2. **Verify Isolation**
   - Login as employee1
   - ✅ See only employee1's assigned jobs
   - ✅ Cannot modify other employee jobs
   - Login as employee2
   - ✅ See only employee2's assigned jobs

---

## Step 5: Test Firestore Security Rules

### Create Test Scenarios

#### Scenario 1: Customer Data Isolation
```
Test: Customer tries to read another customer's data
Expected: ❌ Firestore denies access
Action: Verify in browser console or Firestore emulator
```

#### Scenario 2: Admin Dashboard Access
```
Test: Non-admin user tries to access admin dashboard
Expected: ✅ Frontend shows login page
Expected: ❌ API returns 401/403
Action: Try accessing with customer account
```

#### Scenario 3: Employee Job Assignment
```
Test: Employee updates non-assigned job
Expected: ❌ Firestore denies write
Expected: ✅ Employee can update own jobs
Action: Verify in mobile app
```

#### Scenario 4: Catalog Access
```
Test: Authenticated user reads catalog
Expected: ✅ Firestore allows read
Test: Unauthenticated user reads catalog  
Expected: ❌ Firestore denies access
```

---

## Step 6: Verify Firestore Data Structure

### Expected Collections

After running all tests, Firestore should have:

```
users/
├── {uid1}  → { email, displayName, role: admin }
├── {uid2}  → { email, displayName, role: customer }
└── {uid3}  → { email, displayName, role: employee }

customers/
├── {uid2}  → { email, phone, address, firebaseUid, totalOrders }
└── ...

employees/
├── {uid3}  → { email, phone, location, skills, firebaseUid }
└── ...

jobs/
├── {jobId} → { customerId, technicianId, status, createdAt }
└── ...

catalog/
├── {itemId} → { name, price, description, status }
└── ...

admins/
└── {uid1}  → { email, displayName, role: super_admin, permissions }
```

---

## Step 7: Validate API Endpoints

### Test All Protected Routes

```bash
# Get Firebase ID Token (from browser console after login)
TOKEN="<firebase_id_token>"

# Test Dashboard Metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/dashboard/metrics

# Test Customers List
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/customers

# Test Employees List
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/employees

# Test Jobs List
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/jobs
```

### Expected Results
- ✅ 200 status for all authenticated requests
- ✅ 401 status for requests without token
- ✅ 403 status for unauthorized access
- ✅ Correct data returned per role

---

## Step 8: Troubleshooting

### Issue: "Firebase Auth not initialized"
**Solution**: Ensure Firebase config is correct in:
- Mobile apps: `main.dart` initialization
- Admin dashboard: `auth_service.ts` firebaseConfig

### Issue: "Firestore rules compilation error"
**Solution**: Verify `firestore.rules` UTF-8 encoding:
```bash
file firestore.rules
# Should show: UTF-8 Unicode text (no BOM)
```

### Issue: "401 Unauthorized on API calls"
**Solution**: Check Firebase ID token:
```javascript
// In browser console
firebase.auth().currentUser.getIdToken().then(token => console.log(token))
```

### Issue: "CORS errors on frontend"
**Solution**: Verify backend CORS config in `src/app.ts`:
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'production-url'],
  credentials: true
}))
```

---

## Testing Checklist

- [ ] Admin user created
- [ ] Admin dashboard login works
- [ ] Customer signup/login works
- [ ] Employee signup/login works
- [ ] Firestore documents created
- [ ] Security rules enforced
- [ ] API endpoints returning correct data
- [ ] Data isolation verified
- [ ] Mobile apps show correct data
- [ ] Firebase Console shows live data
- [ ] No console errors

---

## Next Phase: Production Deployment

After successful testing:

1. **Deploy Backend to Cloud Run**
   ```bash
   gcloud run deploy safecom-backend \
     --source . \
     --platform managed \
     --region asia-south1
   ```

2. **Update Mobile App URLs**
   - Change backend URL from localhost to Cloud Run URL
   - Rebuild and test

3. **Deploy Admin Dashboard**
   - Build production version
   - Deploy to Firebase Hosting or CDN

4. **Setup Monitoring**
   - Configure Cloud Logging
   - Setup alerts for errors
   - Monitor API performance

---

## Documentation References
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Run Deployment](https://cloud.google.com/run/docs)
