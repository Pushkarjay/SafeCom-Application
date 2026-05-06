# Firestore Database Architecture

## Collections Overview

### PService
Core service engine.
- Documents: installation, maintenance, etc.
- Subcollections: variants, pricingRules, mappedProducts

### Catalog_Product
Master product catalog.
- Documents: ip_camera_2mp, etc.

### Customer_User
User data.
- Documents: uid-based.

### Orders
Customer orders.
- Documents: orderId.

### Other Collections
- Employee_User, Admin_User, Bookings, Configurations, Banners, Offers, Locations, Invoices

## Relationships
- PService -> variants -> mappedProducts -> Catalog_Product
- Orders -> Customer_User
- Bookings -> Orders

## Migration from Nested Structure
Old: P_Service/Installation/DVR Camera/4 Camera Setup/Product 1/...
New: Normalized with mappings.