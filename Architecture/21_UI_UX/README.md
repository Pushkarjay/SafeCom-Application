# SafeCom UI/UX Documentation (21_UI_UX)

> Added **2026-08-09** as part of the architecture audit (2026-05-09 → 2026-08-09).
> Documents the user-facing surfaces of every SafeCom client, their screen
> inventories, navigation flows, and interaction patterns, with diagrams.

## Overview

SafeCom ships **four user-facing surfaces** plus a shared design language:

| # | Surface | Platform | Stack | Sub-doc |
|---|---------|----------|-------|---------|
| 1 | **Customer App** | Android (Play Store: internal/alpha/production) | Flutter 1.3.9+38 | [1_CUSTOMER_APP](./1_CUSTOMER_APP/README.md) |
| 2 | **Employee App** | Android (Play Store: internal/alpha) | Flutter 1.1.3+29 | [2_EMPLOYEE_APP](./2_EMPLOYEE_APP/README.md) |
| 3 | **Admin Web App** | Web (Firebase Hosting) | React + Vite + TS | [3_ADMIN_WEB_APP](./3_ADMIN_WEB_APP/README.md) |
| 4 | **Customer Landing** | Web (Firebase Hosting) | Static HTML/CSS | [4_CUSTOMER_LANDING](./4_CUSTOMER_LANDING/README.md) |
| 5 | **Shared Design System** | Cross-app tokens | Amber/slate palette | [5_SHARED_DESIGN_SYSTEM](./5_SHARED_DESIGN_SYSTEM/README.md) |

## Key UX Principles (established 2026-05 → 2026-08)

1. **Guest-first browsing** — the customer can discover services, build
   estimates, and schedule without an account; login is only required at
   payment/confirmation and for profile surfaces.
2. **Server-driven UI (SDUI)** — home layout, promo banners, and even service
   screens are driven by backend config (`sdui_layouts`, `home_cms`,
   `sdui_feature_flags`), so content changes ship without an app update.
3. **One dynamic service screen** — a single renderer draws any admin-built
   service tree (categories → setups → products → options/branches) with
   quantity steppers, clubbed-product selectors, and dependency-driven
   quantities.
4. **Warm, premium light theme** — warm amber (`#D4760A`) accents on a warm
   stone/ink palette; the admin dashboard uses a dark command-center aesthetic.
5. **Consistent money math** — every screen shows the same invoice math
   (GST-inclusive totals, booking advance included, remaining = total − advance).
6. **Message box everywhere** — a universal "Add Instructions / Request" field
   on the cart that flows to payment → confirmation → booking → job (employee
   app) → admin dashboard.

## Diagram Legend

- `[Screen]` — a route/screen in the app
- `{Decision}` — a user or app decision point
- `(External)` — external system (Razorpay, Firebase, Google Maps)

## Surface Map

```mermaid
flowchart LR
    subgraph Customer["Customer App (Flutter)"]
        CH[Home / SDUI] --> CS[Services & Estimates]
        CS --> CB[Cart + Message]
        CB --> CSch[Scheduling]
        CSch --> CR[Recommendations]
        CR --> CP[Payment]
        CP --> CC[Confirmation]
        CH --> CPr[Profile / Orders / Addresses]
    end

    subgraph Employee["Employee App (Flutter)"]
        EH[Jobs Home] --> ED[Job Detail]
        ED --> EW[Work Completion]
        EH --> EM[Map / Location]
        EH --> EE[Earnings]
        EH --> EP[Profile]
    end

    subgraph Admin["Admin Web (React)"]
        AD[Dashboard] --> AJ[Jobs + Invoice PDF]
        AJ --> AC[Customers / Technicians]
        AD --> AT[Service Tree Builder]
        AT --> AI[Installation Builder]
        AD --> AP[Payments]
        AD --> AS[Serviceable Areas]
        AD --> AM[Mobile Preview / CMS]
    end

    Customer -->|REST API + SDUI| B[(Backend + Firestore)]
    Employee -->|REST API + FCM| B
    Admin -->|REST API (admin JWT)| B
    Customer -->|Razorpay SDK| RZ[(Razorpay)]
```

## Related Architecture Docs

- High-level system view: [`../01_High_Level_Architecture`](../01_High_Level_Architecture/README.md)
- Navigation & routes: [`../05_Mobile_Navigation`](../05_Mobile_Navigation/README.md)
- What changed since May: [`../AUDIT_DELTA_2026_05_09_to_2026_08_09.md`](../AUDIT_DELTA_2026_05_09_to_2026_08_09.md)

---

*Last updated: 2026-08-09 (audit session)*
