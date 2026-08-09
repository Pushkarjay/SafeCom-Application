# SafeCom Architecture Documentation

## Navigation

Start with **[MASTER_ARCHITECTURE_INDEX.md](./MASTER_ARCHITECTURE_INDEX.md)** for a complete clickable index of all documentation.

For a quick overview, see **[ARCHITECTURE_SUMMARY.md](./20_Architecture_Report/README.md)**.

> 📌 **Recent**: the documentation was regenerated on 2026-05-09; the platform has
> since shipped 220+ commits. See **[AUDIT_DELTA_2026_05_09_to_2026_08_09.md](./AUDIT_DELTA_2026_05_09_to_2026_08_09.md)**
> for everything that changed, and **[21_UI_UX](./21_UI_UX/README.md)** for the new
> per-app UI/UX documentation.

## Available Documentation

### Core Architecture
- [High-Level Architecture](./01_High_Level_Architecture/README.md) - System overview
- [Component Diagrams](./02_Component_Diagrams/README.md) - App architecture
- [Database Architecture](./03_Database_Architecture/README.md) - Firestore schema

### API & Integration
- [API Flows](./04_API_Flows/README.md) - Request lifecycle
- [Authentication Flow](./10_Authentication_Flow/README.md) - Auth architecture

### Mobile Apps
- [Mobile Navigation](./05_Mobile_Navigation/README.md) - Route structures
- [State Management](./12_State_Management/README.md) - Provider patterns

### Backend
- [Service Boundaries](./07_Service_Boundaries/README.md) - Domain modules
- [Runtime Execution Flow](./11_Runtime_Execution_Flow/README.md) - Server startup
- [Dependency Graphs](./06_Dependency_Graphs/README.md) - Module dependencies
- [Sequence Diagrams](./18_Sequence_Diagrams/README.md) - API sequences
- [Data Flow Diagrams](./19_Data_Flow_Diagrams/README.md) - Data movement

### Analysis & Recommendations
- [Firestore Analysis](./13_Firestore_Analysis/README.md) - DB patterns
- [Security Analysis](./14_Security_Analysis/README.md) - Security review
- [Performance Bottlenecks](./15_Performance_Bottlenecks/README.md) - Issues
- [Recommended Refactors](./16_Recommended_Refactors/README.md) - Improvements
- [Event Flows](./09_Event_Flows/README.md) - Notification system
- [Shared Modules](./17_Shared_Modules/README.md) - Code duplication
- [Microservice Suggestions](./08_Microservice_Suggestions/README.md) - Future architecture

### UI/UX
- [UI/UX Documentation](./21_UI_UX/README.md) - Screens, flows & design system per app

### Audit
- [Audit Delta 2026-05-09 → 2026-08-09](./AUDIT_DELTA_2026_05_09_to_2026_08_09.md) - What changed

## Quick Stats

| Metric | Value |
|--------|-------|
| Components | 4 (Customer App, Employee App, Admin Web, Backend) + Landing |
| Routes | 25 API route files |
| Collections | 15 active Firestore collections |
| Documentation Files | 100+ (across all directories) |
| Architecture Score | 7/10 |
| Customer App | 1.3.9+38 (Play Store: internal/alpha/production) |
| Employee App | 1.1.3+29 (Play Store: internal/alpha) |
| Backend | Cloud Run, dual-region (asia-south1 + us-central1) |

## Key Findings Summary

### Strengths
- Clear component separation
- Firebase integration for scalability
- SDUI + dynamic service tree for flexible catalog
- Guest-first browsing; full CI/CD; Play Store rollout automation

### Areas to Improve
- Add pagination (missing)
- Fix jobs query (in-memory filtering)
- Add caching layer
- Extract shared code to packages
- Add rate limiting
- Reconcile `firestore.rules` with current collections

---

*Generated: 2026-05-09 · Updated: 2026-08-09 (audit delta appended)*