# Backend Delivery Checklist

## 1) Data Model
- Users/roles/permissions
- Service categories and sub-services
- Packages (4/8/16/32 camera defaults)
- Products, add-ons, and mandatory/optional flags
- Pricing rules and overrides
- Taxes/GST configuration
- Recommendations sets
- Booking drafts and finalized bookings
- Invoices and line items
- Payments and receipts
- Serviceability/coverage rules
- Locations/areas and workforce mapping
- Job assignments and status history
- Issue reports (parts shortage, reschedule, customer not available, technical issue)
- Audit logs

## 2) Core APIs
### Auth & Access
- OTP login / token issuance
- Role checks and permission matrix

### Catalog & Pricing
- Catalog CRUD (categories, sub-services)
- Packages CRUD
- Products/add-ons CRUD
- Pricing rules CRUD
- Taxes/GST CRUD
- Recommendation sets CRUD

### Booking & Scheduling
- Create booking draft
- Update booking draft items
- Reserve slot
- Confirm booking
- Cancel/reschedule

### Invoice & Payments
- Invoice generation
- Payment order creation
- Webhook verification
- Receipt capture
- Refund handling

### Workforce & Operations
- Assignment create/update
- Auto-assignment trigger
- Reassignment/escalation
- Job list and detail for employee app
- Status lifecycle updates
- Issue reporting

### Serviceability & Location
- Serviceability lookup by location
- Coverage validation for booking
- Area mapping for workforce assignment

### Admin & Audit
- Audit log write/read
- Reports/exports endpoints

### Observability
- Health/readiness endpoints
- Metrics endpoint

## 3) Flows to Validate
- Booking draft -> payment -> confirmation
- Admin pricing change -> catalog update -> invoice recalculation
- Assignment -> status lifecycle -> invoice/payment reconciliation
- Webhook idempotency and retry safety
- Offline status queue sync

## 4) Security & Compliance
- HTTPS-only
- Idempotency for booking/payment APIs
- Encryption at rest/in transit
- Secret management for webhooks
