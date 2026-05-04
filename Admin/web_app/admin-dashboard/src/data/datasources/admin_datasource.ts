import { DashboardMetrics, Customer, Technician, Job, Payment, CatalogProduct, CatalogPackage, CatalogAddon, CatalogTax, CatalogRecommendation, InvoiceTemplate, Service, UpgradeBundle, PricingSet } from '../models/admin_models'
import { useAuthStore } from '../../core/services/auth_service'
import { getApiBaseUrl } from '../../core/config/api'

const API_DELAY = 100 // small UX delay when mocking; kept low when using real API
const BASE_URL = getApiBaseUrl()

async function authHeaders(): Promise<Record<string, string>> {
  // Always try to get a fresh Firebase ID token first.
  try {
    const idToken = await useAuthStore.getState().getIdToken()
    if (idToken) {
      console.log('🔐 Using fresh Firebase ID token')
      localStorage.setItem('safecom_admin_token', idToken)
      return { Authorization: `Bearer ${idToken}` }
    }
  } catch (error) {
    console.error('❌ Failed to get Firebase ID token:', error)
  }

  // Fallback to stored token only when Firebase token lookup fails.
  const token = localStorage.getItem('safecom_admin_token')
  if (token) {
    console.log('🔐 Using stored token from localStorage')
    return { Authorization: `Bearer ${token}` }
  }

  console.warn('⚠️ No token available for API requests')
  return {}
}

