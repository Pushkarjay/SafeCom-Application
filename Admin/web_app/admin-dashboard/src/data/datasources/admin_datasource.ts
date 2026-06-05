import { DashboardMetrics, Customer, Technician, Job, Payment, CatalogProduct, CatalogPackage, CatalogAddon, CatalogTax, CatalogRecommendation, InvoiceTemplate, Service, UpgradeBundle, PricingSet, InstallationConfig, CatalogService } from '../models/admin_models'
import { useAuthStore } from '../../core/services/auth_service'
import { getApiBaseUrl } from '../../core/config/api'

const BASE_URL = getApiBaseUrl()
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/safecom-application-01/databases/safecom-database-nosql/documents'

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
  private async firestoreFetch(path: string): Promise<any> {
    const token = await useAuthStore.getState().getIdToken()
    const url = `${FIRESTORE_BASE}/${path}`
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token ?? ''}`,
        'Content-Type': 'application/json',
      }
    })
    if (!res.ok) throw new Error(`Firestore error ${res.status}: ${await res.text()}`)
    return res.json()
  }

  private encodePath(path: string): string {
    return path.split('/').map(s => encodeURIComponent(s)).join('/')
  }

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
      totalJobs: Number(item.totalJobs || item.completedJobs || 0),
      rating: Number(item.rating || 0),
      status: (item.status === 'active' ? 'available' : item.status === 'inactive' ? 'inactive' : 'available') as 'available' | 'on-job' | 'inactive',
      joiningDate: String(item.joinDate || item.joiningDate || item.createdAt || new Date().toISOString())
    }))
  }

  async getJobs(status: string | null = null, page: number = 1, limit: number = 10): Promise<Job[]> {
    const url = new URL(`${BASE_URL}/jobs`)
    if (status && status !== 'all') url.searchParams.set('status', status)
    url.searchParams.set('page', String(page))
    url.searchParams.set('limit', String(limit))
    const payload = await this.fetchJson<any>(url.toString())
    const jobs = Array.isArray(payload) ? payload : (payload.data || [])
    return jobs.map((item: any) => ({
      id: String(item.jobId || item.id || ''),
      customerId: String(item.customer?.customerId || item.customerId || ''),
      technicianId: item.assignedTo?.employeeId ? String(item.assignedTo.employeeId) : (item.technicianId ? String(item.technicianId) : null),
      serviceType: String(item.serviceType || 'installation') as Job['serviceType'],
      status: String(item.status || 'pending') as Job['status'],
      amount: Number(item.actualAmount || item.amount || 0),
      scheduledDate: String(item.scheduledDate || new Date().toISOString()),
      completedDate: String(item.completedAt || item.completedDate || '') || null,
      notes: String(item.completionNotes || item.notes || ''),
      address: item.location?.address || item.customer?.address || '',
      latitude: item.location?.latitude || 0,
      longitude: item.location?.longitude || 0,
      customerName: item.customer?.name || '',
      customerPhone: item.customer?.phone || ''
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

      const paymentId = item.paymentId || item.id || ''
      return {
        id: String(paymentId),
        customerId: String(item.customerId || ''),
        customerName: String(item.customerName || item.customerId || ''),
        jobId: String(item.jobId || ''),
        amount,
        paidAmount,
        remainingAmount,
        status: String(item.status || 'pending') as 'pending' | 'partial' | 'completed' | 'failed',
        paymentMethod: String(item.paymentMethod || 'razorpay'),
        transactionId: String(item.transactionId || item.paymentId || item.id || ''),
        createdAt: String(item.createdAt || item.timestamp || timestamp),
        updatedAt: String(item.updatedAt || item.timestamp || timestamp)
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
    const payload = await this.fetchJson<{ items: Record<string, unknown>[] }>(`${BASE_URL}/catalog-public/accessories`)
    const items = payload?.items ?? []
    return items.map((item) => ({
      id: String(item.productId || item.id || ''),
      name: String(item.productName || item.name || ''),
      category: String(item.category || 'Accessories'),
      group: String(item.group || 'Accessories'),
      unit: String(item.unit || 'unit'),
      price: Number(item.basePrice ?? item.price ?? 0),
      status: (item.isAvailable !== false ? 'active' : 'inactive') as 'active' | 'inactive',
      updatedAt: String(item.updatedAt || new Date().toISOString())
    }))
  }

  async getCatalogMetadata(): Promise<{ categories: string[]; groups: string[] }> {
    const payload = await this.fetchJson<{ success: boolean; data: { categories: string[]; groups: string[] } }>(`${BASE_URL}/catalog/metadata`)
    return payload.data || { categories: [], groups: [] }
  }

  async createCatalogMetadata(type: 'category' | 'group', value: string): Promise<{ success: boolean; type: string; value: string }> {
    return await this.fetchJson(`${BASE_URL}/catalog/metadata`, {
      method: 'POST',
      body: JSON.stringify({ type, value })
    })
  }

  async deleteCatalogMetadata(id: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/metadata/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
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
      method: 'PATCH',
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
    const payload = await this.fetchJson<{ services: Record<string, unknown>[] }>(`${BASE_URL}/catalog-public/services`)
    return (payload.services ?? []).map((s) => ({
      serviceId: String(s.id || ''),
      serviceName: String(s.title || s.name || ''),
      description: String(s.description || ''),
      category: String(s.category || 'General'),
      productIds: [] as string[],
      basePrice: Number(s.basePrice ?? 0),
      isAvailable: s.enabled !== false,
      isFeatured: Boolean(s.isFeatured),
      isRecurring: false,
      taxRate: 0,
      displayPriority: 0,
      createdAt: String(s.createdAt || new Date().toISOString()),
      updatedAt: String(s.updatedAt || new Date().toISOString())
    }))
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

  // ====== GENERIC SERVICES ADMIN (CRUD + Tree Configuration) ======

  async getServicesList(): Promise<Service[]> {
    const payload = await this.fetchJson<{ success: boolean; data: Service[] }>(`${BASE_URL}/catalog/services-admin/list`)
    return payload.data
  }

  async createService(id: string, title: string, icon: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/create`, {
      method: 'POST',
      body: JSON.stringify({ id, title, icon })
    })
  }

  async updateService(id: string, data: { title?: string; icon?: string; enabled?: boolean }): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/${encodeURIComponent(id)}/meta`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}`, {
      method: 'DELETE'
    })
  }

  async getServiceConfig(serviceId: string): Promise<{ categories: any[] }> {
    // 1. Fetch the main tree from the backend API (categories, setups with products)
    const apiPayload = await this.fetchJson<{ success: boolean; data: { categories: any[] } }>(
      `${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}`
    )
    const apiCategories: any[] = apiPayload.data?.categories ?? []

    // 2. Also fetch raw Firestore to catch branches created via + Branch button
    // (those use a different endpoint the backend may not index correctly)
    let fsBranches: Record<string, any[]> = {}
    try {
      for (const cat of apiCategories) {
        const catPath = `services/${serviceId}/${cat.key}`
        const docSnap = await this.firestoreFetch(this.encodePath(catPath))
        const fields = docSnap?.fields as Record<string, any> | undefined
        if (fields) {
          for (const [setupKey, setupVal] of Object.entries(fields)) {
            if (setupVal?.mapValue?.fields) {
              const sf = setupVal.mapValue.fields as Record<string, any>
              const hasProducts = !!sf.products
              const hasChildren = !!sf.children
              if (!hasProducts && hasChildren) {
                // This is a branch-created setup — normalize its children into products slot
                const children = sf.children.arrayValue?.values ?? []
                const normalizedProducts = [{
                  key: setupKey,
                  isClubbed: true,
                  options: children.map((c: any) => this.firestoreNodeToTreeNode(c))
                }]
                // Ensure the category has this setup
                const existing = (apiCategories as any[]).find((c: any) => c.key === cat.key)
                if (existing) {
                  const hasSetup = existing.setups?.some((s: any) => s.key === setupKey)
                  if (!hasSetup) {
                    existing.setups = existing.setups || []
                    existing.setups.push({ key: setupKey, name: setupKey, products: normalizedProducts })
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Firestore branch lookup failed (non-critical):', e)
    }

    // Normalize: any setup with `children` instead of `products` → wrap as clubbed product
    const normalize = (cats: any[]): any[] => cats.map(cat => ({
      ...cat,
      setups: (cat.setups || []).map((s: any) => {
        if (!Array.isArray(s.products) && Array.isArray(s.children)) {
          return { ...s, products: [{ key: s.key, isClubbed: true, options: s.children }] }
        }
        if (!Array.isArray(s.products)) {
          return { ...s, products: [] }
        }
        return s
      })
    }))

    return { categories: normalize(apiCategories) }
  }

  /** Convert a Firestore "map" node to a TreeNode shape */
  private firestoreNodeToTreeNode(node: any): any {
    if (!node.mapValue?.fields) return {}
    const f = node.mapValue.fields
    return {
      key: node.key || f.name?.stringValue || '',
      isLeaf: !f.children && !f.products,
      productId: f['Product ID']?.stringValue || f.PROD001?.stringValue || f.PROD033?.stringValue || '',
      productName: f.name?.stringValue || '',
      price: Number(f.Price?.referenceValue?.split('/').pop() || f.price?.stringValue || 0),
      category: f.category?.stringValue || '',
      defaultQty: Number(f['Deafult q']?.integerValue ?? f.defaultQty?.stringValue ?? 1),
      minQty: Number(f['min q']?.integerValue ?? f.minQty?.stringValue ?? 0),
      maxQty: Number(f['max q']?.integerValue ?? f.maxQty?.stringValue ?? 50),
      available: f.available?.booleanValue ?? true,
      rigid: f.rigid?.booleanValue ?? false,
      renderType: f.renderType?.stringValue,
      selectionType: f.selectionType?.stringValue,
      collectiveValidation: f.collectiveValidation?.booleanValue,
      mandatory: f.mandatory?.booleanValue,
      dependsOn: f.dependsOn?.stringValue ?? null,
      children: (f.children?.arrayValue?.values ?? []).map((c: any) => this.firestoreNodeToTreeNode(c)),
    }
  }

  async serviceAddCategory(serviceId: string, name: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category`, {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }

  async serviceDeleteCategory(serviceId: string, key: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(key)}`, {
      method: 'DELETE'
    })
  }

  async serviceAddSetup(serviceId: string, categoryKey: string, name: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup`, {
      method: 'POST',
      body: JSON.stringify({ name })
    })
  }

  async serviceDeleteSetup(serviceId: string, categoryKey: string, setupKey: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}`, {
      method: 'DELETE'
    })
  }

  async serviceAddProduct(serviceId: string, categoryKey: string, setupKey: string, productId: string): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/product`, {
        method: 'POST',
        body: JSON.stringify({ productId })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product`, {
        method: 'POST',
        body: JSON.stringify({ productId })
      })
    }
  }

  async serviceDeleteProduct(serviceId: string, categoryKey: string, setupKey: string, productKey: string): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/product/${encodeURIComponent(productKey)}`, {
        method: 'DELETE'
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/product/${encodeURIComponent(productKey)}`, {
        method: 'DELETE'
      })
    }
  }

  async serviceAddNode(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], productId: string): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node`, {
        method: 'POST',
        body: JSON.stringify({ nodePath, productId })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node`, {
        method: 'POST',
        body: JSON.stringify({ nodePath, productId })
      })
    }
  }

  async serviceDeleteNode(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[]): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node?path=${encodeURIComponent(JSON.stringify(nodePath))}`, {
        method: 'DELETE'
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node?path=${encodeURIComponent(JSON.stringify(nodePath))}`, {
        method: 'DELETE'
      })
    }
  }

  async serviceRenameNode(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], newName: string): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node/rename`, {
        method: 'POST',
        body: JSON.stringify({ nodePath, newName })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node/rename`, {
        method: 'POST',
        body: JSON.stringify({ nodePath, newName })
      })
    }
  }

  async serviceRenameCategory(serviceId: string, categoryKey: string, newName: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/rename`, {
      method: 'POST',
      body: JSON.stringify({ newName })
    })
  }

  async serviceRenameSetup(serviceId: string, categoryKey: string, setupKey: string, newName: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/rename`, {
      method: 'POST',
      body: JSON.stringify({ newName })
    })
  }

  async serviceUpdateQuantities(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], quantities: { defaultQty?: number; minQty?: number; maxQty?: number }): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node/quantities`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, ...quantities })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node/quantities`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, ...quantities })
      })
    }
  }

  async serviceUpdateDynamicField(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], value: any): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node/dynamic-field`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, value })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node/dynamic-field`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, value })
      })
    }
  }

  async serviceUpdateRenderConfig(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], config: { renderType?: 'option' | 'list'; selectionType?: 'single' | 'multi'; collectiveValidation?: boolean; displayLabel?: string; mandatory?: boolean }): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node/render-config`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, ...config })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node/render-config`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, ...config })
      })
    }
  }

  async serviceUpdateDependency(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], dependsOn: string): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node/dependency`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, dependsOn })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node/dependency`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, dependsOn })
      })
    }
  }

  async serviceRemoveDependency(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[]): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/node/dependency`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, dependsOn: null })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/node/dependency`, {
        method: 'PATCH',
        body: JSON.stringify({ nodePath, dependsOn: null })
      })
    }
  }

  async serviceCloneSetup(serviceId: string, sourceCategoryKey: string, sourceSetupKey: string, destCategoryKey: string, newName: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(destCategoryKey)}/setup/clone`, {
      method: 'POST',
      body: JSON.stringify({ sourceCategoryKey, sourceSetupKey, newName })
    })
  }

  async serviceClubProducts(serviceId: string, categoryKey: string, setupKey: string, groupName: string, keys: string[], nodePath?: string[]): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/_/club`, {
        method: 'POST',
        body: JSON.stringify({ groupName, keys, nodePath })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/club`, {
        method: 'POST',
        body: JSON.stringify({ groupName, keys, nodePath })
      })
    }
  }

  async serviceAddBranch(serviceId: string, categoryKey: string, setupKey: string, nodePath: string[], branchName: string): Promise<void> {
    if (!setupKey || setupKey === '') {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/branch`, {
        method: 'POST',
        body: JSON.stringify({ nodePath, branchName })
      })
    } else {
      await this.fetchJson(`${BASE_URL}/catalog/services-admin/config/${encodeURIComponent(serviceId)}/category/${encodeURIComponent(categoryKey)}/setup/${encodeURIComponent(setupKey)}/branch`, {
        method: 'POST',
        body: JSON.stringify({ nodePath, branchName })
      })
    }
  }

  async fetchMasterProducts(query: string): Promise<any[]> {
    const payload = await this.fetchJson<{ success: boolean; data: { products: any[] } }>(`${BASE_URL}/catalog/services-admin/products?q=${encodeURIComponent(query)}`)
    return payload.data?.products ?? []
  }

  // ====== LEGACY ALIASES (to avoid breaking components immediately) ======
  async getInstallationAdminConfig() { return this.getServiceConfig('Installation') }
  async installationAddCategory(name: string) { return this.serviceAddCategory('Installation', name) }
  async installationDeleteCategory(key: string) { return this.serviceDeleteCategory('Installation', key) }
  async installationAddSetup(cat: string, name: string) { return this.serviceAddSetup('Installation', cat, name) }
  async installationDeleteSetup(cat: string, setup: string) { return this.serviceDeleteSetup('Installation', cat, setup) }
  async installationAddProduct(cat: string, setup: string, id: string) { return this.serviceAddProduct('Installation', cat, setup, id) }
  async installationDeleteProduct(cat: string, setup: string, pk: string) { return this.serviceDeleteProduct('Installation', cat, setup, pk) }
  async installationAddClubOption(cat: string, setup: string, path: string[], id: string) { return this.serviceAddNode('Installation', cat, setup, path, id) }
  async installationDeleteClubOption(cat: string, setup: string, path: string[]) { return this.serviceDeleteNode('Installation', cat, setup, path) }
  async fetchInstallationProducts(q: string) { return this.fetchMasterProducts(q) }
  async installationUpdateQuantities(cat: string, setup: string, path: string[], q: any) { return this.serviceUpdateQuantities('Installation', cat, setup, path, q) }
  async installationUpdateDynamicField(cat: string, setup: string, path: string[], v: any) { return this.serviceUpdateDynamicField('Installation', cat, setup, path, v) }
  async installationUpdateProductPrice(id: string, p: number) { 
    await this.fetchJson(`${BASE_URL}/catalog/products/${id}`, { method: 'PATCH', body: JSON.stringify({ basePrice: p }) })
  }

  // ====== MAINTENANCE ALIASES ======
  async getMaintenanceAdminConfig() { return this.getServiceConfig('Maintenance') }
  async maintenanceAddCategory(name: string) { return this.serviceAddCategory('Maintenance', name) }
  async maintenanceDeleteCategory(key: string) { return this.serviceDeleteCategory('Maintenance', key) }
  async maintenanceAddSetup(cat: string, name: string) { return this.serviceAddSetup('Maintenance', cat, name) }
  async maintenanceDeleteSetup(cat: string, setup: string) { return this.serviceDeleteSetup('Maintenance', cat, setup) }
  async maintenanceAddProduct(cat: string, setup: string, id: string) { return this.serviceAddProduct('Maintenance', cat, setup, id) }
  async maintenanceDeleteProduct(cat: string, setup: string, pk: string) { return this.serviceDeleteProduct('Maintenance', cat, setup, pk) }
  async maintenanceAddClubOption(cat: string, setup: string, path: string[], id: string) { return this.serviceAddNode('Maintenance', cat, setup, path, id) }
  async maintenanceDeleteClubOption(cat: string, setup: string, path: string[]) { return this.serviceDeleteNode('Maintenance', cat, setup, path) }
  async fetchMaintenanceProducts(q: string) { return this.fetchMasterProducts(q) }
  async maintenanceUpdateQuantities(cat: string, setup: string, path: string[], q: any) { return this.serviceUpdateQuantities('Maintenance', cat, setup, path, q) }
  async maintenanceUpdateDynamicField(cat: string, setup: string, path: string[], v: any) { return this.serviceUpdateDynamicField('Maintenance', cat, setup, path, v) }
  async maintenanceUpdateProductPrice(id: string, p: number) { 
    await this.fetchJson(`${BASE_URL}/catalog/products/${id}`, { method: 'PATCH', body: JSON.stringify({ basePrice: p }) })
  }

  async updatePricingData(data: Partial<PricingSet>): Promise<{ success: boolean }> {
    return await this.fetchJson<{ success: boolean }>(`${BASE_URL}/catalog/pricing`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // ====== SDUI ADMIN ======

  async fetchSduiLayouts(): Promise<any[]> {
    const payload = await this.fetchJson<{ success: boolean; data: any[] }>(`${BASE_URL}/catalog/sdui-admin/layouts`)
    return payload.data
  }

  async fetchSduiLayout(id: string): Promise<any> {
    const payload = await this.fetchJson<{ success: boolean; data: any }>(`${BASE_URL}/catalog/sdui-admin/layouts/${id}`)
    return payload.data
  }

  async fetchCustomerSduiView(screen: string = 'home', lat?: number, lng?: number): Promise<any> {
    const params = new URLSearchParams({ screen })
    if (lat !== undefined) params.set('lat', String(lat))
    if (lng !== undefined) params.set('lng', String(lng))
    const payload = await this.fetchJson<{ success: boolean; data: any }>(`${BASE_URL}/sdui/layout?${params}`)
    return payload.data
  }

  async saveSduiLayout(id: string, layout: any[], meta: any): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/sdui-admin/layouts/${id}`, {
      method: 'POST',
      body: JSON.stringify({ layout, meta })
    })
  }

  async resetSduiLayout(id: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/sdui-admin/layouts/${id}/reset`, {
      method: 'POST'
    })
  }

  async fetchSduiFlags(): Promise<any[]> {
    const payload = await this.fetchJson<{ success: boolean; data: any[] }>(`${BASE_URL}/catalog/sdui-admin/feature-flags`)
    return payload.data
  }

  async saveSduiFlag(key: string, data: { enabled: boolean; description: string }): Promise<void> {
    await this.fetchJson(`${BASE_URL}/catalog/sdui-admin/feature-flags/${key}`, {
      method: 'POST',
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

  async getJob(id: string): Promise<Job | null> {
    try {
      const payload = await this.fetchJson<any>(`${BASE_URL}/jobs/${id}`)
      const item = payload.data || payload
      if (!item) return null
      return {
        id: String(item.jobId || item.id || ''),
        customerId: String(item.customer?.customerId || item.customerId || ''),
        technicianId: item.assignedTo?.employeeId ? String(item.assignedTo.employeeId) : (item.technicianId ? String(item.technicianId) : null),
        serviceType: String(item.serviceType || 'installation') as Job['serviceType'],
        status: String(item.status || 'pending') as Job['status'],
        amount: Number(item.actualAmount || item.amount || 0),
        scheduledDate: String(item.scheduledDate || new Date().toISOString()),
        completedDate: String(item.completedAt || item.completedDate || '') || null,
        notes: String(item.completionNotes || item.notes || ''),
        address: item.location?.address || item.customer?.address || '',
        latitude: item.location?.latitude || 0,
        longitude: item.location?.longitude || 0,
        customerName: item.customer?.name || '',
        customerPhone: item.customer?.phone || ''
      }
    } catch {
      return null
    }
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

  // ====== HOME CMS ======
  async getHomeCmsBlocks(): Promise<any[]> {
    const payload = await this.fetchJson<{ success: boolean; data: { blocks: any[] } }>(`${BASE_URL}/home-cms/admin`)
    return payload.data?.blocks ?? []
  }

  async createHomeCmsBlock(data: { type: string; order?: number; visible?: boolean; title?: string; subtitle?: string; imageUrl?: string; ctaLabel?: string; ctaRoute?: string; expiresAt?: string }): Promise<any> {
    return await this.fetchJson(`${BASE_URL}/home-cms`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateHomeCmsBlock(id: string, data: Partial<{ order: number; visible: boolean; title: string; subtitle: string; imageUrl: string; ctaLabel: string; ctaRoute: string; expiresAt: string }>): Promise<any> {
    return await this.fetchJson(`${BASE_URL}/home-cms/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteHomeCmsBlock(id: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/home-cms/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  }

  // ====== SERVICEABLE AREAS ======
  async getServiceableAreas(): Promise<any[]> {
    const payload = await this.fetchJson<{ success: boolean; data: any[] }>(`${BASE_URL}/serviceability/areas`)
    return payload.data ?? []
  }

  async createServiceableArea(data: { areaCode: string; areaName: string; latitude: number; longitude: number; radiusKm: number; estimatedTimeToService?: string }): Promise<any> {
    return await this.fetchJson(`${BASE_URL}/serviceability/areas`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateServiceableArea(areaCode: string, data: Partial<{ areaName: string; latitude: number; longitude: number; radiusKm: number; estimatedTimeToService: string; active: boolean }>): Promise<any> {
    return await this.fetchJson(`${BASE_URL}/serviceability/areas/${encodeURIComponent(areaCode)}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteServiceableArea(areaCode: string): Promise<void> {
    await this.fetchJson(`${BASE_URL}/serviceability/areas/${encodeURIComponent(areaCode)}`, {
      method: 'DELETE'
    })
  }
}

export const adminDatasource = new AdminDatasource()
