# Next Instructions

## Current Priority
**Integrate Admin Dashboard with Backend API** — Replace mock datasources with real backend API calls.

## Immediate Steps
1. Start backend server: `npm run dev` in backend_server directory (port 5000).
2. Start admin dashboard: `npm run dev` in Admin/web_app/admin-dashboard (port 3000).
3. Verify both services are running without errors.
4. Replace admin_datasource.ts mock methods to call backend API:
   - Update base URL to `http://localhost:5000/api`
   - Wire `getDashboardMetrics()` to `GET /api/dashboard/metrics`
   - Wire `getCustomers()` to `GET /api/customers?page=...&limit=...`
   - Wire `getTechnicians()` to `GET /api/technicians?page=...&limit=...`
   - Wire `getJobs()` to `GET /api/jobs?status=...&page=...&limit=...`
   - Wire `getPayments()` to `GET /api/payments?page=...&limit=...`
5. Wire login endpoint to backend: `POST /auth/login` returns JWT token.
6. Store JWT token in Zustand auth.store after successful login.
7. Add authorization header to all API calls in admin_datasource.
8. Test full login → dashboard flow with real backend responses.
9. Commit changes with message: "feat: connect admin dashboard to backend API endpoints".
10. Push to GitHub.

## Validation
- Admin dashboard logs in successfully with backend auth.
- Dashboard metrics load from backend API with correct data.
- Customer/technician/jobs lists display backend data with pagination.
- No CORS errors in browser console.
- No 401 errors (token should be included in requests).

## After This Phase
- Connect mobile apps (customer/employee) to backend API.
- Set up real database (currently using mock data).
- Add Firebase/GCD integration (deferred for now).

## Scope Reminder
- CCTV-only services: Installation, Maintenance, AMC, Repair, Upgrade, Accessories.
- No Firebase or GCD integration for current sprint.
- All data currently mocked — ready for real database when needed.
