# CUSTOMER LANDING PAGE - COMPLETE FUNCTION AUDIT

**Date:** 2026-06-14
**Scope:** Every page and behavior of the customer-facing marketing website

---

## TABLE OF CONTENTS

1. [Main Landing Page](#1-main-landing-page)
2. [Service Offerings](#2-service-offerings)
3. [How It Works](#3-how-it-works)
4. [App Download Section](#4-app-download-section)
5. [FAQ Section](#5-faq-section)
6. [Testimonials](#6-testimonials)
7. [Footer](#7-footer)
8. [Privacy Policy Page](#8-privacy-policy-page)
9. [Terms of Service Page](#9-terms-of-service-page)
10. [Refund Policy Page](#10-refund-policy-page)
11. [Contact Page](#11-contact-page)
12. [Data Collection Page](#12-data-collection-page)
13. [Account Deletion Page](#13-account-deletion-page)
14. [Block Diagrams](#14-block-diagrams)
15. [Known Issues and Fixes Required](#15-known-issues-and-fixes-required)

---

## 1. MAIN LANDING PAGE

### File: index.html
- **Tech:** Static HTML5 + CSS3 (no JS framework)
- **Fonts:** Playfair Display + Plus Jakarta Sans - Google Fonts
- **Design:** Modern, responsive, mobile-first with CSS Grid + Flexbox

### Hero Section
- **Headline:** Professional CCTV Installation and Security Solutions
- **Subheadline:** Secure your home and business with expert installation, maintenance, and repair services
- **CTA Button:** Get Started - scrolls to service offerings
- **Background:** Gradient overlay on hero image
- **Animation:** Fade-in on load

### Navigation
- **Sticky navbar** with transparent-to-solid scroll transition
- **Links:** Home, Services, How It Works, FAQ, Contact
- **Mobile:** Hamburger menu with slide-out drawer
- **CTA:** Download App button

---

## 2. SERVICE OFFERINGS

### Section: Our Services
- **Layout:** 3-column grid (responsive: 1 col on mobile)
- **Cards:** 6 service cards: Installation, Maintenance, AMC, Repair, Upgrades, Accessories
- **Card Structure:** Icon circle, service name, short description, Learn More link
- **Interactive:** Hover lift effect (CSS transform + shadow), tap expand on mobile

---

## 3. HOW IT WORKS

### 4-Step Horizontal Timeline
1. Browse Services - Explore catalog of services and products
2. Customize and Book - Select items, customize quantities, book a slot
3. Expert Arrives - Technician arrives at your location
4. Job Complete - Work completed, customer satisfied

### Visual Design
- Horizontal connecting line between steps
- Each step: numbered circle + title + description
- Stacks vertically on mobile

---

## 4. APP DOWNLOAD SECTION

### Section: Download Our App
- Promotes mobile app for easy booking
- Buttons: Google Play Store badge, Apple App Store badge
- Phone mockup showing app home screen
- QR Code for direct download link

---

## 5. FAQ SECTION

### Section: Frequently Asked Questions
- **Format:** Accordion - click to expand/collapse
- **Questions:** What areas do you serve?, How long does installation take?, Do you provide warranty?, Can I reschedule?, What payment methods?, Is AMC mandatory?
- **Behavior:** Single expand at a time, smooth height transition, Schema.org markup

---

## 6. TESTIMONIALS

### Section: What Our Customers Say
- **Format:** Horizontal carousel with dot navigation
- **Card:** Customer photo, name, star rating, review text
- **Auto-scroll:** Every 5 seconds
- **Manual:** Left/right arrows, swipe on mobile

---

## 7. FOOTER

- **Company Info:** Logo, description, social media links
- **Quick Links:** Services, About, FAQ, Contact
- **Legal:** Privacy Policy, Terms of Service, Refund Policy
- **Contact:** Email, phone, address
- **Copyright:** Copyright 2026 SafeCom. All rights reserved.

---

## 8. PRIVACY POLICY PAGE (privacy-policy.html)

- Information collection (name, email, phone, location)
- How information is used (delivery, communication, improvement)
- Data sharing (third-party services, legal requirements)
- Data retention policy
- User rights (access, correction, deletion)
- Security measures (encryption, access controls)
- Links to POST /api/users/link for consent

---

## 9. TERMS OF SERVICE PAGE (terms-of-service.html)

- Service description (CCTV installation, maintenance, repair)
- User obligations (accurate info, lawful use)
- Booking and cancellation terms
- Payment terms
- Warranty and liability
- Governing law

---

## 10. REFUND POLICY PAGE (refund-policy.html)

- Cancellation window (24 hours before scheduled service)
- Partial refund for cancellations within 24 hours
- Service not completed: full refund
- Warranty claims process
- Chargeback handling

---

## 11. CONTACT PAGE (contact.html)

- Contact form: Name, Email, Phone, Subject, Message
- Phone number (click-to-call)
- Email address (mailto link)
- Office address with Google Maps embed
- Business hours
- **Issue:** No backend handler - submissions go nowhere

---

## 12. DATA COLLECTION PAGE (data-collection.html)

- Types of data collected (personal, device, location, usage)
- Purpose of collection and processing methods
- Third-party services (Firebase, Razorpay, Google Maps)
- Opt-out options

---

## 13. ACCOUNT DELETION PAGE (account-deletion.html)

- Instructions for account deletion via email
- Deletion timeline (30 days)
- Data retained after deletion (legal obligations)
- Re-activation option within 30 days
- Links to userService.ts deleteFirestoreUser

---

## 14. BLOCK DIAGRAMS

### Landing to App Download
`
Landing Page -> Services / Download App / FAQ / Contact / Legal
`

### Landing to Booking (via App)
`
Landing -> Download App -> Open App -> Browse -> Customize -> Book -> Payment -> Service Complete
`

---

## 15. KNOWN ISSUES AND FIXES REQUIRED

### Issue 1: No Contact Form Backend
- Contact form submissions go nowhere
- Fix: Implement POST /api/contact endpoint

### Issue 2: No Analytics
- No tracking scripts on landing page
- Fix: Add Google Analytics 4 for conversion tracking

### Issue 3: No SEO Meta Tags
- Missing Open Graph and Twitter card tags
- Fix: Add OG meta tags for social sharing preview

### Issue 4: No SSL Enforcement
- No HTTP to HTTPS redirect configured
- Fix: Configure redirect rules in firebase.json

### Issue 5: No FAQ Schema
- No JSON-LD structured data for FAQ
- Fix: Add FAQ schema markup

### Issue 6: Testimonials Hardcoded
- Testimonials in HTML, not CMS-managed
- Fix: Load from Firestore home_cms collection

### Issue 7: No Cookie Consent Banner
- No GDPR cookie notice
- Fix: Add cookie consent banner

### Issue 8: Page Load Performance
- Fonts and images loaded synchronously
- Fix: Preload fonts, lazy-load images, inline critical CSS

---

**END OF AUDIT**