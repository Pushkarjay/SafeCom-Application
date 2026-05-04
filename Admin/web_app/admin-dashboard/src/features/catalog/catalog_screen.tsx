import { useEffect, useMemo, useState } from 'react'
import { adminDatasource } from '@data/datasources/admin_datasource'
import { useAuthStore } from '@core/services/auth_service'
import { CatalogProduct, CatalogPackage, CatalogAddon, CatalogTax, CatalogRecommendation, InvoiceTemplate, Service, UpgradeBundle, PricingSet } from '@data/models/admin_models'
import './catalog_screen.css'

const categories = ['All', 'Cameras', 'Storage', 'Recording', 'Wiring', 'Accessories']
const groups = ['All', 'Core', 'Package Base', 'Installation', 'Recommendations']

type TabType = 'products' | 'packages' | 'addons' | 'taxes' | 'recommendations' | 'invoices' | 'services' | 'upgrade' | 'pricing'

export default function CatalogScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const firebaseUser = useAuthStore((state) => state.firebaseUser)

  // Products
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [searchProduct, setSearchProduct] = useState('')
  const [category, setCategory] = useState('All')
  const [group, setGroup] = useState('All')
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '', category: 'Cameras', group: 'Core', unit: 'unit', price: 0, status: 'active' as 'active' | 'inactive'
  })

  // Packages
  const [packages, setPackages] = useState<CatalogPackage[]>([])
  const [editingPackage, setEditingPackage] = useState<CatalogPackage | null>(null)
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false)
  const [packageForm, setPackageForm] = useState({
    name: '', description: '', productIds: [] as string[], totalPrice: 0, discountPercent: 0, finalPrice: 0, status: 'active' as 'active' | 'inactive'
  })

  // Add-ons
  const [addons, setAddons] = useState<CatalogAddon[]>([])
  const [editingAddon, setEditingAddon] = useState<CatalogAddon | null>(null)
  const [isAddonFormOpen, setIsAddonFormOpen] = useState(false)
  const [addonForm, setAddonForm] = useState({
    name: '', description: '', category: 'Services', price: 0, status: 'active' as 'active' | 'inactive'
  })

  // Taxes
  const [taxes, setTaxes] = useState<CatalogTax[]>([])
  const [editingTax, setEditingTax] = useState<CatalogTax | null>(null)
  const [isTaxFormOpen, setIsTaxFormOpen] = useState(false)
  const [taxForm, setTaxForm] = useState({
    name: '', description: '', rate: 0, status: 'active' as 'active' | 'inactive'
  })

  // Recommendations
  const [recommendations, setRecommendations] = useState<CatalogRecommendation[]>([])
  const [editingRec, setEditingRec] = useState<CatalogRecommendation | null>(null)
  const [isRecFormOpen, setIsRecFormOpen] = useState(false)
  const [recForm, setRecForm] = useState({
    name: '',
    description: '',
    productIds: [] as string[],
    placement: 'checkout' as CatalogRecommendation['placement'],
    serviceTypes: [] as CatalogRecommendation['serviceTypes'],
    isAvailable: true,
    displayPriority: 0
  })

  // Invoices
  const [invoices, setInvoices] = useState<InvoiceTemplate[]>([])
  const [editingInvoice, setEditingInvoice] = useState<InvoiceTemplate | null>(null)
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    name: '', description: '', terms: '', notes: '', showTax: true, status: 'active' as 'active' | 'inactive'
  })

  const [services, setServices] = useState<Service[]>([])
  const [upgradeBundles, setUpgradeBundles] = useState<UpgradeBundle[]>([])
  const [pricingData, setPricingData] = useState<PricingSet>({})

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      if (!firebaseUser) {
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        if (activeTab === 'products') {
          const data = await adminDatasource.getCatalogProducts()
          setProducts(data)
        } else if (activeTab === 'packages') {
          const data = await adminDatasource.getCatalogPackages()
          setPackages(data)
        } else if (activeTab === 'addons') {
          const data = await adminDatasource.getCatalogAddons()
          setAddons(data)
        } else if (activeTab === 'taxes') {
          const data = await adminDatasource.getCatalogTaxes()
          setTaxes(data)
        } else if (activeTab === 'recommendations') {
          const data = await adminDatasource.getCatalogRecommendations()
          setRecommendations(data)
        } else if (activeTab === 'invoices') {
          const data = await adminDatasource.getInvoiceTemplates()
          setInvoices(data)
        } else if (activeTab === 'services') {
          const data = await adminDatasource.getServices()
          setServices(data)
        } else if (activeTab === 'upgrade') {
          const data = await adminDatasource.getUpgradeBundles()
          setUpgradeBundles(data)
        } else if (activeTab === 'pricing') {
          const data = await adminDatasource.getPricingData()
          setPricingData(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [activeTab, firebaseUser?.uid])

  const filteredProducts = useMemo(() => {
    const query = searchProduct.trim().toLowerCase()
    return products.filter((p) => {
      const matchesQuery = !query || p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
      const matchesCategory = category === 'All' || p.category === category
      const matchesGroup = group === 'All' || p.group === group
      return matchesQuery && matchesCategory && matchesGroup
    })
  }, [searchProduct, category, group, products])

  // Product CRUD
  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { setError('Product name is required'); return }
    setIsSaving(true)
    try {
      if (editingProduct) {
        const updated = await adminDatasource.updateCatalogProduct(editingProduct.id, productForm)
        setProducts((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogProduct(productForm)
        setProducts((p) => [created, ...p])
      }
      setIsProductFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await adminDatasource.deleteCatalogProduct(id)
      setProducts((p) => p.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Package CRUD
  const handleSavePackage = async () => {
    if (!packageForm.name.trim()) { setError('Package name is required'); return }
    setIsSaving(true)
    try {
      if (editingPackage) {
        const updated = await adminDatasource.updateCatalogPackage(editingPackage.id, packageForm)
        setPackages((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogPackage(packageForm)
        setPackages((p) => [created, ...p])
      }
      setIsPackageFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Delete this package?')) return
    try {
      await adminDatasource.deleteCatalogPackage(id)
      setPackages((p) => p.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Add-on CRUD
  const handleSaveAddon = async () => {
    if (!addonForm.name.trim()) { setError('Add-on name is required'); return }
    setIsSaving(true)
    try {
      if (editingAddon) {
        const updated = await adminDatasource.updateCatalogAddon(editingAddon.id, addonForm)
        setAddons((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogAddon(addonForm)
        setAddons((p) => [created, ...p])
      }
      setIsAddonFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAddon = async (id: string) => {
    if (!window.confirm('Delete this add-on?')) return
    try {
      await adminDatasource.deleteCatalogAddon(id)
      setAddons((p) => p.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Tax CRUD
  const handleSaveTax = async () => {
    if (!taxForm.name.trim()) { setError('Tax name is required'); return }
    setIsSaving(true)
    try {
      if (editingTax) {
        const updated = await adminDatasource.updateCatalogTax(editingTax.id, taxForm)
        setTaxes((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogTax(taxForm)
        setTaxes((p) => [created, ...p])
      }
      setIsTaxFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTax = async (id: string) => {
    if (!window.confirm('Delete this tax?')) return
    try {
      await adminDatasource.deleteCatalogTax(id)
      setTaxes((p) => p.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Recommendation CRUD
  const handleSaveRec = async () => {
    if (!recForm.name.trim()) { setError('Recommendation name is required'); return }
    if (recForm.productIds.length === 0) { setError('Select at least one product'); return }
    setIsSaving(true)
    try {
      const payload = normalizeRecForm()
      if (editingRec) {
        const updated = await adminDatasource.updateCatalogRecommendation(editingRec.recommendationId, payload)
        setRecommendations((p) => p.map((i) => (i.recommendationId === updated.recommendationId ? updated : i)))
      } else {
        const created = await adminDatasource.createCatalogRecommendation(payload)
        setRecommendations((p) => [created, ...p])
      }
      setIsRecFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRec = async (id: string) => {
    if (!window.confirm('Delete this recommendation?')) return
    try {
      await adminDatasource.deleteCatalogRecommendation(id)
      setRecommendations((p) => p.filter((i) => i.recommendationId !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const normalizeRecForm = () => {
    if (recForm.serviceTypes && recForm.serviceTypes.length > 0) {
      return recForm
    }

    return {
      ...recForm,
      serviceTypes: undefined
    }
  }

  // Invoice CRUD
  const handleSaveInvoice = async () => {
    if (!invoiceForm.name.trim()) { setError('Invoice name is required'); return }
    setIsSaving(true)
    try {
      if (editingInvoice) {
        const updated = await adminDatasource.updateInvoiceTemplate(editingInvoice.id, invoiceForm)
        setInvoices((p) => p.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        const created = await adminDatasource.createInvoiceTemplate(invoiceForm)
        setInvoices((p) => [created, ...p])
      }
      setIsInvoiceFormOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Delete this invoice template?')) return
    try {
      await adminDatasource.deleteInvoiceTemplate(id)
      setInvoices((p) => p.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="catalog-screen">
      <div className="catalog-header">
        <div>
          <h1>Accessories & Catalog</h1>
          <p className="catalog-subtitle">Manage products, pricing, packages, and recommendation items.</p>
        </div>
        <div className="catalog-actions">
          {['products', 'packages', 'addons', 'taxes', 'recommendations', 'invoices'].includes(activeTab) && (
            <button className="primary-btn" onClick={() => {
              if (activeTab === 'products') { setIsProductFormOpen(true) }
              else if (activeTab === 'packages') { setIsPackageFormOpen(true) }
              else if (activeTab === 'addons') { setIsAddonFormOpen(true) }
              else if (activeTab === 'taxes') { setIsTaxFormOpen(true) }
              else if (activeTab === 'recommendations') { setIsRecFormOpen(true) }
              else if (activeTab === 'invoices') { setIsInvoiceFormOpen(true) }
            }}>+ Add Item</button>
          )}
        </div>
      </div>

      <div className="catalog-tabs">
        {(['products', 'packages', 'addons', 'taxes', 'recommendations', 'invoices', 'services', 'upgrade', 'pricing'] as TabType[]).map((tab) => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'products' ? 'Products' : tab === 'packages' ? 'Packages' : tab === 'addons' ? 'Add-ons' : tab === 'taxes' ? 'Taxes' : tab === 'recommendations' ? 'Recommendations' : tab === 'invoices' ? 'Invoice Templates' : tab === 'services' ? 'Services' : tab === 'upgrade' ? 'Upgrade Bundles' : 'Pricing'}
          </button>
        ))}
      </div>

      {error && <div className="catalog-error">{error}</div>}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <>
          <div className="catalog-toolbar">
            <div className="toolbar-group">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="toolbar-group">
              <label htmlFor="group">Group</label>
              <select id="group" value={group} onChange={(e) => setGroup(e.target.value)}>
                {groups.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div className="toolbar-group search">
              <label htmlFor="search">Search</label>
              <input id="search" placeholder="Search product, ID, or keyword" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} />
            </div>
          </div>
          <div className="catalog-table-wrapper">
            {isLoading ? <div className="catalog-loading">Loading...</div> : (
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Group</th>
                    <th>Unit</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={7} className="empty-cell">No products found</td></tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td><div className="product-main"><span className="product-name">{p.name}</span><span className="product-id">{p.id}</span></div></td>
                        <td>{p.category}</td>
                        <td>{p.group}</td>
                        <td>{p.unit}</td>
                        <td>Rs {p.price.toLocaleString()}</td>
                        <td><span className={`status ${p.status}`}>{p.status}</span></td>
                        <td>
                          <button className="icon-btn" onClick={() => { setEditingProduct(p); setProductForm(p); setIsProductFormOpen(true) }}>Edit</button>
                          <button className="icon-btn danger" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* PACKAGES TAB */}
      {activeTab === 'packages' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Total Price</th>
                  <th>Discount %</th>
                  <th>Final Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr><td colSpan={7} className="empty-cell">No packages yet</td></tr>
                ) : (
                  packages.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.description}</td>
                      <td>Rs {p.totalPrice.toLocaleString()}</td>
                      <td>{p.discountPercent}%</td>
                      <td>Rs {p.finalPrice.toLocaleString()}</td>
                      <td><span className={`status ${p.status}`}>{p.status}</span></td>
                      <td>
                        <button className="icon-btn" onClick={() => { setEditingPackage(p); setPackageForm(p); setIsPackageFormOpen(true) }}>Edit</button>
                        <button className="icon-btn danger" onClick={() => handleDeletePackage(p.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ADD-ONS TAB */}
      {activeTab === 'addons' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addons.length === 0 ? (
                  <tr><td colSpan={6} className="empty-cell">No add-ons yet</td></tr>
                ) : (
                  addons.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.description}</td>
                      <td>{a.category}</td>
                      <td>Rs {a.price.toLocaleString()}</td>
                      <td><span className={`status ${a.status}`}>{a.status}</span></td>
                      <td>
                        <button className="icon-btn" onClick={() => { setEditingAddon(a); setAddonForm(a); setIsAddonFormOpen(true) }}>Edit</button>
                        <button className="icon-btn danger" onClick={() => handleDeleteAddon(a.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Icon</th>
                  <th>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No services found</td></tr>
                ) : (
                  services.map((service) => (
                    <tr key={service.id}>
                      <td>{service.id}</td>
                      <td>{service.title}</td>
                      <td>{service.icon}</td>
                      <td>{service.enabled ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'upgrade' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {upgradeBundles.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No upgrade bundles found</td></tr>
                ) : (
                  upgradeBundles.map((bundle) => (
                    <tr key={bundle.id}>
                      <td>{bundle.id}</td>
                      <td>{bundle.name}</td>
                      <td>{bundle.description}</td>
                      <td>Rs {bundle.price.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="catalog-pricing-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <div className="pricing-sections">
              {['installation', 'maintenance', 'repair'].map((section) => (
                <div key={section} className="pricing-card">
                  <h3>{section.charAt(0).toUpperCase() + section.slice(1)} Pricing</h3>
                  <pre>{JSON.stringify(pricingData[section as keyof PricingSet] || { message: 'Not available' }, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAXES TAB */}
      {activeTab === 'taxes' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Rate %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">No taxes yet</td></tr>
                ) : (
                  taxes.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.description}</td>
                      <td>{t.rate}%</td>
                      <td><span className={`status ${t.status}`}>{t.status}</span></td>
                      <td>
                        <button className="icon-btn" onClick={() => { setEditingTax(t); setTaxForm(t); setIsTaxFormOpen(true) }}>Edit</button>
                        <button className="icon-btn danger" onClick={() => handleDeleteTax(t.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Placement</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr><td colSpan={6} className="empty-cell">No recommendations yet</td></tr>
                ) : (
                  recommendations.map((r) => (
                    <tr key={r.recommendationId}>
                      <td>{r.name}</td>
                      <td>{r.description}</td>
                      <td>{r.placement}</td>
                      <td>{r.displayPriority}</td>
                      <td><span className={`status ${r.isAvailable ? 'active' : 'inactive'}`}>{r.isAvailable ? 'active' : 'inactive'}</span></td>
                      <td>
                        <button className="icon-btn" onClick={() => { setEditingRec(r); setRecForm({
                          name: r.name,
                          description: r.description || '',
                          productIds: r.productIds,
                          placement: r.placement,
                          serviceTypes: r.serviceTypes || [],
                          isAvailable: r.isAvailable,
                          displayPriority: r.displayPriority
                        }); setIsRecFormOpen(true) }}>Edit</button>
                        <button className="icon-btn danger" onClick={() => handleDeleteRec(r.recommendationId)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="catalog-table-wrapper">
          {isLoading ? <div className="catalog-loading">Loading...</div> : (
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Show Tax</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">No invoice templates yet</td></tr>
                ) : (
                  invoices.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td>{i.description}</td>
                      <td>{i.showTax ? 'Yes' : 'No'}</td>
                      <td><span className={`status ${i.status}`}>{i.status}</span></td>
                      <td>
                        <button className="icon-btn" onClick={() => { setEditingInvoice(i); setInvoiceForm(i); setIsInvoiceFormOpen(true) }}>Edit</button>
                        <button className="icon-btn danger" onClick={() => handleDeleteInvoice(i.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PRODUCT FORM MODAL */}
      {isProductFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="icon-btn" onClick={() => setIsProductFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} /></label>
              <label>Category <input value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} /></label>
              <label>Group <input value={productForm.group} onChange={(e) => setProductForm({...productForm, group: e.target.value})} /></label>
              <label>Unit <input value={productForm.unit} onChange={(e) => setProductForm({...productForm, unit: e.target.value})} /></label>
              <label>Price <input type="number" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})} /></label>
              <label>Status <select value={productForm.status} onChange={(e) => setProductForm({...productForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsProductFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveProduct} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* PACKAGE FORM MODAL */}
      {isPackageFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingPackage ? 'Edit Package' : 'Add Package'}</h2>
              <button className="icon-btn" onClick={() => setIsPackageFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={packageForm.name} onChange={(e) => setPackageForm({...packageForm, name: e.target.value})} /></label>
              <label>Description <textarea value={packageForm.description} onChange={(e) => setPackageForm({...packageForm, description: e.target.value})} /></label>
              <label>Total Price <input type="number" value={packageForm.totalPrice} onChange={(e) => setPackageForm({...packageForm, totalPrice: Number(e.target.value)})} /></label>
              <label>Discount % <input type="number" value={packageForm.discountPercent} onChange={(e) => setPackageForm({...packageForm, discountPercent: Number(e.target.value)})} /></label>
              <label>Final Price <input type="number" value={packageForm.finalPrice} onChange={(e) => setPackageForm({...packageForm, finalPrice: Number(e.target.value)})} /></label>
              <label>Status <select value={packageForm.status} onChange={(e) => setPackageForm({...packageForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsPackageFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSavePackage} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD-ON FORM MODAL */}
      {isAddonFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingAddon ? 'Edit Add-on' : 'Add Add-on'}</h2>
              <button className="icon-btn" onClick={() => setIsAddonFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={addonForm.name} onChange={(e) => setAddonForm({...addonForm, name: e.target.value})} /></label>
              <label>Description <textarea value={addonForm.description} onChange={(e) => setAddonForm({...addonForm, description: e.target.value})} /></label>
              <label>Category <input value={addonForm.category} onChange={(e) => setAddonForm({...addonForm, category: e.target.value})} /></label>
              <label>Price <input type="number" value={addonForm.price} onChange={(e) => setAddonForm({...addonForm, price: Number(e.target.value)})} /></label>
              <label>Status <select value={addonForm.status} onChange={(e) => setAddonForm({...addonForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsAddonFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveAddon} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* TAX FORM MODAL */}
      {isTaxFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingTax ? 'Edit Tax' : 'Add Tax'}</h2>
              <button className="icon-btn" onClick={() => setIsTaxFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={taxForm.name} onChange={(e) => setTaxForm({...taxForm, name: e.target.value})} /></label>
              <label>Description <textarea value={taxForm.description} onChange={(e) => setTaxForm({...taxForm, description: e.target.value})} /></label>
              <label>Rate (%) <input type="number" value={taxForm.rate} onChange={(e) => setTaxForm({...taxForm, rate: Number(e.target.value)})} /></label>
              <label>Status <select value={taxForm.status} onChange={(e) => setTaxForm({...taxForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsTaxFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveTax} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATION FORM MODAL */}
      {isRecFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingRec ? 'Edit Recommendation' : 'Add Recommendation'}</h2>
              <button className="icon-btn" onClick={() => setIsRecFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={recForm.name} onChange={(e) => setRecForm({...recForm, name: e.target.value})} /></label>
              <label>Description <textarea value={recForm.description} onChange={(e) => setRecForm({...recForm, description: e.target.value})} /></label>
              <label>Placement
                <select value={recForm.placement} onChange={(e) => setRecForm({...recForm, placement: e.target.value as CatalogRecommendation['placement']})}>
                  <option value="checkout">Checkout</option>
                  <option value="cart">Cart</option>
                  <option value="service">Service</option>
                  <option value="general">General</option>
                </select>
              </label>
              <label>Service Types
                <select multiple value={recForm.serviceTypes || []} onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((opt) => opt.value)
                  setRecForm({ ...recForm, serviceTypes: values as CatalogRecommendation['serviceTypes'] })
                }}>
                  <option value="installation">Installation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="amc">AMC</option>
                  <option value="repair">Repair</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="accessories">Accessories</option>
                </select>
              </label>
              <label>Product IDs (comma-separated)
                <input
                  value={recForm.productIds.join(', ')}
                  onChange={(e) => setRecForm({
                    ...recForm,
                    productIds: e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
                  })}
                />
              </label>
              <label>Display Priority <input type="number" value={recForm.displayPriority} onChange={(e) => setRecForm({...recForm, displayPriority: Number(e.target.value)})} /></label>
              <label>Status <select value={recForm.isAvailable ? 'active' : 'inactive'} onChange={(e) => setRecForm({...recForm, isAvailable: e.target.value === 'active'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsRecFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveRec} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE FORM MODAL */}
      {isInvoiceFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingInvoice ? 'Edit Invoice Template' : 'Add Invoice Template'}</h2>
              <button className="icon-btn" onClick={() => setIsInvoiceFormOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Name <input value={invoiceForm.name} onChange={(e) => setInvoiceForm({...invoiceForm, name: e.target.value})} /></label>
              <label>Description <textarea value={invoiceForm.description} onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})} /></label>
              <label>Terms <textarea value={invoiceForm.terms} onChange={(e) => setInvoiceForm({...invoiceForm, terms: e.target.value})} /></label>
              <label>Notes <textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})} /></label>
              <label><input type="checkbox" checked={invoiceForm.showTax} onChange={(e) => setInvoiceForm({...invoiceForm, showTax: e.target.checked})} /> Show Tax</label>
              <label>Status <select value={invoiceForm.status} onChange={(e) => setInvoiceForm({...invoiceForm, status: e.target.value as 'active' | 'inactive'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsInvoiceFormOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveInvoice} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
