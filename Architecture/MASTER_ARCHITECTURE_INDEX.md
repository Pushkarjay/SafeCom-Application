# SafeCom Architecture Encyclopedia

## Executive Summary

SafeCom is a comprehensive CCTV installation and maintenance service platform consisting of:
- **Customer Mobile App** (Flutter 1.3.9+38) - Service discovery, booking, payments
- **Employee Mobile App** (Flutter 1.1.3+29) - Job management, earnings, location
- **Admin Web Dashboard** (React + Vite) - Orchestration, analytics, catalog management
- **Backend Server** (Express + TypeScript) - REST API, Firebase integration
- **Firestore Database** - NoSQL data store with real-time capabilities
- **Customer Landing** (static) - Marketing + legal/Play-Store policy pages

> 📌 **Audit Delta (2026-05-09 → 2026-08-09):** the architecture documentation was
> regenerated on 2026-05-09 and the platform has since shipped 220+ commits. See
> **[AUDIT_DELTA_2026_05_09_to_2026_08_09.md](./AUDIT_DELTA_2026_05_09_to_2026_08_09.md)**
> for the full change record, and **[21_UI_UX](./21_UI_UX/README.md)** for the new
> UI/UX documentation.

## Navigation

### Quick Links

| Section | Description | Location |
|---------|-------------|----------|
| High-Level Architecture | System overview, tech stack | [01_High_Level_Architecture](./01_High_Level_Architecture/README.md) |
| Component Diagrams | App architecture, interactions | [02_Component_Diagrams](./02_Component_Diagrams/README.md) |
| Database Architecture | Firestore schemas, collections | [03_Database_Architecture/README.md](./03_Database_Architecture/README.md) |
| API Flows | Request lifecycle, endpoints | [04_API_Flows](./04_API_Flows/README.md) |
| Mobile Navigation | Route structures, guards | [05_Mobile_Navigation](./05_Mobile_Navigation/README.md) |
| Service Boundaries | Domain modules, ownership | [07_Service_Boundaries](./07_Service_Boundaries/README.md) |
| Authentication | Auth flow, RBAC, tokens | [10_Authentication_Flow](./10_Authentication_Flow/README.md) |
| State Management | Provider patterns, data flow | [12_State_Management](./12_State_Management/README.md) |
| Firestore Analysis | Collections, indexes, patterns | [13_Firestore_Analysis](./13_Firestore_Analysis/README.md) |
| Security Analysis | Security review, recommendations | [14_Security_Analysis](./14_Security_Analysis/README.md) |
| Performance Bottlenecks | Performance issues identified | [15_Performance_Bottlenecks](./15_Performance_Bottlenecks/README.md) |
| Refactoring Recommendations | Proposed improvements | [16_Recommended_Refactors](./16_Recommended_Refactors/README.md) |
| Microservice Architecture | Future architecture suggestions | [08_Microservice_Suggestions](./08_Microservice_Suggestions/README.md) |
| UI/UX Documentation | Screens, flows & design system per app | [21_UI_UX](./21_UI_UX/README.md) |
| Audit Delta | What changed 2026-05-09 → 2026-08-09 | [AUDIT_DELTA](./AUDIT_DELTA_2026_05_09_to_2026_08_09.md) |

## Architecture Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Modularity** | 7/10 | Clear separation, but monolithic backend |
| **Scalability** | 6/10 | Firestore scales well, but query patterns don't |
| **Security** | 7/10 | Firebase Auth secure, but some gaps |
| **Maintainability** | 7/10 | TypeScript helps, but some duplication |
| **Performance** | 5/10 | Several bottlenecks identified |
| **Testability** | 6/10 | No tests visible in codebase |
| **Reliability** | 7/10 | Firebase handles reliability well |

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
├─────────────────────────────────────────────────────┤
│  Customer App    │ Employee App    │ Admin Web      │
│  ─────────────   │ ─────────────   │ ──────────     │
│  Flutter/Dart    │ Flutter/Dart    │ React/Vite     │
│  Riverpod        │ Riverpod        │ TypeScript     │
│  GoRouter        │ GoRouter        │ React Router   │
│  v1.3.9+38       │ v1.1.3+29       │ Firebase Host  │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                     BACKEND                           │
├─────────────────────────────────────────────────────┤
│  Express.js + TypeScript + Firebase Admin SDK        │
│  25 Route Files │ 8 Services │ 2 Middleware         │
│  Cloud Run: asia-south1 + us-central1               │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                    DATA LAYER                         │
├─────────────────────────────────────────────────────┤
│  Firestore (NoSQL) │ Firebase Auth │ Cloud Storage │
│  DB: safecom-    │ 3 User Types  │               │
│  database-nosql   │               │               │
└─────────────────────────────────────────────────────┘
```

## Key Findings

### Strengths
1. Clear component separation (4 apps + landing + backend)
2. Strong typing with TypeScript
3. Firebase integration provides scalability
4. SDUI + dynamic service tree pattern for flexible catalog
5. Clean route organization in backend (25 route files, domain-grouped)
6. Guest-first architecture — browsing without login
7. Full CI/CD: quality gates, Cloud Run deploy, Play Store multi-track rollout
8. Unit tests now present (booking-model, backup-config) with CI enforcement

### Weaknesses
1. Monolithic backend (single point of failure)
2. In-memory filtering for queries (scaling issue)
3. No pagination implementation
4. No rate limiting
5. Code duplication between mobile apps
6. No real-time listeners utilized
7. No caching layer
8. `firestore.rules` stale — still references legacy collection names

### Opportunities
1. Implement pagination + indexing
2. Add Redis cache for catalog
3. Extract shared Flutter package
4. Add Firestore real-time listeners
5. Implement rate limiting
6. Consider microservice migration
7. Reconcile `firestore.rules` + `firestore.indexes.json` with the current collection set

## File Locations

### Source Code
- **Customer App**: `mobile_customer/lib/` (v1.3.9+38)
- **Employee App**: `mobile_employee/lib/` (v1.1.3+29)
- **Admin Web**: `Admin/web_app/admin-dashboard/src/`
- **Backend**: `backend_server/src/`
- **Customer Landing**: `customer_landing/`

### Documentation
- **SRS Docs**: `docs/`
- **Architecture**: `Architecture/` (this folder)
- **Database Design**: `database-architecture/`
- **Firestore Analysis**: `firestore-analysis/`
- **Progress Log**: `planning_and_progress/progress_log.md`

## Confidence Level

**High** - Analysis based on inspection of 80+ source files with consistent patterns verified across all components.

---

*Last Updated: 2026-08-09 (audit delta: 2026-05-09 → 2026-08-09)*
*Generated by: Repository Intelligence Agent*