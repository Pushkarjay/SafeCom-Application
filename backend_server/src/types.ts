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
