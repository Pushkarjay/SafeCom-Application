import { DashboardMetrics, Customer, Technician, Job, Payment } from '../models/admin_models'
import { useAuthStore } from '../auth.store'

const API_DELAY = 100 // small UX delay when mocking; kept low when using real API
const BASE_URL = 'http://localhost:4000/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('safecom_admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class AdminDatasource {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  private async fetchJson<T>(url: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...authHeaders() }
    if (opts.headers) {
      Object.assign(headers, opts.headers as Record<string, string>)
    }
    const res = await fetch(url, { ...opts, headers })
    if (!res.ok) {
      const text = await res.text()
      if (res.status === 401) {
        useAuthStore.getState().logout()
      }
      throw new Error(`API error ${res.status}: ${text}`)
    }
    return res.json()
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      return await this.fetchJson<DashboardMetrics>(`${BASE_URL}/dashboard/metrics`)
    } catch (e) {
      // fallback to a small mocked payload if backend unavailable
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
  }

  async getCustomers(page: number = 1, limit: number = 10): Promise<Customer[]> {
    try {
      return await this.fetchJson<Customer[]>(`${BASE_URL}/customers?page=${page}&limit=${limit}`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async getTechnicians(page: number = 1, limit: number = 10): Promise<Technician[]> {
    try {
      return await this.fetchJson<Technician[]>(`${BASE_URL}/technicians?page=${page}&limit=${limit}`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async getJobs(status: string | null = null, page: number = 1, limit: number = 10): Promise<Job[]> {
    try {
      const url = new URL(`${BASE_URL}/jobs`)
      if (status) url.searchParams.set('status', status)
      url.searchParams.set('page', String(page))
      url.searchParams.set('limit', String(limit))
      return await this.fetchJson<Job[]>(url.toString())
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async getPayments(page: number = 1, limit: number = 10): Promise<Payment[]> {
    try {
      return await this.fetchJson<Payment[]>(`${BASE_URL}/payments?page=${page}&limit=${limit}`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }
}

export const adminDatasource = new AdminDatasource()
