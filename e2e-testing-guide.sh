#!/bin/bash
# End-to-End Testing Script for SafeCom Application
# Tests authentication flow, data access, and security rules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000/api}"
FIREBASE_PROJECT="safecom-application-01"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SafeCom Application - End-to-End Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Test 1: Backend Health Check
echo -e "${YELLOW}[Test 1] Backend Health Check${NC}"
HEALTH=$(curl -s "${BACKEND_URL}/health" -o /dev/null -w "%{http_code}")
if [ "$HEALTH" = "200" ]; then
  echo -e "${GREEN}✅ Backend health check passed${NC}\n"
else
  echo -e "${RED}❌ Backend health check failed (HTTP $HEALTH)${NC}\n"
  exit 1
fi

# Test 2: Admin Login
echo -e "${YELLOW}[Test 2] Admin Authentication${NC}"
echo "Testing login with admin@safecom.local..."

# Note: This would require Firebase REST API or SDK
# For now, we'll document the manual testing steps
cat << 'EOF'

Manual Testing Steps:
1. Open admin dashboard: http://localhost:5173 (or production URL)
2. Login with credentials:
   Email: admin@safecom.local
   Password: AdminTest@123
3. Verify dashboard loads with metrics

Expected Results:
✅ Login succeeds
✅ Dashboard displays total customers count
✅ Dashboard displays active technicians count
✅ Dashboard displays pending jobs count
✅ Dashboard displays total revenue

EOF

# Test 3: Customer Authentication Flow
echo -e "${YELLOW}[Test 3] Customer Authentication Flow${NC}"
cat << 'EOF'

Manual Testing Steps (Mobile Customer App):
1. Launch mobile_customer app
2. Click "Sign Up" button
3. Enter test credentials:
   Email: customer@test.com
   Phone: +91-9876543210
   Address: Test Address, City
   Password: TestCustomer@123
4. Complete signup
5. Login with credentials
6. Verify app shows home screen
7. Check if user data appears in Firestore

Expected Results:
✅ Firebase user created
✅ Customer document in Firestore
✅ User linked to backend
✅ Customer can browse catalog
✅ Customer can create jobs

EOF

# Test 4: Employee Authentication Flow
echo -e "${YELLOW}[Test 4] Employee Authentication Flow${NC}"
cat << 'EOF'

Manual Testing Steps (Mobile Employee App):
1. Launch mobile_employee app
2. Click "Sign Up" button
3. Enter test credentials:
   Email: employee@test.com
   Phone: +91-9876543211
   Location: Service Center 1
   Skills: AC Repair, Installation
   Password: TestEmployee@123
4. Complete signup
5. Login with credentials
6. Verify app shows assigned jobs screen
7. Check if employee data appears in Firestore

Expected Results:
✅ Firebase user created
✅ Employee document in Firestore
✅ User linked to backend
✅ Employee can view assigned jobs
✅ Employee can update job status

EOF

# Test 5: Firestore Security Rules
echo -e "${YELLOW}[Test 5] Firestore Security Rules${NC}"
cat << 'EOF'

Security Rules Testing Checklist:

1. Customer Data Isolation:
   ✅ Customer can read own user document
   ✅ Customer cannot read other customer documents
   ✅ Customer can read assigned jobs
   ✅ Customer cannot read other customer jobs

2. Employee Data Access:
   ✅ Employee can read own profile
   ✅ Employee can read assigned jobs
   ✅ Employee cannot read other employee jobs
   ✅ Employee cannot modify other employee assignments

3. Admin Dashboard Access:
   ✅ Admin can read all users
   ✅ Admin can read all customers
   ✅ Admin can read all employees
   ✅ Admin can read all jobs/payments
   ✅ Admin can modify any record

4. Catalog Access:
   ✅ Authenticated users can read catalog
   ✅ Only admin can create/modify catalog items

5. Payment Records:
   ✅ Customers see only own payments
   ✅ Admins see all payments
   ✅ Only admins can create payments

EOF

# Test 6: API Integration
echo -e "${YELLOW}[Test 6] API Integration Tests${NC}"
cat << 'EOF'

Backend API Testing Checklist:

1. Dashboard Metrics Endpoint:
   Endpoint: GET /api/dashboard/metrics
   Expected: Returns { totalCustomers, activeTechnicians, ... }
   Status: Should return 200 with metrics

2. Customers Endpoint:
   Endpoint: GET /api/customers
   Expected: Returns array of customers
   Auth: Requires Firebase ID token

3. Employees Endpoint:
   Endpoint: GET /api/employees
   Expected: Returns array of employees
   Auth: Requires Firebase ID token

4. Jobs Endpoint:
   Endpoint: GET /api/jobs
   Expected: Returns array of jobs
   Auth: Requires Firebase ID token

5. Authentication:
   - All protected endpoints require valid Firebase ID token
   - 401 response for missing/invalid tokens
   - 403 response for insufficient permissions

EOF

# Test 7: Data Flow
echo -e "${YELLOW}[Test 7] Complete Data Flow Test${NC}"
cat << 'EOF'

Expected Data Flow:

1. Customer Signup Flow:
   Mobile App → Firebase Auth → Backend /api/users/link → Firestore
   Result: Customer document in Firestore with Firebase UID

2. Job Creation Flow:
   Mobile App → Firebase → Backend → Firestore
   Result: Job document created with customer reference

3. Dashboard Update Flow:
   Admin Dashboard → Backend /api/dashboard/metrics
   → Firestore queries → Dashboard displays live data
   Result: Real-time metrics display

4. Employee Assignment Flow:
   Admin App → Backend → Firestore employees collection
   Result: Employee sees assigned job in mobile app

EOF

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Testing checklist prepared${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run admin user creation script:"
echo "   npm run create-admin-user"
echo ""
echo "2. Test admin dashboard login"
echo "3. Test mobile app authentication flows"
echo "4. Verify Firestore data persistence"
echo "5. Check Firebase Console for data"
echo ""
echo -e "${GREEN}Testing guide complete!${NC}\n"
