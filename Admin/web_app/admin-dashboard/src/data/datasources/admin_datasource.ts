import { DashboardMetrics, Customer, Technician, Job, Payment, CatalogProduct, CatalogPackage, CatalogAddon, CatalogTax, CatalogRecommendation, InvoiceTemplate, Service, UpgradeBundle, PricingSet, InstallationConfig, CatalogService } from '../models/admin_models'
import { useAuthStore } from '../../core/services/auth_service'
import { getApiBaseUrl } from '../../core/config/api'

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
    const payload = await this.fetchJson<{ success: boolean; data: DashboardMetrics }>(`${BASE_URL}/dashboard/metrics`)
    return payload.data ?? payload as unknown as DashboardMetrics
  }

  async getCustomers(page: number = 1, limit: number = 10): Promise<Customer[]> {
    const payload = await this.fetchJson<any>(`${BASE_URL}/customers?page=${page}&limit=${limit}`)
    const customers = Array.isArray(payload) ? payload : (payload.data || [])
    return customers.map((item: any) => ({
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
  }

  async getTechnicians(page: number = 1, limit: number = 10): Promise<Technician[]> {
    const payload = await this.fetchJson<any>(`${BASE_URL}/technicians?page=${page}&limit=${limit}`)
    const technicians = Array.isArray(payload) ? payload : (payload.data || [])
    return technicians.map((item: any) => ({
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
  }

  async getJobs(status: string | null = null, page: number = 1, limit: number = 10): Promise<Job[]> {
    const url = new URL(`${BASE_URL}/jobs`)
    if (status) url.searchParams.set('status', status)
    url.searchParams.set('page', String(page))
    url.searchParams.set('limit', String(limit))
    const payload = await this.fetchJson<any>(url.toString())
    const jobs = Array.isArray(payload) ? payload : (payload.data || [])
    return jobs.map((item: any) => ({
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
  }

  async getPayments(page: number = 1, limit: number = 10): Promise<Payment[]> {
    const payload = await this.fetchJson<any>(`${BASE_URL}/payments?page=${page}&limit=${limit}`)
    const payments = Array.isArray(payload) ? payload : (payload.data || [])
    return payments.map((item: any) => {
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
  }

  async getCatalogProducts(): Promise<CatalogProduct[]> {
    const productsPayload = await this.fetchJson<{ success: boolean; data: { products: Record<string, unknown>[] } }>(`${BASE_URL}/catalog/products?pageSize=1000`)
    const rawProducts = productsPayload?.data?.products ?? []
    return rawProducts.map((item) => ({
      id: String(item.productId || item.id || ''),
      name: String(item.productName || item.name || ''),
      category: String(item.category || ''),
      group: String(item.group || ''),
      unit: String(item.unit || 'unit'),
      price: Number(item.basePrice || item.price || 0),
      status: (item.isAvailable !== false ? 'active' : 'inactive') as 'active' | 'inactive',
      updatedAt: String(item.updatedAt || new Date().toISOString())
    }))
  }

  async getCatalogAccessories(): Promise<CatalogProduct[]> {
    const accessoriesPayload = await this.fetchJson<{ success: boolean; data: { accessories: Record<string, unknown>[] } }>(`${BASE_URL}/catalog/accessories`)
    const items = accessoriesPayload?.data?.accessories ?? []
    return items.map((item) => ({
      id: String(item.id || item.productId || item.accessoryId || ''),
      name: String(item.name || ''),
      category: String(item.category || 'Accessories'),
      group: String(item.group || 'Accessories'),
      unit: String(item.unit || 'unit'),
      price: Number(item.price || 0),
      status: (item.isAvailable !== false ? 'active' : 'inactive') as 'active' | 'inactive',
      updatedAt: String(item.updatedAt || new Date().toISOString())
    }))
  }

  async createCatalogProduct(data: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const payload = await this.fetchJson<{ success: boolean; data: CatalogProduct }>(`${BASE_URL}/catalog/products`, {
      method: 'POST',
      body: JSON.stringify({
        productName: data.name,
        category: data.category,
        group: data.group,
        basePrice: data.price,
        isAvailable: data.status !== 'inactive'
      })
    })
    return { ...data, id: payload.data.id || Math.random().toString(36).substr(2, 9) } as CatalogProduct
  }

  async updateCatalogProduct(id: string, data: Partial<CatalogProduct>): Promise<CatalogProduct> {
    await this.fetchJson(`${BASE_URL}/catalog/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        productName: data.name,
        category: data.category,
        group: data.group,
        basePrice: data.price,
        isAvailable: data.status !== 'inactive'
      })
    })
    return { ...data, id } as CatalogProduct
  }

  async deleteCatalogProduct(id: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/products/${id}`, {
      method: 'DELETE'
    })
  }

  async getCatalogServices(): Promise<CatalogService[]> {
    const payload = await this.fetchJson<{ success: boolean; data: { services: CatalogService[] } }>(`${BASE_URL}/catalog/services`)
    return payload.data?.services || []
  }

  async createCatalogService(data: Partial<CatalogService>): Promise<CatalogService> {
    const payload = await this.fetchJson<{ success: boolean; data: CatalogService }>(`${BASE_URL}/catalog/services`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return payload.data
  }

  async updateCatalogService(id: string, data: Partial<CatalogService>): Promise<CatalogService> {
    const payload = await this.fetchJson<{ success: boolean; data: CatalogService }>(`${BASE_URL}/catalog/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    return payload.data
  }

  async deleteCatalogService(id: string): Promise<void> {
    await this.fetchJson<void>(`${BASE_URL}/catalog/services/${id}`, {
      method: 'DELETE'
    })
  }

  async getServices(): Promise<Service[]> {
    const payload = await this.fetchJson<{ services?: Service[]; data?: { services?: Service[] } }>(`${BASE_URL}/catalog-public/services`)
    return payload.data?.services ?? payload.services ?? []
  }

  async getUpgradeBundles(): Promise<UpgradeBundle[]> {
    const payload = await this.fetchJson<{ bundles?: UpgradeBundle[] }>(`${BASE_URL}/catalog-public/upgrade`)
    return payload.bundles ?? []
  }

  async getPricingData(): Promise<PricingSet> {
    const results = await Promise.allSettled([
      this.fetchJson<Record<string, unknown>>(`${BASE_URL}/catalog-public/pricing/installation`),
      this.fetchJson<Record<string, unknown>>(`${BASE_URL}/catalog-public/pricing/maintenance`),
      this.fetchJson<Record<string, unknown>>(`${BASE_URL}/catalog-public/pricing/repair`),
      this.fetchJson<Record<string, unknown>>(`${BASE_URL}/catalog-public/pricing/amc`)
    ])
    
    return {
      installation: results[0].status === 'fulfilled' ? results[0].value : { message: 'Not available' },
      maintenance: results[1].status === 'fulfilled' ? results[1].value : { message: 'Not available' },
      repair: results[2].status === 'fulfilled' ? results[2].value : { message: 'Not available' },
      amc: results[3].status === 'fulfilled' ? results[3].value : { message: 'Not available' }
    }
  }

  /**
   * Fetch the full hierarchical installation config:
   * { name, categories: [{ id, name, groups: [{ id, name, mappedProducts: [...] }] }] }
   */
  async getInstallationConfig(): Promise<InstallationConfig> {
    const payload = await this.fetchJson<InstallationConfig>(`${BASE_URL}/catalog-public/pricing/installation`)
    return payload
  }

  // ====== INSTALLATION ADMIN (CRUD + Clubbing) ======

  async getInstallationAdminConfig(): Promise<{ categories: any[] }> {
    const payload = await this.fetchJson<{ success: boolean; data: { categories: any[] } }>(`${BASE_URL}/catalog/installation-admin`)
    return payload.data
  }

  async installationAddCategory(name: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category`, { method: 'POST', body: JSON.stringify({ name }) })
  }

  async installationDeleteCategory(key: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(key)}`, { method: 'DELETE' })
  }

  async installationAddSetup(categoryKey: string, name: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup`, { method: 'POST', body: JSON.stringify({ name }) })
  }

  async installationDeleteSetup(categoryKey: string, setupKey: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}`, { method: 'DELETE' })
  }

  async installationAddProduct(categoryKey: string, setupKey: string, productId: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product`, { method: 'POST', body: JSON.stringify({ productId }) })
  }

  async installationDeleteProduct(categoryKey: string, setupKey: string, productKey: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product/${encodeURIComponent(productKey)}`, { method: 'DELETE' })
  }

  async installationAddClubOption(categoryKey: string, setupKey: string, productKey: string, productId: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product/${encodeURIComponent(productKey)}/option`, { method: 'POST', body: JSON.stringify({ productId }) })
  }

  async installationDeleteClubOption(categoryKey: string, setupKey: string, productKey: string, optionKey: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product/${encodeURIComponent(productKey)}/option/${encodeURIComponent(optionKey)}`, { method: 'DELETE' })
  }

  async fetchInstallationProducts(query: string): Promise<Array<{ id: string; name: string; category: string; group: string; price: number; status: string }>> {
    const payload = await this.fetchJson<{ success: boolean; data: { products: Array<{ id: string; name: string; category: string; group: string; price: number; status: string }> } }>(`${BASE_URL}/catalog/installation-admin/products?q=${encodeURIComponent(query)}`)
    return payload.data?.products ?? []
  }

  async installationUpdateQuantities(categoryKey: string, setupKey: string, productKey: string, optionKey: string, quantities: { defaultQty?: number; minQty?: number; maxQty?: number }): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product/${encodeURIComponent(productKey)}/option/${encodeURIComponent(optionKey)}/quantities`, {
      method: 'PATCH',
      body: JSON.stringify(quantities)
    })
  }

  async installationClubExisting(categoryKey: string, setupKey: string, productKeys: string[]): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/club-existing`, {
      method: 'POST',
      body: JSON.stringify({ productKeys })
    })
  }

  async installationUpdateProductPrice(productId: string, price: number): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/installation-admin/products/${encodeURIComponent(productId)}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ price })
    })
  }

  async updatePricingData(data: Partial<PricingSet>): Promise<{ success: boolean }> {
    return await this.fetchJson<{ success: boolean }>(`${BASE_URL}/catalog/pricing`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }


  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return await this.fetchJson<Customer>(`${BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return await this.fetchJson<Customer>(`${BASE_URL}/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async createTechnician(data: Partial<Technician>): Promise<Technician> {
    return await this.fetchJson<Technician>(`${BASE_URL}/technicians`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTechnician(id: string, data: Partial<Technician>): Promise<Technician> {
    return await this.fetchJson<Technician>(`${BASE_URL}/technicians/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async createJob(data: Partial<Job>): Promise<Job> {
    return await this.fetchJson<Job>(`${BASE_URL}/jobs`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    return await this.fetchJson<Job>(`${BASE_URL}/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  // ====== PACKAGES ======
  async getCatalogPackages(): Promise<CatalogPackage[]> {
    return await this.fetchJson<CatalogPackage[]>(`${BASE_URL}/catalog/packages`)
  }

  async createCatalogPackage(data: Partial<CatalogPackage>): Promise<CatalogPackage> {
    return await this.fetchJson<CatalogPackage>(`${BASE_URL}/catalog/packages`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCatalogPackage(id: string, data: Partial<CatalogPackage>): Promise<CatalogPackage> {
    return await this.fetchJson<CatalogPackage>(`${BASE_URL}/catalog/packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteCatalogPackage(id: string): Promise<void> {
    await this.fetchJson<void>(`${BASE_URL}/catalog/packages/${id}`, {
      method: 'DELETE'
    })
  }

  // ====== ADD-ONS ======
  async getCatalogAddons(): Promise<CatalogAddon[]> {
    return await this.fetchJson<CatalogAddon[]>(`${BASE_URL}/catalog/addons`)
  }

  async createCatalogAddon(data: Partial<CatalogAddon>): Promise<CatalogAddon> {
    return await this.fetchJson<CatalogAddon>(`${BASE_URL}/catalog/addons`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCatalogAddon(id: string, data: Partial<CatalogAddon>): Promise<CatalogAddon> {
    return await this.fetchJson<CatalogAddon>(`${BASE_URL}/catalog/addons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteCatalogAddon(id: string): Promise<void> {
    await this.fetchJson<void>(`${BASE_URL}/catalog/addons/${id}`, {
      method: 'DELETE'
    })
  }

  // ====== TAXES ======
  async getCatalogTaxes(): Promise<CatalogTax[]> {
    return await this.fetchJson<CatalogTax[]>(`${BASE_URL}/catalog/taxes`)
  }

  async createCatalogTax(data: Partial<CatalogTax>): Promise<CatalogTax> {
    return await this.fetchJson<CatalogTax>(`${BASE_URL}/catalog/taxes`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCatalogTax(id: string, data: Partial<CatalogTax>): Promise<CatalogTax> {
    return await this.fetchJson<CatalogTax>(`${BASE_URL}/catalog/taxes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteCatalogTax(id: string): Promise<void> {
    await this.fetchJson<void>(`${BASE_URL}/catalog/taxes/${id}`, {
      method: 'DELETE'
    })
  }

  // ====== RECOMMENDATIONS ======
  async getCatalogRecommendations(): Promise<CatalogRecommendation[]> {
    const payload = await this.fetchJson<{ success: boolean; data: { recommendations: CatalogRecommendation[] } }>(
      `${BASE_URL}/catalog/recommendations`
    )
    return payload.data?.recommendations || []
  }

  async createCatalogRecommendation(data: Partial<CatalogRecommendation>): Promise<CatalogRecommendation> {
    const payload = await this.fetchJson<{ success: boolean; data: CatalogRecommendation }>(
      `${BASE_URL}/catalog/recommendations`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
    return payload.data
  }

  async updateCatalogRecommendation(id: string, data: Partial<CatalogRecommendation>): Promise<CatalogRecommendation> {
    const payload = await this.fetchJson<{ success: boolean; data: CatalogRecommendation }>(
      `${BASE_URL}/catalog/recommendations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    )
    return payload.data
  }

  async deleteCatalogRecommendation(id: string): Promise<void> {
    await this.fetchJson<void>(`${BASE_URL}/catalog/recommendations/${id}`, {
      method: 'DELETE'
    })
  }

  // ====== INVOICE TEMPLATES ======
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return await this.fetchJson<InvoiceTemplate[]>(`${BASE_URL}/catalog/invoices`)
  }

  async createInvoiceTemplate(data: Partial<InvoiceTemplate>): Promise<InvoiceTemplate> {
    return await this.fetchJson<InvoiceTemplate>(`${BASE_URL}/catalog/invoices`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateInvoiceTemplate(id: string, data: Partial<InvoiceTemplate>): Promise<InvoiceTemplate> {
    return await this.fetchJson<InvoiceTemplate>(`${BASE_URL}/catalog/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteInvoiceTemplate(id: string): Promise<void> {
    await this.fetchJson<void>(`${BASE_URL}/catalog/invoices/${id}`, {
      method: 'DELETE'
    })
  }
}

export const adminDatasource = new AdminDatasource()