export class AdminDatasource {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  private async fetchJson<T>(url: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...await authHeaders() }
    if (opts.headers) {
      Object.assign(headers, opts.headers as Record<string, string>)
    }
    const res = await fetch(url, { ...opts, headers })
    if (!res.ok) {
      const text = await res.text()
      const errorMsg = `API error ${res.status}: ${text}`
      console.error(`❌ ${url}: ${errorMsg}`)
      if (res.status === 401) {
        console.error('🔐 Token invalid, logging out...')
        await useAuthStore.getState().logout()
      }
      throw new Error(errorMsg)
    }
    console.log(`✅ ${url}: success`)
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
      const customers = await this.fetchJson<Record<string, unknown>[]>(`${BASE_URL}/customers?page=${page}&limit=${limit}`)
      return customers.map((item) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        email: String(item.email || ''),
        phone: String(item.phone || ''),
        address: String(item.address || ''),
        registeredDate: String(item.registeredDate || item.createdAt || new Date().toISOString()),
        totalOrders: Number(item.totalOrders || 0),
        totalSpent: Number(item.totalSpent || 0),
        status: String(item.status || 'active') as 'active' | 'inactive'
      }))
    } catch (e) {
      console.error('❌ getCustomers error:', e)
      await this.delay(API_DELAY)
      return []
    }
  }

  async getTechnicians(page: number = 1, limit: number = 10): Promise<Technician[]> {
    try {
      const technicians = await this.fetchJson<Record<string, unknown>[]>(`${BASE_URL}/technicians?page=${page}&limit=${limit}`)
      return technicians.map((item) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        email: String(item.email || ''),
        phone: String(item.phone || ''),
        skills: Array.isArray(item.skills) ? item.skills.map(String) : [],
        location: String(item.location || ''),
        totalJobs: Number(item.totalJobs || 0),
        rating: Number(item.rating || 0),
        status: String(item.status || 'available') as 'available' | 'on-job' | 'inactive',
        joiningDate: String(item.joiningDate || item.createdAt || new Date().toISOString())
      }))
    } catch (e) {
      console.error('❌ getTechnicians error:', e)
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
      const jobs = await this.fetchJson<Record<string, unknown>[]>(url.toString())
      return jobs.map((item) => ({
        id: String(item.id || ''),
        customerId: String(item.customerId || ''),
        technicianId: item.technicianId ? String(item.technicianId) : null,
        serviceType: String(item.serviceType || 'installation') as Job['serviceType'],
        status: String(item.status || 'pending') as Job['status'],
        amount: Number(item.amount || 0),
        scheduledDate: String(item.scheduledDate || new Date().toISOString()),
        completedDate: item.completedDate ? String(item.completedDate) : null,
        notes: String(item.notes || '')
      }))
    } catch (e) {
      console.error('❌ getJobs error:', e)
      await this.delay(API_DELAY)
      return []
    }
  }

  async getPayments(page: number = 1, limit: number = 10): Promise<Payment[]> {
    try {
      const payments = await this.fetchJson<Record<string, unknown>[]>(`${BASE_URL}/payments?page=${page}&limit=${limit}`)
      return payments.map((item) => {
        const amount = Number(item.amount || item.paidAmount || 0)
        const paidAmount = Number(item.paidAmount || amount)
        const remainingAmount = Number(item.remainingAmount || Math.max(0, amount - paidAmount))
        const timestamp = String(item.timestamp || item.createdAt || new Date().toISOString())

        return {
          id: String(item.id || ''),
          customerId: String(item.customerId || ''),
          customerName: String(item.customerName || item.customerId || ''),
          jobId: String(item.jobId || ''),
          amount,
          paidAmount,
          remainingAmount,
          status: String(item.status || 'pending') as 'pending' | 'partial' | 'completed' | 'failed',
          paymentMethod: String(item.paymentMethod || 'cash'),
          transactionId: String(item.transactionId || item.id || ''),
          createdAt: String(item.createdAt || timestamp),
          updatedAt: String(item.updatedAt || timestamp)
        }
      })
    } catch (e) {
      console.error('❌ getPayments error:', e)
      await this.delay(API_DELAY)
      return []
    }
  }

  async getCatalogProducts(): Promise<CatalogProduct[]> {
    try {
      const [products, accessories] = await Promise.all([
        this.fetchJson<CatalogProduct[]>(`${BASE_URL}/catalog/products`),
        this.getCatalogAccessories()
      ])
      return [...products, ...accessories]
    } catch (e) {
      console.error('❌ getCatalogProducts error:', e)
      await this.delay(API_DELAY)
      return []
    }
  }

  async getCatalogAccessories(): Promise<CatalogProduct[]> {
    try {
      const accessories = await this.fetchJson<Record<string, unknown>[]>(`${BASE_URL}/catalog/accessories`)
      return accessories.map((item) => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        category: String(item.category || 'Accessories'),
        group: String(item.group || 'Accessories'),
        unit: String(item.unit || 'unit'),
        price: Number(item.price || 0),
        status: String(item.status || 'active') as 'active' | 'inactive',
        updatedAt: String(item.updatedAt || new Date().toISOString())
      }))
    } catch (e) {
      console.error('❌ getCatalogAccessories error:', e)
      await this.delay(API_DELAY)
      return []
    }
  }

  async getServices(): Promise<Service[]> {
    try {
      return await this.fetchJson<Service[]>(`${BASE_URL}/catalog/services`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async getUpgradeBundles(): Promise<UpgradeBundle[]> {
    try {
      return await this.fetchJson<UpgradeBundle[]>(`${BASE_URL}/catalog/upgrade`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async getPricingData(): Promise<PricingSet> {
    try {
      return await this.fetchJson<PricingSet>(`${BASE_URL}/catalog/pricing`)
    } catch (e) {
      await this.delay(API_DELAY)
      return {}
    }
  }

  async createCatalogProduct(data: Partial<CatalogProduct>): Promise<CatalogProduct> {
    try {
      return await this.fetchJson<CatalogProduct>(`${BASE_URL}/catalog/products`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create catalog product')
    }
  }

  async updateCatalogProduct(id: string, data: Partial<CatalogProduct>): Promise<CatalogProduct> {
    try {
      return await this.fetchJson<CatalogProduct>(`${BASE_URL}/catalog/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update catalog product')
    }
  }

  async deleteCatalogProduct(id: string): Promise<void> {
    try {
      await this.fetchJson<void>(`${BASE_URL}/catalog/products/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      throw new Error('Failed to delete catalog product')
    }
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    try {
      return await this.fetchJson<Customer>(`${BASE_URL}/customers`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create customer')
    }
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    try {
      return await this.fetchJson<Customer>(`${BASE_URL}/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update customer')
    }
  }

  async createTechnician(data: Partial<Technician>): Promise<Technician> {
    try {
      return await this.fetchJson<Technician>(`${BASE_URL}/technicians`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create technician')
    }
  }

  async updateTechnician(id: string, data: Partial<Technician>): Promise<Technician> {
    try {
      return await this.fetchJson<Technician>(`${BASE_URL}/technicians/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update technician')
    }
  }

  async createJob(data: Partial<Job>): Promise<Job> {
    try {
      return await this.fetchJson<Job>(`${BASE_URL}/jobs`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create job')
    }
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    try {
      return await this.fetchJson<Job>(`${BASE_URL}/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update job')
    }
  }

  // ====== PACKAGES ======
  async getCatalogPackages(): Promise<CatalogPackage[]> {
    try {
      return await this.fetchJson<CatalogPackage[]>(`${BASE_URL}/catalog/packages`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async createCatalogPackage(data: Partial<CatalogPackage>): Promise<CatalogPackage> {
    try {
      return await this.fetchJson<CatalogPackage>(`${BASE_URL}/catalog/packages`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create package')
    }
  }

  async updateCatalogPackage(id: string, data: Partial<CatalogPackage>): Promise<CatalogPackage> {
    try {
      return await this.fetchJson<CatalogPackage>(`${BASE_URL}/catalog/packages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update package')
    }
  }

  async deleteCatalogPackage(id: string): Promise<void> {
    try {
      await this.fetchJson<void>(`${BASE_URL}/catalog/packages/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      throw new Error('Failed to delete package')
    }
  }

  // ====== ADD-ONS ======
  async getCatalogAddons(): Promise<CatalogAddon[]> {
    try {
      return await this.fetchJson<CatalogAddon[]>(`${BASE_URL}/catalog/addons`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async createCatalogAddon(data: Partial<CatalogAddon>): Promise<CatalogAddon> {
    try {
      return await this.fetchJson<CatalogAddon>(`${BASE_URL}/catalog/addons`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create add-on')
    }
  }

  async updateCatalogAddon(id: string, data: Partial<CatalogAddon>): Promise<CatalogAddon> {
    try {
      return await this.fetchJson<CatalogAddon>(`${BASE_URL}/catalog/addons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update add-on')
    }
  }

  async deleteCatalogAddon(id: string): Promise<void> {
    try {
      await this.fetchJson<void>(`${BASE_URL}/catalog/addons/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      throw new Error('Failed to delete add-on')
    }
  }

  // ====== TAXES ======
  async getCatalogTaxes(): Promise<CatalogTax[]> {
    try {
      return await this.fetchJson<CatalogTax[]>(`${BASE_URL}/catalog/taxes`)
    } catch (e) {
      console.error('❌ getCatalogTaxes error:', e)
      await this.delay(API_DELAY)
      return []
    }
  }

  async createCatalogTax(data: Partial<CatalogTax>): Promise<CatalogTax> {
    try {
      return await this.fetchJson<CatalogTax>(`${BASE_URL}/catalog/taxes`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create tax')
    }
  }

  async updateCatalogTax(id: string, data: Partial<CatalogTax>): Promise<CatalogTax> {
    try {
      return await this.fetchJson<CatalogTax>(`${BASE_URL}/catalog/taxes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update tax')
    }
  }

  async deleteCatalogTax(id: string): Promise<void> {
    try {
      await this.fetchJson<void>(`${BASE_URL}/catalog/taxes/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      throw new Error('Failed to delete tax')
    }
  }

  // ====== RECOMMENDATIONS ======
  async getCatalogRecommendations(): Promise<CatalogRecommendation[]> {
    try {
      return await this.fetchJson<CatalogRecommendation[]>(`${BASE_URL}/catalog/recommendations`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async createCatalogRecommendation(data: Partial<CatalogRecommendation>): Promise<CatalogRecommendation> {
    try {
      return await this.fetchJson<CatalogRecommendation>(`${BASE_URL}/catalog/recommendations`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create recommendation')
    }
  }

  async updateCatalogRecommendation(id: string, data: Partial<CatalogRecommendation>): Promise<CatalogRecommendation> {
    try {
      return await this.fetchJson<CatalogRecommendation>(`${BASE_URL}/catalog/recommendations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update recommendation')
    }
  }

  async deleteCatalogRecommendation(id: string): Promise<void> {
    try {
      await this.fetchJson<void>(`${BASE_URL}/catalog/recommendations/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      throw new Error('Failed to delete recommendation')
    }
  }

  // ====== INVOICE TEMPLATES ======
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    try {
      return await this.fetchJson<InvoiceTemplate[]>(`${BASE_URL}/catalog/invoices`)
    } catch (e) {
      await this.delay(API_DELAY)
      return []
    }
  }

  async createInvoiceTemplate(data: Partial<InvoiceTemplate>): Promise<InvoiceTemplate> {
    try {
      return await this.fetchJson<InvoiceTemplate>(`${BASE_URL}/catalog/invoices`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to create invoice template')
    }
  }

  async updateInvoiceTemplate(id: string, data: Partial<InvoiceTemplate>): Promise<InvoiceTemplate> {
    try {
      return await this.fetchJson<InvoiceTemplate>(`${BASE_URL}/catalog/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    } catch (e) {
      throw new Error('Failed to update invoice template')
    }
  }

  async deleteInvoiceTemplate(id: string): Promise<void> {
    try {
      await this.fetchJson<void>(`${BASE_URL}/catalog/invoices/${id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      throw new Error('Failed to delete invoice template')
    }
  }
}

export const adminDatasource = new AdminDatasource()
