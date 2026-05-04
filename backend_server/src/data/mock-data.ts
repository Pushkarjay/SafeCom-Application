import { AuthUser, CatalogProductRecord, CustomerRecord, DashboardMetrics, JobRecord, PaymentRecord, TechnicianRecord } from '../types.js'

export const dashboardMetrics: DashboardMetrics = {
  totalCustomers: 1254,
  activeTechnicians: 47,
  pendingJobs: 23,
  totalRevenue: 4567890,
  completionRate: 94.5,
  avgResponseTime: 2.3
}

export const adminUsers: Array<AuthUser & { password: string }> = [
  {
    id: 'ADMIN001',
    email: 'admin@safecom.com',
    name: 'SafeCom Admin',
    role: 'admin',
    password: 'admin123'
  }
]

export const customers: CustomerRecord[] = [
  {
    id: 'CUST001',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, Mumbai, MH',
    status: 'active',
    totalOrders: 5,
    totalSpent: 45000
  },
  {
    id: 'CUST002',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 43211',
    address: '456 Park Avenue, Delhi, DL',
    status: 'active',
    totalOrders: 3,
    totalSpent: 32000
  },
  {
    id: 'CUST003',
    name: 'Amit Patel',
    email: 'amit@example.com',
    phone: '+91 98765 43212',
    address: '789 Business Park, Bangalore, KA',
    status: 'active',
    totalOrders: 8,
    totalSpent: 78000
  }
]

export const technicians: TechnicianRecord[] = [
  {
    id: 'TECH001',
    name: 'Vikram Singh',
    email: 'vikram@safecom.com',
    phone: '+91 98765 43220',
    location: 'Mumbai',
    skills: ['installation', 'maintenance', 'repair'],
    totalJobs: 156,
    rating: 4.8,
    status: 'available'
  },
  {
    id: 'TECH002',
    name: 'Deepak Verma',
    email: 'deepak@safecom.com',
    phone: '+91 98765 43221',
    location: 'Delhi',
    skills: ['maintenance', 'upgrade', 'accessories'],
    totalJobs: 98,
    rating: 4.6,
    status: 'on-job'
  },
  {
    id: 'TECH003',
    name: 'Suresh Kumar',
    email: 'suresh@safecom.com',
    phone: '+91 98765 43222',
    location: 'Bangalore',
    skills: ['installation', 'repair', 'upgrade'],
    totalJobs: 203,
    rating: 4.9,
    status: 'available'
  }
]

export const jobs: JobRecord[] = [
  {
    id: 'JOB001',
    customerId: 'CUST001',
    technicianId: 'TECH001',
    serviceType: 'installation',
    status: 'completed',
    amount: 15000,
    scheduledDate: '2024-04-15',
    completedDate: '2024-04-15',
    notes: 'System installed successfully'
  },
  {
    id: 'JOB002',
    customerId: 'CUST002',
    technicianId: 'TECH002',
    serviceType: 'maintenance',
    status: 'in-progress',
    amount: 5000,
    scheduledDate: '2024-04-20',
    completedDate: null,
    notes: 'Regular maintenance'
  },
  {
    id: 'JOB003',
    customerId: 'CUST003',
    technicianId: null,
    serviceType: 'repair',
    status: 'pending',
    amount: 8000,
    scheduledDate: '2024-04-22',
    completedDate: null,
    notes: 'Camera module replacement needed'
  }
]

export const payments: PaymentRecord[] = [
  {
    id: 'PAY001',
    jobId: 'JOB001',
    customerId: 'CUST001',
    amount: 15000,
    status: 'completed',
    paymentMethod: 'card',
    timestamp: '2024-04-15T14:30:00'
  },
  {
    id: 'PAY002',
    jobId: 'JOB002',
    customerId: 'CUST002',
    amount: 5000,
    status: 'pending',
    paymentMethod: 'upi',
    timestamp: '2024-04-20T10:00:00'
  }
]

