# 03 - Deployment Interaction Tracker

This file is the live handoff for the next phase. It lists what is already done, what is still optional, and what I need from you before making permanent production changes.

**Last Updated:** 2026-04-29  
**Status:** Setup is mostly complete. Android branding update is approved and in progress.

---

## A. What Is Already Done

### A.1 Authentication & App Flow
- Admin authentication flow exists and is wired in the app.
- Mobile customer authentication screens are implemented.
- Mobile employee screens are implemented.
- Auth-related API calls use fallback behavior where needed.

### A.2 API / Backend Setup
- Backend builds successfully.
- Admin dashboard builds successfully.
- Mobile customer app runs.
- Mobile employee app runs.
- Firestore is created and ready.
- Firebase Cloud Messaging is enabled.
- Service account JSON key is created and secured.

### A.3 Credentials
- GCP project is confirmed.
- Firebase project is confirmed.
- Service account key is stored in `./.secrets/`.
- Release keystore is created and stored in `./.secrets/`.
- Release SHA-1 fingerprint is captured.

### A.4 Git Safety
- `.gitignore` protects secrets, keystores, and environment files.
- `.env.production.example` files are created for all app areas.

---

## B. What Is Still Pending

### B.1 Android Package IDs
Approved final Android package IDs:
- `com.safecom.customer`
- `com.safecom.employee`

Android package rename is now being applied.

### B.2 iOS Bundle IDs
The iOS projects are still using Flutter placeholders through `$(PRODUCT_BUNDLE_IDENTIFIER)`.
I need your approval to set the final bundle IDs before App Store work.

Recommended final values:
- `com.safecom.customer`
- `com.safecom.employee`

### B.3 Maps API Key
The Maps key is working as-is and currently not locked down.
You said you do not want to restrict it now, so I will leave it open unless you later ask for hardening.

### B.4 IAM Hardening
The backend service account is functional.
You also said not to restrict roles now, so I will leave IAM as-is unless you later want least-privilege cleanup.

---

### C. What I Still Need From You

Please reply with approvals for the remaining items:

1. **iOS bundle ID rename**
   - Approve setting final iOS IDs to the Safecom values

2. **Deployment target**
   - Confirm you want Android prepared first before iOS

---

## D. What I Can Do Without Waiting

I can continue immediately with any of these:
- Update Flutter and React config files
- Install missing tools if needed
- Use terminal commands to prepare Android and iOS project files
- Create or update production env templates
- Generate or update deployment scripts
- Check build status after each change

If I need to install something, I will install it on the D drive if that is the safest available path.

---

## E. Suggested Next Step

If you want me to proceed, reply with one line like this:

`Approve Android + iOS branding change, keep Maps open, keep IAM open, prepare both platforms`

Then I will make the platform identifier updates and continue the deployment setup.

---

## F. Current Production Status

- Authentication: implemented
- API enabling: done
- Credentials: done
- Android release keystore: done
- Release SHA-1: done
- Android package IDs: pending approval
- iOS bundle IDs: pending approval
- Maps restriction: intentionally open for now
- IAM hardening: intentionally open for now

---

**Note:** This tracker is meant to stay active for follow-up decisions. I will update it as you approve each step.
