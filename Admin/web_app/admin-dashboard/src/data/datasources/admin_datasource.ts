import { DashboardMetrics, Customer, Technician, Job, Payment } from '../models/admin_models'

const API_DELAY = 500 // Mock API delay in ms

export class AdminDatasource {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await this.delay(API_DELAY)
    return {
      totalCustomers: 1254,
      activeTechnicians: 47,
      pendingJobs: 23,
      totalRevenue: 4567890,
      completionRate: 94.5,
      avgResponseTime: 2.3
    }
  }

  async getCustomers(page: number = 1, limit: number = 10): Promise<Customer[]> {
    await this.delay(API_DELAY)
    const customers: Customer[] = [
      {
        id: 'CUST001',
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+91 98765 43210',
        address: '123 Main Street, Mumbai, MH',
        registeredDate: '2024-01-15',
        totalOrders: 5,
        totalSpent: 45000,
        status: 'active'
      },
      {
        id: 'CUST002',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 98765 43211',
        address: '456 Park Avenue, Delhi, DL',
        registeredDate: '2024-02-20',
        totalOrders: 3,
        totalSpent: 32000,
        status: 'active'
      },
      {
        id: 'CUST003',
        name: 'Amit Patel',
        email: 'amit@example.com',
        phone: '+91 98765 43212',
        address: '789 Business Park, Bangalore, KA',
        registeredDate: '2024-03-10',
        totalOrders: 8,
        totalSpent: 78000,
        status: 'active'
      }
    ]
    return customers.slice((page - 1) * limit, page * limit)
  }

  async getTechnicians(page: number = 1, limit: number = 10): Promise<Technician[]> {
    await this.delay(API_DELAY)
    const technicians: Technician[] = [
      {
        id: 'TECH001',
        name: 'Vikram Singh',
        email: 'vikram@safecom.com',
        phone: '+91 98765 43220',
        skills: ['installation', 'maintenance', 'repair'],
        location: 'Mumbai',
        totalJobs: 156,
        rating: 4.8,
        status: 'available',
        joiningDate: '2023-06-15'
      },
      {
        id: 'TECH002',
        name: 'Deepak Verma',
        email: 'deepak@safecom.com',
        phone: '+91 98765 43221',
        skills: ['maintenance', 'upgrade', 'accessories'],
        location: 'Delhi',
        totalJobs: 98,
        rating: 4.6,
        status: 'on-job',
        joiningDate: '2023-08-22'
      },
      {
        id: 'TECH003',
        name: 'Suresh Kumar',
        email: 'suresh@safecom.com',
        phone: '+91 98765 43222',
        skills: ['installation', 'repair', 'upgrade'],
        location: 'Bangalore',
        totalJobs: 203,
        rating: 4.9,
        status: 'available',
        joiningDate: '2023-01-10'
      }
    ]
    return technicians.slice((page - 1) * limit, page * limit)
  }

  async getJobs(page: number = 1, limit: number = 10): Promise<Job[]> {
    await this.delay(API_DELAY)
    const jobs: Job[] = [
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
    return jobs.slice((page - 1) * limit, page * limit)
  }

  async getPayments(page: number = 1, limit: number = 10): Promise<Payment[]> {
    await this.delay(API_DELAY)
    const payments: Payment[] = [
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
    return payments.slice((page - 1) * limit, page * limit)
  }
}

export const adminDatasource = new AdminDatasource()
