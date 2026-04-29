# Payment Gateway Credentials Intake (Page 04)

Purpose: collect production payment credentials and configuration without committing any secrets.

## Razorpay (Primary)
Provide the following via secure channel (never commit to Git):
- Key ID (live)
- Key Secret (live)
- Webhook Secret
- Account ID (if using sub-accounts)
- Allowed domains (admin + customer web, if applicable)
- Success/Failure redirect URLs

Recommended backend environment variables (example names):
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET
- RAZORPAY_ENV=production

Recommended mobile config (non-secret):
- RAZORPAY_KEY_ID (public key only)
- Payment callback deep link scheme (if using app callbacks)

## Required Backend Configuration
- Create payment order on backend (never from mobile directly)
- Verify signature on webhook and on client callback
- Store payment status in Firestore
- Idempotency key for payment retries

## Required Firestore Collections (suggested)
- payments
- invoices
- bookings
- pricing_catalog
- pricing_rules
- recommendation_sets

## Optional Alternatives (if needed)
- Cashfree
- PayU
- Stripe

## Notes
- Do NOT store any secrets in the repo, docs, or CI logs.
- Add secrets via CI/CD environment variables or secret manager.
- Confirm webhook URL after backend endpoint is created.
