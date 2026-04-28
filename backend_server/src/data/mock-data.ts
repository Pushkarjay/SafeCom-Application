import { AuthUser, CustomerRecord, DashboardMetrics, JobRecord, PaymentRecord, TechnicianRecord } from '../types.js'

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
