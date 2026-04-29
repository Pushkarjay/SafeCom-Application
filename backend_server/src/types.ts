export type Role = 'admin' | 'customer' | 'employee'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface DashboardMetrics {
  totalCustomers: number
  activeTechnicians: number
  pendingJobs: number
  totalRevenue: number
  completionRate: number
  avgResponseTime: number
}

export interface CustomerRecord {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive'
  totalOrders: number
  totalSpent: number
}

export interface TechnicianRecord {
  id: string
  name: string
  email: string
  phone: string
  location: string
  skills: string[]
  totalJobs: number
  rating: number
  status: 'available' | 'on-job' | 'inactive'
}

export interface JobRecord {
  id: string
  customerId: string
  technicianId: string | null
  serviceType: 'installation' | 'maintenance' | 'amc' | 'repair' | 'upgrade' | 'accessories'
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  amount: number
  scheduledDate: string
  completedDate: string | null
  notes: string
}

export interface PaymentRecord {
  id: string
  jobId: string
  customerId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  paymentMethod: 'card' | 'cash' | 'upi' | 'bank'
  timestamp: string
}

export interface CatalogProductRecord {
  id: string
  name: string
  category: string
  group: string
  unit: string
  price: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogPackageRecord {
  id: string
  name: string
  description: string
  productIds: string[]
  totalPrice: number
  discountPercent: number
  finalPrice: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogAddonRecord {
  id: string
  name: string
  description: string
  category: string
  price: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogTaxRecord {
  id: string
  name: string
  description: string
  rate: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface CatalogRecommendationRecord {
  id: string
  name: string
  description: string
  productIds: string[]
  priority: number
  status: 'active' | 'inactive'
  updatedAt: string
}

export interface InvoiceTemplateRecord {
  id: string
  name: string
  description: string
  terms: string
  notes: string
  showTax: boolean
  status: 'active' | 'inactive'
  updatedAt: string
}
