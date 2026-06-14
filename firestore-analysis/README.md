# Firestore Analysis

Analyzed Firestore collections and data structures for the SafeCom platform.

## Current Structure

- **Active Collections:** 12
  - `admins` — Admin user profiles
  - `customers` — Customer profiles
  - `employees` — Employee/technician profiles
  - `catalog_product` — Master product catalog (76+ products)
  - `Services` — Service configurations with recursive nested tree (Installation, AMC, Repair, Upgrade, Accessories, Maintenance, Recommendations)
  - `jobs` — Job/work orders
  - `bookings` — Customer bookings
  - `Invoices` — Invoice documents
  - `sdui_layouts` — Server-driven UI layout configurations
  - `Orders` — Order records
  - `Offers` — Promotional offers
  - `Banners` — Dynamic banner content

- **Analyzed Collections:** 17 (includes legacy/deleted)
- **Legacy Collections Deleted:** Bookings, users, Banners, Configurations, Locations

## Detailed Schemas

See `collections.json` for complete field-level schemas with sample data.
See `pservice-analysis.json` for PService-to-product mapping analysis.
See `../database-architecture/COLLECTIONS.md` for documentation reference.