export const catalogPackages = [
  { id: 'PKG001', name: 'Starter CCTV 4CH', description: 'Basic 4-channel system with 2MP cameras', productIds: ['PROD001', 'PROD003'], totalPrice: 12000, discountPercent: 10, finalPrice: 10800, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'PKG002', name: 'Professional CCTV 8CH', description: 'Professional 8-channel system with 5MP cameras', productIds: ['PROD002', 'PROD004'], totalPrice: 18000, discountPercent: 15, finalPrice: 15300, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'PKG003', name: 'Enterprise CCTV 16CH', description: 'Enterprise solution with high-res cameras and storage', productIds: ['PROD002', 'PROD004', 'PROD005'], totalPrice: 28000, discountPercent: 20, finalPrice: 22400, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' }
]

export const catalogAddons = [
  { id: 'ADD001', name: 'Additional 2MP Camera', description: 'Extra 2MP IP camera for expansion', category: 'Cameras', price: 1800, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'ADD002', name: 'Additional 5MP Camera', description: 'Extra 5MP IP camera for expansion', category: 'Cameras', price: 2800, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'ADD003', name: 'Extra Hard Disk 2TB', description: 'Additional storage for longer retention', category: 'Storage', price: 4800, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'ADD004', name: 'Backup Power Supply UPS', description: '2KVA UPS for system backup', category: 'Power', price: 5999, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'ADD005', name: 'Monitor 24" Full HD', description: 'Professional grade monitoring display', category: 'Display', price: 8999, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' }
]

export const catalogTaxes = [
  { id: 'TAX001', name: 'GST 5%', description: 'Goods and Services Tax - Electronics', rate: 5, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'TAX002', name: 'GST 12%', description: 'Goods and Services Tax - Services', rate: 12, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'TAX003', name: 'GST 18%', description: 'Goods and Services Tax - Premium Services', rate: 18, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' }
]

export const catalogRecommendations = [
  { id: 'REC001', name: 'Best for Small Shops', description: 'Recommended package for small retail businesses', productIds: ['PROD001', 'PROD003'], priority: 1, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'REC002', name: 'Best for Medium Offices', description: 'Recommended package for medium-sized offices', productIds: ['PROD002', 'PROD004', 'PROD005'], priority: 2, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'REC003', name: 'Best for Large Enterprises', description: 'Recommended package for large enterprises', productIds: ['PROD002', 'PROD004', 'PROD005', 'PROD006'], priority: 3, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' }
]

export const catalogInvoices = [
  { id: 'INV001', name: 'Standard Invoice', description: 'Standard invoice template for products and services', terms: 'Net 30', notes: 'Thank you for your business', showTax: true, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'INV002', name: 'Service Invoice', description: 'Invoice template for maintenance and repair services', terms: 'Net 15', notes: 'Service warranty 1 year', showTax: true, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' },
  { id: 'INV003', name: 'Installation Invoice', description: 'Invoice template for installation jobs', terms: 'Due on completion', notes: 'Final invoice after site inspection', showTax: true, status: 'active', updatedAt: '2026-05-02T19:22:10.681Z' }
]

export const catalogProducts: CatalogProductRecord[] = [
  {
    id: 'PROD001',
    name: 'NVR Setup Box (4 Channel)',
    category: 'Recording',
    group: 'Package Base',
    unit: 'unit',
    price: 4000,
    status: 'active',
    updatedAt: '2026-04-20'
  },
  {
    id: 'PROD002',
    name: 'NVR Setup Box (8 Channel)',
    category: 'Recording',
    group: 'Package Base',
    unit: 'unit',
    price: 6500,
    status: 'active',
    updatedAt: '2026-04-18'
  },
  {
    id: 'PROD003',
    name: 'IP Camera 2MP',
    category: 'Cameras',
    group: 'Core',
    unit: 'unit',
    price: 1800,
    status: 'active',
    updatedAt: '2026-04-16'
  },
  {
    id: 'PROD004',
    name: 'IP Camera 5MP',
    category: 'Cameras',
    group: 'Core',
    unit: 'unit',
    price: 2800,
    status: 'active',
    updatedAt: '2026-04-16'
  },
  {
    id: 'PROD005',
    name: 'Hard Disk 1TB',
    category: 'Storage',
    group: 'Core',
    unit: 'unit',
    price: 3200,
    status: 'active',
    updatedAt: '2026-04-15'
  },
  {
    id: 'PROD006',
    name: 'Hard Disk 2TB',
    category: 'Storage',
    group: 'Core',
    unit: 'unit',
    price: 5200,
    status: 'active',
    updatedAt: '2026-04-15'
  },
  {
    id: 'PROD007',
    name: 'Cable (per meter)',
    category: 'Wiring',
    group: 'Installation',
    unit: 'meter',
    price: 40,
    status: 'active',
    updatedAt: '2026-04-14'
  },
  {
    id: 'PROD008',
    name: 'Junction Box',
    category: 'Accessories',
    group: 'Recommendations',
    unit: 'unit',
    price: 150,
    status: 'active',
    updatedAt: '2026-04-12'
  },
  {
    id: 'PROD009',
    name: 'POE Switch',
    category: 'Accessories',
    group: 'Recommendations',
    unit: 'unit',
    price: 500,
    status: 'active',
    updatedAt: '2026-04-12'
  }
]
