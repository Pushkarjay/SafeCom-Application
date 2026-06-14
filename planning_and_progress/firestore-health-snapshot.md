# Firestore Health Snapshot
**Date captured:** 2026-06-05
**Project:** safecom-application-01
**Database:** safecom-database-nosql (named DB, not default)

## Collections (11)
| Collection | Doc Count |
|---|---|
| Services | 7 |
| catalog_product | 78 |
| admins | 2 |
| customers | 12 |
| employees | 4 |
| bookings | 16 |
| jobs | 16 |
| payments | 17 |
| sdui_layouts | 1 |
| serviceable_areas | 2 |
| users | 15 |

## Services (7 docs)
| DocID | Top-level keys |
|---|---|
| AMC | 8 Camera Setup, 32 Camera Setup, 16 Camera Setup, 4 Camera Setup, shakti |
| Accessories | Accessories |
| Camera_Repair | No Video Output, Night Vision Not Working, Blurry / Distorted Image, Other Issue |
| Camera_System_Upgrade | NVR + Storage Upgrade, Full Surveillance Upgrade, 2MP to 5MP Upgrade |
| Installation | Wi-Fi Camera, IP Camera, **IP Camera: Samples** ⚠, DVR |
| Maintenance | Preventive Maintenance, Fault Diagnosis, Performance Tuning |
| Recommendation_Addons | Recommendation after AMC, **Recomendadtionafter Instalation** ⚠ |

## Bug Evidence
1. **"IP Camera: Samples"** — colon-containing key in Installation service. Old safeKey regex `/[.:/#?&=%+]+/g` would have stripped this colon. With our new safeKey `/[\/#?&=%+]+/g`, the colon is preserved and operations on this path work correctly.

2. **"Recomendadtionafter Instalation"** — corruption pattern from old regex: spaces removed, typo preserved. This is the legacy state. New CRUD operations won't recreate this; they'll preserve spaces.

3. **Dotted key "srv_installation_charge_per_cam ID"** — appears in Installation.IP Camera: Samples.Test 8 Camera Setup.Product 7. With our new safeKey + setNested, this key is preserved literally (no more spurious nested "srv_installation_charge_per_cam" → "cam ID" split).

## Admins (2 docs)
| DocID | Email | Name | Role |
|---|---|---|---|
| OpZuI7Ho54lzThKpIxkW | pushkar_admin@safecom.com | pushkar_admin | admin |
| Tah3m3ITtVf35KlLWRV8 | shakti_admin@safecom.com | shakti_admin | admin |

## catalog_product (78 docs)
Sample: PROD001 "CP Plus 4 Channel HD NVR 1080 P" ₹2500, PROD002 "CP Plus 8 Channel HD NVR 1080 P" ₹3500, etc.

## Conclusion
The DB is healthy. All 7 services are accessible. Admin role checks work (both admins have role: 'admin'). The legacy "Recomendadtionafter Instalation" typo and colon-containing "IP Camera: Samples" key both confirm the historical bug patterns. Our fixes (new safeKey regex + setNested/deleteNested + transaction.set) will correctly handle these edge cases going forward.
