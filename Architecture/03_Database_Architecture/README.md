# Firestore Database Architecture

## Collection Overview

The system uses Firestore as its primary database with the following active collections:

### Primary Collections

| Collection | Purpose | Document Count |
|------------|---------|-----------------|
| `admins` | Admin user profiles | Low (team size) |
| `customers` | Customer profiles | Medium |
| `employees` | Employee/technician profiles | Low-medium |
| `catalog_product` | Master product catalog | High |
| `Services` | Service configurations (nested tree) | Low |
| `jobs` | Job/work orders | High |
| `bookings` | Customer bookings | High |
| `Invoices` | Invoice documents | Medium |
| `sdui_layouts` | Server-driven UI layouts | Low |

### Legacy/Deleted Collections

- `customer_user` → migrated to `customers`
- `admin_user` → migrated to `admins`
- `employee_user` → migrated to `employees`
- `Banners`, `Bookings`, `Configurations`, `Locations`, `Offers`, `Orders` → deleted

## Document Schema

### admins

```typescript
{
  uid: string;           // Firebase UID
  email: string;
  name: string;
  role: 'admin';
  status: 'active' | 'inactive';
  createdAt: string;      // ISO 8601
  firebaseUid: string;   // Linked Firebase auth ID
}
```

### customers

```typescript
{
  uid: string;           // Firebase UID
  name: string;
  phone: string;
  email: string;
  profileImage?: string;
  defaultLocationId?: string;
  savedLocations: Location[];
  status: 'active' | 'inactive';
  createdAt: string;      // ISO 8601
}
```

### employees

```typescript
{
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave';
  createdAt: string;
}
```

### catalog_product (Master Product)

```typescript
{
  id: string;            // e.g., "PROD001"
  sku: string;
  name: string;
  category: string;      // e.g., "NVR", "Camera", "HDD"
  group: string;
  brand?: string;
  price: number;
  unit: string;
  status: 'active' | 'inactive';
  stockEnabled: boolean;
  visible: boolean;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### jobs

```typescript
{
  jobId: string;         // Custom ID (not Firestore doc ID)
  bookingId: string;
  customerId: string;
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: {
    employeeId: string;
    name: string;
    phone: string;
  };
  location: {
    address: string;
    city: string;
    pincode: string;
  };
  items: JobItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  scheduledDate: string;
  completedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### bookings

```typescript
{
  id: string;
  customerId: string;
  orderId: string;
  serviceId: string;
  variantId?: string;
  locationId: string;
  items: BookingItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  scheduledDate: string;
  createdAt: string;
}
```

### Services (Nested Tree Structure)

```typescript
{
  id: string;            // e.g., "Installation", "AMC", "Repair"
  name: string;
  key: string;
  description?: string;
  icon?: string;
  status: 'active' | 'inactive';
  // Dynamic nested structure:
  // {
  //   "4 Camera Setup": {
  //     "Product 1": {
  //       "Option 1": {
  //         "Price": Firestore DocumentReference,
  //         "Product 1 Option 1 ID": Firestore DocumentReference,
  //         "defaultQty": 4,
  //         "minQty": 1,
  //         "maxQty": 4,
  //         "available": true,
  //         "rigid": false
  //       }
  //     }
  //   }
  // }
}
```

## Collection Relationships

```mermaid
erDiagram
    admins ||--o{ jobs : "assigns"
    customers ||--o{ bookings : "creates"
    customers ||--o{ jobs : "owns"
    employees ||--o{ jobs : "assigned_to"
    catalog_product ||--o{ Services : "referenced_by"
    jobs ||--o| bookings : "linked_to"
    jobs ||--o| Invoices : "generates"
    sdui_layouts ||--o| Services : "displays"
```

## Indexing Strategy

Based on code analysis:
- `jobs` collection has queries on: `jobId`, `status`, `assignedTo.employeeId`, `createdAt`
- `customers` queries on: `firebaseUid`, `email`, `phone`
- `employees` queries on: `uid`, `status`

**Note**: The jobs route uses in-memory filtering (see `backend_server/src/routes/jobs.ts:31-69`) to avoid composite index requirements. This is a performance concern at scale.

## Denormalization Analysis

The system uses limited denormalization:
- `jobs` contains both customerId and location data (potential duplication)
- `bookings` mirrors job data for customer-facing views

**Hot Collections** (high read/write frequency):
1. `jobs` - Constant read/write for job tracking
2. `bookings` - High for customer interactions
3. `catalog_product` - High read for service discovery

## Security Rules

The `firestore.rules` file exists but was not reviewed in detail. Assumed rules:
- Admins: Full read/write access
- Employees: Read jobs, update own assignments
- Customers: Read own bookings/jobs only

## Confidence Level

**High** - Schema inferred from:
- `backend_server/src/types.ts`
- `database-architecture/COLLECTIONS.md`
- `backend_server/src/contracts/canonical_contracts.ts`
- Firestore collection snapshots