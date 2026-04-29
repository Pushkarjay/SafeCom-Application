export interface DashboardMetrics {
  totalCustomers: number
  activeTechnicians: number
  pendingJobs: number
  totalRevenue: number
  completionRate: number
  avgResponseTime: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  registeredDate: string
  totalOrders: number
  totalSpent: number
  status: 'active' | 'inactive'
}

export interface Technician {
  id: string
  name: string
  email: string
  phone: string
  skills: string[]
  location: string
  totalJobs: number
  rating: number
  status: 'available' | 'on-job' | 'inactive'
  joiningDate: string
}

export interface Job {
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

export interface Payment {
  id: string
  jobId: string
  customerId: string
  customerName: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: 'pending' | 'partial' | 'completed' | 'failed'
  paymentMethod: string
  transactionId: string
  createdAt: string
  updatedAt: string
}
